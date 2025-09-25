import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.operaciones.models import (
    MetodoFinanciero,
    MetodoFinancieroDetalle,
    CuentaBancaria,
    BilleteraDigital,
    Tarjeta,
    TarjetaLocal,
    TipoMetodoFinanciero,
    Banco,
    BilleteraDigitalCatalogo,
    TarjetaLocalCatalogo,
    Cheque,
    Transaccion
)

from apps.tauser.models import Tauser
from django.utils import timezone

from apps.operaciones.services import (
    _inferir_operacion,
    calcular_simulacion_operacion_privada,
    calcular_simulacion_operacion_publica,
    calcular_simulacion_operacion_privada_con_instancia,
    listar_metodos_cliente_por_divisas
)

from apps.divisas.models import Divisa
from apps.cotizaciones.models import Tasa
from apps.clientes.models import Cliente, CategoriaCliente

pytestmark = pytest.mark.django_db

User = get_user_model()


# Fixtures
@pytest.fixture
def admin_user():
    return User.objects.create_superuser(username='admin', email='admin@example.com', password='adminpass')


@pytest.fixture
def api_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def metodo_data():
    return {
        'nombre': TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA,
        'permite_cobro': True,
        'permite_pago': True,
        'comision_cobro_porcentaje': '0.00',
        'comision_pago_porcentaje': '0.00',
    }


@pytest.fixture
def detalle_data():
    # es_cuenta_casa True -> cliente puede ser null
    return {
        'es_cuenta_casa': True,
        'alias': 'Casa Principal',
    }


@pytest.fixture
def banco_instance():
    banco, _ = Banco.objects.get_or_create(
        nombre='Banco Test',
        defaults={
            'cvu': '0000000000000000000000',
            'comision_compra': 2.50,
            'comision_venta': 2.00,
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': False
        }
    )
    return banco

@pytest.fixture
def cuenta_data(banco_instance):
    return {
        'banco': banco_instance.id,  # Para API - usar ID
        'numero_cuenta': '123456789',
        'titular': 'Casa Cambio',
        'cbu_cvu': '0000000000000000000000',
    }

@pytest.fixture
def cuenta_data_orm(banco_instance):
    return {
        'banco': banco_instance,  # Para ORM - usar instancia
        'numero_cuenta': '123456789',
        'titular': 'Casa Cambio',
        'cbu_cvu': '0000000000000000000000',
    }


@pytest.fixture
def plataforma_instance():
    plataforma, _ = BilleteraDigitalCatalogo.objects.get_or_create(
        nombre='MercadoPago',
        defaults={
            'comision_compra': 3.00,
            'comision_venta': 2.50,
            'comision_personalizada_compra': False,
            'comision_personalizada_venta': True
        }
    )
    return plataforma

@pytest.fixture
def billetera_data(plataforma_instance):
    return {
        'plataforma': plataforma_instance.id,  # Para API - usar ID
        'usuario_id': 'user_mp_1',
        'email': 'mp@example.com',
        'telefono': '555-0000',
        'alias_billetera': 'MP-Casa'
    }

@pytest.fixture
def billetera_data_orm(plataforma_instance):
    return {
        'plataforma': plataforma_instance,  # Para ORM - usar instancia
        'usuario_id': 'user_mp_1',
        'email': 'mp@example.com',
        'telefono': '555-0000',
        'alias_billetera': 'MP-Casa'
    }


@pytest.fixture
def tarjeta_local_catalogo_instance():
    catalogo, _ = TarjetaLocalCatalogo.objects.get_or_create(
        marca='Visa',
        defaults={
            'comision_compra': 3.20,
            'comision_venta': 2.80,
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': True
        }
    )
    return catalogo


@pytest.fixture
def tarjeta_data():
    return {
        'tipo': 'STRIPE',
        'payment_method_id': 'pm_test_123',
        'brand': 'VISA',
        'last4': '4242',
        'exp_month': 12,
        'exp_year': 2030,
        'titular': 'Casa Cambio'
    }


@pytest.fixture
def tarjeta_local_data(tarjeta_local_catalogo_instance):
    return {
        'marca': tarjeta_local_catalogo_instance.id,  # Para API - usar ID
        'last4': '1234',
        'titular': 'Juan Perez',
        'exp_month': 8,
        'exp_year': 2028
    }

@pytest.fixture
def tarjeta_local_data_orm(tarjeta_local_catalogo_instance):
    return {
        'marca': tarjeta_local_catalogo_instance,  # Para ORM - usar instancia
        'last4': '1234',
        'titular': 'Juan Perez',
        'exp_month': 8,
        'exp_year': 2028
    }


@pytest.fixture
def setup_divisas_y_tasa():
    """Fixture para crear divisas y tasa necesarias para simulaciones"""
    base = Divisa.objects.create(codigo="PYG", nombre="Guaraní", simbolo="₲", es_base=True)
    usd = Divisa.objects.create(codigo="USD", nombre="Dólar", simbolo="$", es_base=False)
    tasa = Tasa.objects.create(
        divisa=usd, 
        precioBase=Decimal("7300"), 
        comisionBaseCompra=Decimal("100"), 
        comisionBaseVenta=Decimal("100"), 
        activo=True
    )
    return {'base': base, 'usd': usd, 'tasa': tasa}


@pytest.fixture
def cliente_con_categoria():
    """Fixture para crear cliente con categoría"""
    categoria, _ = CategoriaCliente.objects.get_or_create(
        nombre="VIP", 
        defaults={'descuento': 10}
    )
    cliente = Cliente.objects.create(
        nombre="Juan Perez", 
        correo="juan@example.com",
        telefono="+595981123456",
        idCategoria=categoria
    )
    return cliente


# Tests
class TestMetodoFinancieroAPI:
    def test_crear_metodo_api(self, api_client, metodo_data):
        response = api_client.post('/api/operaciones/metodos/', metodo_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert MetodoFinanciero.objects.count() == 1

    def test_listar_metodos_api(self, api_client, metodo_data):
        # crear uno por ORM
        MetodoFinanciero.objects.create(**metodo_data)
        response = api_client.get('/api/operaciones/metodos/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_eliminar_metodo_soft_delete(self, api_client, metodo_data):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        response = api_client.delete(f'/api/operaciones/metodos/{metodo.id}/')
        assert response.status_code == status.HTTP_200_OK
        metodo.refresh_from_db()
        assert metodo.is_active is False


class TestMetodoFinancieroDetalleAPI:
    def test_crear_detalle_api(self, api_client, metodo_data, detalle_data):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        payload = detalle_data.copy()
        payload['metodo_financiero'] = metodo.id

        response = api_client.post('/api/operaciones/detalles/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert MetodoFinancieroDetalle.objects.count() == 1

    def test_eliminar_detalle_soft_delete(self, api_client, metodo_data, detalle_data):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='D1')
        response = api_client.delete(f'/api/operaciones/detalles/{detalle.id}/')
        assert response.status_code == status.HTTP_200_OK
        detalle.refresh_from_db()
        assert detalle.is_active is False

    def test_toggle_active_detalle(self, api_client, metodo_data):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(
            metodo_financiero=metodo, 
            es_cuenta_casa=True, 
            alias='Toggle Test'
        )
        
        response = api_client.post(f'/api/operaciones/detalles/{detalle.id}/toggle_active/')
        assert response.status_code == status.HTTP_200_OK
        detalle.refresh_from_db()
        assert detalle.is_active is False


class TestCuentasBancariasAPI:
    def test_crear_cuenta_api(self, api_client, metodo_data, detalle_data, cuenta_data):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='Casa-Acc')

        payload = cuenta_data.copy()
        payload['metodo_financiero_detalle'] = detalle.id

        response = api_client.post('/api/operaciones/cuentas-bancarias/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert CuentaBancaria.objects.count() == 1

    def test_eliminar_cuenta_desactiva_detalle(self, api_client, metodo_data, detalle_data, cuenta_data_orm):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='Casa-Acc2')
        cuenta = CuentaBancaria.objects.create(metodo_financiero_detalle=detalle, **cuenta_data_orm)

        response = api_client.delete(f'/api/operaciones/cuentas-bancarias/{cuenta.id}/')
        assert response.status_code == status.HTTP_200_OK
        detalle.refresh_from_db()
        assert detalle.is_active is False


class TestBilleteraDigitalAPI:
    def test_crear_billetera_api(self, api_client, metodo_data, detalle_data, billetera_data):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='Casa-Billetera')

        payload = billetera_data.copy()
        payload['metodo_financiero_detalle'] = detalle.id

        response = api_client.post('/api/operaciones/billeteras-digitales/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert BilleteraDigital.objects.count() == 1

    def test_eliminar_billetera_desactiva_detalle(self, api_client, metodo_data, detalle_data, billetera_data_orm):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='Casa-Bill2')
        billetera = BilleteraDigital.objects.create(metodo_financiero_detalle=detalle, **billetera_data_orm)

        response = api_client.delete(f'/api/operaciones/billeteras-digitales/{billetera.id}/')
        assert response.status_code == status.HTTP_200_OK
        detalle.refresh_from_db()
        assert detalle.is_active is False


class TestTarjetaAPI:
    def test_crear_tarjeta_api(self, api_client, metodo_data, detalle_data, tarjeta_data):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='Casa-Tarj')

        payload = tarjeta_data.copy()
        payload['metodo_financiero_detalle'] = detalle.id

        response = api_client.post('/api/operaciones/tarjetas/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Tarjeta.objects.count() == 1

    def test_eliminar_tarjeta_desactiva_detalle(self, api_client, metodo_data, detalle_data, tarjeta_data):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='Casa-Tarj2')
        tarjeta = Tarjeta.objects.create(metodo_financiero_detalle=detalle, **tarjeta_data)

        response = api_client.delete(f'/api/operaciones/tarjetas/{tarjeta.id}/')
        assert response.status_code == status.HTTP_200_OK
        detalle.refresh_from_db()
        assert detalle.is_active is False


class TestTarjetaLocalAPI:
    def test_crear_tarjeta_local_api(self, api_client, metodo_data, detalle_data, tarjeta_local_data):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='Casa-TarjLocal')

        payload = tarjeta_local_data.copy()
        payload['metodo_financiero_detalle'] = detalle.id

        response = api_client.post('/api/operaciones/tarjetas-locales/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert TarjetaLocal.objects.count() == 1

    def test_eliminar_tarjeta_local_desactiva_detalle(self, api_client, metodo_data, detalle_data, tarjeta_local_data_orm):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='Casa-TarjLocal2')
        tarjeta_local = TarjetaLocal.objects.create(metodo_financiero_detalle=detalle, **tarjeta_local_data_orm)

        response = api_client.delete(f'/api/operaciones/tarjetas-locales/{tarjeta_local.id}/')
        assert response.status_code == status.HTTP_200_OK
        detalle.refresh_from_db()
        assert detalle.is_active is False


class TestCatalogosAPI:
    """Tests para los ViewSets de catálogos con nuevos campos"""
    
    def test_crear_banco_con_comisiones(self, api_client):
        banco_data = {
            'nombre': 'Banco Test API',
            'cvu': '1111111111111111111111',
            'comision_compra': '2.5',
            'comision_venta': '2.0',
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': False
        }
        response = api_client.post('/api/operaciones/bancos/', banco_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Banco.objects.count() == 1
        
        banco = Banco.objects.first()
        assert banco.comision_compra == Decimal('2.5')
        assert banco.comision_personalizada_compra is True

    def test_toggle_active_banco_desactiva_cuentas(self, api_client, banco_instance, metodo_data, cuenta_data_orm):
        # Crear cuenta asociada al banco
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(
            metodo_financiero=metodo, 
            es_cuenta_casa=True, 
            alias='Cuenta Test'
        )
        cuenta = CuentaBancaria.objects.create(
            metodo_financiero_detalle=detalle, 
            **cuenta_data_orm
        )
        
        # Desactivar banco
        response = api_client.post(f'/api/operaciones/bancos/{banco_instance.id}/toggle_active/')
        assert response.status_code == status.HTTP_200_OK
        
        # Verificar que cuenta se desactivó
        detalle.refresh_from_db()
        assert detalle.is_active is False
        assert detalle.desactivado_por_catalogo is True

    def test_crear_billetera_catalogo_con_comisiones(self, api_client):
        billetera_data = {
            'nombre': 'PayPal Test',
            'comision_compra': '4.2',
            'comision_venta': '3.8',
            'comision_personalizada_compra': False,
            'comision_personalizada_venta': True
        }
        response = api_client.post('/api/operaciones/billeteras-catalogo/', billetera_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        billetera = BilleteraDigitalCatalogo.objects.first()
        assert billetera.comision_compra == Decimal('4.2')
        assert billetera.comision_personalizada_venta is True

    def test_crear_tarjeta_local_catalogo_con_comisiones(self, api_client):
        tarjeta_data = {
            'marca': 'Mastercard Test',
            'comision_compra': '3.1',
            'comision_venta': '2.7',
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': False
        }
        response = api_client.post('/api/operaciones/tarjetas-locales-catalogo/', tarjeta_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        tarjeta = TarjetaLocalCatalogo.objects.first()
        assert tarjeta.comision_compra == Decimal('3.1')
        assert tarjeta.comision_personalizada_compra is True


#===============================SIMULACION SERVICES TESTS=================================

def test_inferir_operacion_compra_y_venta(setup_divisas_y_tasa):
    base = setup_divisas_y_tasa['base']
    usd = setup_divisas_y_tasa['usd']

    cliente_op, casa_op = _inferir_operacion(base, usd)
    assert cliente_op == "compra"
    assert casa_op == "venta"

    cliente_op, casa_op = _inferir_operacion(usd, base)
    assert cliente_op == "venta"
    assert casa_op == "compra"


def test_calcular_simulacion_operacion_privada(setup_divisas_y_tasa, cliente_con_categoria):
    base = setup_divisas_y_tasa['base']
    usd = setup_divisas_y_tasa['usd']
    cliente = cliente_con_categoria
    
    metodo = MetodoFinanciero.objects.create(
        nombre=TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA, 
        comision_pago_porcentaje=2, 
        comision_cobro_porcentaje=3,
        permite_pago=True, 
        permite_cobro=True, 
        is_active=True
    )

    # Ejecutar simulación
    resultado = calcular_simulacion_operacion_privada(
        cliente_id=cliente.idCliente,
        divisa_origen_id=base.id,
        divisa_destino_id=usd.id,
        monto=1000,
        metodo_id=metodo.id
    )

    assert resultado["operacion_cliente"] == "compra"
    assert resultado["operacion_casa"] == "venta"
    assert "tc_final" in resultado
    assert "monto_destino" in resultado
    assert "parametros" in resultado
    assert resultado["parametros"]["nombre_categoria"] == "VIP"
    assert resultado["parametros"]["descuento_categoria"] == 10


def test_calcular_simulacion_operacion_publica(setup_divisas_y_tasa):
    base = setup_divisas_y_tasa['base']
    usd = setup_divisas_y_tasa['usd']
    
    metodo = MetodoFinanciero.objects.create(
        nombre=TipoMetodoFinanciero.EFECTIVO, 
        comision_pago_porcentaje=1, 
        comision_cobro_porcentaje=2,
        permite_pago=True, 
        permite_cobro=True, 
        is_active=True
    )

    resultado = calcular_simulacion_operacion_publica(
        divisa_origen_id=base.id,
        divisa_destino_id=usd.id,
        monto=5000,
        metodo_id=metodo.id
    )

    assert resultado["operacion_cliente"] == "compra"
    assert resultado["divisa_origen"] == "PYG"
    assert resultado["divisa_destino"] == "USD"
    # No debe tener información de categoría en simulación pública
    assert "nombre_categoria" not in resultado["parametros"]


def test_calcular_simulacion_operacion_privada_con_instancia_detalle_metodo(
    setup_divisas_y_tasa, 
    cliente_con_categoria, 
    banco_instance
):
    """Test simulación con instancia específica (detalle_metodo_id)"""
    base = setup_divisas_y_tasa['base']
    usd = setup_divisas_y_tasa['usd']
    cliente = cliente_con_categoria
    
    # Crear método y detalle específico
    metodo = MetodoFinanciero.objects.create(
        nombre=TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA,
        comision_pago_porcentaje=1.5,
        comision_cobro_porcentaje=2.0,
        permite_pago=True,
        permite_cobro=True,
        is_active=True
    )
    
    detalle = MetodoFinancieroDetalle.objects.create(
        cliente=cliente,
        metodo_financiero=metodo,
        alias='Mi Cuenta Galicia'
    )
    
    cuenta = CuentaBancaria.objects.create(
        metodo_financiero_detalle=detalle,
        banco=banco_instance,
        numero_cuenta='123456789',
        titular=cliente.nombre,
        cbu_cvu='0070123456789012345678'
    )

    # Ejecutar simulación con instancia específica
    resultado = calcular_simulacion_operacion_privada_con_instancia(
        cliente_id=cliente.idCliente,
        divisa_origen_id=base.id,
        divisa_destino_id=usd.id,
        monto=1000,
        detalle_metodo_id=detalle.id,
        metodo_id=None
    )

    assert resultado["operacion_cliente"] == "compra"
    assert resultado["operacion_casa"] == "venta"
    assert "Mi Cuenta Galicia" in resultado["parametros"]["nombre_metodo"]
    assert "Transferencia Bancaria" in resultado["parametros"]["nombre_metodo"]
    # Debe usar comisión específica del banco si está habilitada
    if banco_instance.comision_personalizada_venta:
        assert resultado["parametros"]["comision_metodo"] == float(banco_instance.comision_venta)
    else:
        assert resultado["parametros"]["comision_metodo"] == float(metodo.comision_cobro_porcentaje)


def test_calcular_simulacion_operacion_privada_con_instancia_metodo_generico(
    setup_divisas_y_tasa, 
    cliente_con_categoria
):
    """Test simulación con método genérico (metodo_id)"""
    base = setup_divisas_y_tasa['base']
    usd = setup_divisas_y_tasa['usd']
    cliente = cliente_con_categoria
    
    metodo = MetodoFinanciero.objects.create(
        nombre=TipoMetodoFinanciero.EFECTIVO,
        comision_pago_porcentaje=0.5,
        comision_cobro_porcentaje=1.0,
        permite_pago=True,
        permite_cobro=True,
        is_active=True
    )

    # Ejecutar simulación con método genérico
    resultado = calcular_simulacion_operacion_privada_con_instancia(
        cliente_id=cliente.idCliente,
        divisa_origen_id=base.id,
        divisa_destino_id=usd.id,
        monto=2000,
        detalle_metodo_id=None,
        metodo_id=metodo.id
    )

    assert resultado["operacion_cliente"] == "compra"
    assert resultado["parametros"]["nombre_metodo"] == "Efectivo"
    assert resultado["parametros"]["comision_metodo"] == 1.0  # comision_cobro_porcentaje


def test_listar_metodos_cliente_por_divisas(
    setup_divisas_y_tasa, 
    cliente_con_categoria, 
    banco_instance, 
    plataforma_instance
):
    """Test servicio que lista métodos del cliente organizados por tipo"""
    base = setup_divisas_y_tasa['base']
    usd = setup_divisas_y_tasa['usd']
    cliente = cliente_con_categoria
    
    # Crear métodos financieros
    metodo_transferencia = MetodoFinanciero.objects.create(
        nombre=TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA,
        permite_pago=True,
        permite_cobro=True,
        is_active=True
    )
    
    metodo_billetera = MetodoFinanciero.objects.create(
        nombre=TipoMetodoFinanciero.BILLETERA_DIGITAL,
        permite_pago=True,
        permite_cobro=True,
        is_active=True
    )
    
    # Crear instancias específicas del cliente
    detalle_cuenta = MetodoFinancieroDetalle.objects.create(
        cliente=cliente,
        metodo_financiero=metodo_transferencia,
        alias='Mi Cuenta Banco'
    )
    
    cuenta = CuentaBancaria.objects.create(
        metodo_financiero_detalle=detalle_cuenta,
        banco=banco_instance,
        numero_cuenta='987654321',
        titular=cliente.nombre,
        cbu_cvu='0070987654321098765432'
    )
    
    detalle_billetera = MetodoFinancieroDetalle.objects.create(
        cliente=cliente,
        metodo_financiero=metodo_billetera,
        alias='Mi MercadoPago'
    )
    
    billetera = BilleteraDigital.objects.create(
        metodo_financiero_detalle=detalle_billetera,
        plataforma=plataforma_instance,
        usuario_id=cliente.correo,
        email=cliente.correo,
        telefono=cliente.telefono,
        alias_billetera='CLIENTE.MP'
    )

    # Ejecutar servicio
    operacion_casa, metodos_organizados = listar_metodos_cliente_por_divisas(
        cliente.idCliente,
        base.id,
        usd.id
    )

    assert operacion_casa == "venta"  # Casa vende USD, cliente compra
    assert TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA in metodos_organizados
    assert TipoMetodoFinanciero.BILLETERA_DIGITAL in metodos_organizados
    
    # Verificar estructura de transferencia bancaria
    transferencia_data = metodos_organizados[TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA]
    assert transferencia_data['metodo_financiero']['id'] == metodo_transferencia.id
    assert len(transferencia_data['instancias']) == 1
    
    instancia_cuenta = transferencia_data['instancias'][0]
    assert instancia_cuenta['alias'] == 'Mi Cuenta Banco'
    assert instancia_cuenta['tipo_especifico'] == 'cuenta_bancaria'
    assert instancia_cuenta['detalles']['banco_nombre'] == banco_instance.nombre
    
    # Verificar estructura de billetera digital
    billetera_data = metodos_organizados[TipoMetodoFinanciero.BILLETERA_DIGITAL]
    assert len(billetera_data['instancias']) == 1
    
    instancia_billetera = billetera_data['instancias'][0]
    assert instancia_billetera['alias'] == 'Mi MercadoPago'
    assert instancia_billetera['tipo_especifico'] == 'billetera_digital'
    assert instancia_billetera['detalles']['plataforma_nombre'] == plataforma_instance.nombre


#===============================SIMULACION VIEWS TESTS=================================

@pytest.mark.django_db
def test_simular_operacion_publica_endpoint(setup_divisas_y_tasa):
    client = APIClient()
    base = setup_divisas_y_tasa['base']
    usd = setup_divisas_y_tasa['usd']
    
    metodo = MetodoFinanciero.objects.create(
        nombre=TipoMetodoFinanciero.EFECTIVO, 
        comision_pago_porcentaje=1, 
        comision_cobro_porcentaje=2,
        permite_pago=True, 
        permite_cobro=True, 
        is_active=True
    )

    url = reverse("simular-operacion-publica")
    payload = {
        "divisa_origen": base.id,
        "divisa_destino": usd.id,
        "monto": 1000,
        "metodo_id": metodo.id
    }

    response = client.post(url, payload, format="json")
    assert response.status_code == 200
    data = response.json()
    assert data["operacion_cliente"] == "compra"
    assert "monto_destino" in data


def test_simular_operacion_privada_endpoint_authenticated(setup_divisas_y_tasa, cliente_con_categoria):
    client = APIClient()
    base = setup_divisas_y_tasa['base']
    usd = setup_divisas_y_tasa['usd']
    cliente = cliente_con_categoria

    # Crear usuario autenticado
    user = User.objects.create_user(username="test", password="1234")
    client.force_authenticate(user=user)

    metodo = MetodoFinanciero.objects.create(
        nombre=TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA, 
        comision_pago_porcentaje=2, 
        comision_cobro_porcentaje=3,
        permite_pago=True, 
        permite_cobro=True, 
        is_active=True
    )

    url = reverse("simular-operacion-privada")
    payload = {
        "cliente_id": cliente.idCliente,
        "divisa_origen": base.id,
        "divisa_destino": usd.id,
        "monto": 2000,
        "metodo_id": metodo.id
    }

    response = client.post(url, payload, format="json")
    assert response.status_code == 200
    data = response.json()
    assert data["operacion_casa"] == "venta"
    assert "tc_final" in data
    assert data["parametros"]["nombre_categoria"] == "VIP"


def test_simular_operacion_privada_con_instancia_endpoint(
    setup_divisas_y_tasa, 
    cliente_con_categoria, 
    banco_instance
):
    """Test nuevo endpoint de simulación con instancia específica"""
    client = APIClient()
    base = setup_divisas_y_tasa['base']
    usd = setup_divisas_y_tasa['usd']
    cliente = cliente_con_categoria

    # Crear usuario autenticado
    user = User.objects.create_user(username="test_instancia", password="1234")
    client.force_authenticate(user=user)

    # Crear método y detalle específico
    metodo = MetodoFinanciero.objects.create(
        nombre=TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA,
        comision_pago_porcentaje=1.5,
        comision_cobro_porcentaje=2.5,
        permite_pago=True,
        permite_cobro=True,
        is_active=True
    )
    
    detalle = MetodoFinancieroDetalle.objects.create(
        cliente=cliente,
        metodo_financiero=metodo,
        alias='Cuenta Test Endpoint'
    )
    
    cuenta = CuentaBancaria.objects.create(
        metodo_financiero_detalle=detalle,
        banco=banco_instance,
        numero_cuenta='111222333',
        titular=cliente.nombre,
        cbu_cvu='0070111222333444555666'
    )

    url = reverse("simular-operacion-privada-con-instancia")
    
    # Test con detalle_metodo_id (instancia específica)
    payload_instancia = {
        "cliente_id": cliente.idCliente,
        "divisa_origen": base.id,
        "divisa_destino": usd.id,
        "monto": 1500,
        "detalle_metodo_id": detalle.id
    }

    response = client.post(url, payload_instancia, format="json")
    assert response.status_code == 200
    data = response.json()
    assert data["operacion_casa"] == "venta"
    assert "Cuenta Test Endpoint" in data["parametros"]["nombre_metodo"]
    assert "tc_final" in data

    # Test con metodo_id (método genérico)
    payload_generico = {
        "cliente_id": cliente.idCliente,
        "divisa_origen": base.id,
        "divisa_destino": usd.id,
        "monto": 1500,
        "metodo_id": metodo.id
    }

    response = client.post(url, payload_generico, format="json")
    assert response.status_code == 200
    data = response.json()
    assert data["parametros"]["nombre_metodo"] == "Transferencia Bancaria"

    # Test error: ambos parámetros
    payload_error = {
        "cliente_id": cliente.idCliente,
        "divisa_origen": base.id,
        "divisa_destino": usd.id,
        "monto": 1500,
        "detalle_metodo_id": detalle.id,
        "metodo_id": metodo.id
    }

    response = client.post(url, payload_error, format="json")
    assert response.status_code == 400

    # Test error: ningún parámetro
    payload_error2 = {
        "cliente_id": cliente.idCliente,
        "divisa_origen": base.id,
        "divisa_destino": usd.id,
        "monto": 1500
    }

    response = client.post(url, payload_error2, format="json")
    assert response.status_code == 400


def test_listar_metodos_disponibles_endpoint(setup_divisas_y_tasa):
    """Test endpoint público que lista métodos disponibles"""
    client = APIClient()
    base = setup_divisas_y_tasa['base']
    usd = setup_divisas_y_tasa['usd']
    
    # Crear métodos con diferentes capacidades
    metodo_pago = MetodoFinanciero.objects.create(
        nombre=TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA,
        permite_pago=True,
        permite_cobro=False,
        is_active=True
    )
    
    metodo_cobro = MetodoFinanciero.objects.create(
        nombre=TipoMetodoFinanciero.TARJETA,
        permite_pago=False,
        permite_cobro=True,
        is_active=True
    )

    url = reverse("listar-metodos-disponibles")
    
    # Test operación de compra (casa vende)
    response = client.get(url, {
        "divisa_origen": base.id,
        "divisa_destino": usd.id
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["operacion_casa"] == "venta"
    # Solo debe incluir métodos que permiten cobro
    metodos_nombres = [m["nombre"] for m in data["metodos"]]
    assert TipoMetodoFinanciero.TARJETA in metodos_nombres
    assert TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA not in metodos_nombres


def test_listar_metodos_cliente_endpoint(
    setup_divisas_y_tasa, 
    cliente_con_categoria, 
    banco_instance
):
    """Test nuevo endpoint que lista métodos del cliente organizados"""
    client = APIClient()
    base = setup_divisas_y_tasa['base']
    usd = setup_divisas_y_tasa['usd']
    cliente = cliente_con_categoria

    # Crear usuario autenticado
    user = User.objects.create_user(username="test_metodos_cliente", password="1234")
    client.force_authenticate(user=user)

    # Crear método y instancia del cliente
    metodo = MetodoFinanciero.objects.create(
        nombre=TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA,
        permite_pago=True,
        permite_cobro=True,
        is_active=True
    )
    
    detalle = MetodoFinancieroDetalle.objects.create(
        cliente=cliente,
        metodo_financiero=metodo,
        alias='Cuenta Endpoint Test'
    )
    
    cuenta = CuentaBancaria.objects.create(
        metodo_financiero_detalle=detalle,
        banco=banco_instance,
        numero_cuenta='999888777',
        titular=cliente.nombre,
        cbu_cvu='0070999888777666555444'
    )

    url = reverse("listar-metodos-cliente")
    response = client.get(url, {
        "cliente_id": cliente.idCliente,
        "divisa_origen": base.id,
        "divisa_destino": usd.id
    })

    assert response.status_code == 200
    data = response.json()
    assert data["operacion_casa"] == "venta"
    assert TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA in data["metodos"]
    
    transferencia_data = data["metodos"][TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA]
    assert len(transferencia_data["instancias"]) == 1
    assert transferencia_data["instancias"][0]["alias"] == "Cuenta Endpoint Test"


# =============================== CHEQUE ENDPOINTS ==================================
def test_cheque_tipos_endpoint():
    """Test endpoint que devuelve tipos de cheque"""
    client = APIClient()
    url = reverse('cheque-tipos')
    response = client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.data, list)
    assert len(response.data) >= 1
    assert 'value' in response.data[0] and 'label' in response.data[0]


def test_cheque_divisas_endpoint():
    """Test endpoint que devuelve divisas permitidas para cheques"""
    client = APIClient()
    url = reverse('cheque-divisas')
    response = client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.data, list)
    assert len(response.data) >= 1
    assert 'value' in response.data[0] and 'label' in response.data[0]


# Tests para los campos de comisiones en catálogos actualizados
class TestCatalogoComisionesActualizados:
    """Pruebas para los campos de comisiones diferenciadas en catálogos"""
    
    def test_banco_campos_comisiones_diferenciadas(self):
        """Verifica que el modelo Banco tenga los campos de comisiones diferenciadas"""
        banco = Banco.objects.create(
            nombre='Banco Comisiones Diferenciadas',
            cvu='1234567890123456789012',
            comision_compra=2.75,
            comision_venta=2.25,
            comision_personalizada_compra=True,
            comision_personalizada_venta=False
        )
        
        assert banco.comision_compra == 2.75
        assert banco.comision_venta == 2.25
        assert banco.comision_personalizada_compra is True
        assert banco.comision_personalizada_venta is False
        assert banco.is_active is True
    
    def test_billetera_digital_campos_comisiones_diferenciadas(self):
        """Verifica que BilleteraDigitalCatalogo tenga comisiones diferenciadas"""
        billetera = BilleteraDigitalCatalogo.objects.create(
            nombre='PayPal Diferenciado',
            comision_compra=4.20,
            comision_venta=3.80,
            comision_personalizada_compra=False,
            comision_personalizada_venta=True
        )
        
        assert billetera.comision_compra == 4.20
        assert billetera.comision_venta == 3.80
        assert billetera.comision_personalizada_compra is False
        assert billetera.comision_personalizada_venta is True
    
    def test_tarjeta_local_campos_comisiones_diferenciadas(self):
        """Verifica que TarjetaLocalCatalogo tenga comisiones diferenciadas"""
        tarjeta = TarjetaLocalCatalogo.objects.create(
            marca='Visa Diferenciada',
            comision_compra=3.20,
            comision_venta=2.80,
            comision_personalizada_compra=True,
            comision_personalizada_venta=True
        )
        
        assert tarjeta.comision_compra == 3.20
        assert tarjeta.comision_venta == 2.80
        assert tarjeta.comision_personalizada_compra is True
        assert tarjeta.comision_personalizada_venta is True
    
    def test_valores_por_defecto_comisiones_diferenciadas(self):
        """Verifica valores por defecto de comisiones diferenciadas"""
        banco = Banco.objects.create(
            nombre='Banco Default Diferenciado',
            cvu='0987654321098765432109'
        )
        billetera = BilleteraDigitalCatalogo.objects.create(
            nombre='Billetera Default Diferenciada'
        )
        tarjeta = TarjetaLocalCatalogo.objects.create(
            marca='Tarjeta Default Diferenciada'
        )
        
        # Verificar valores por defecto
        assert banco.comision_compra == 0.00
        assert banco.comision_venta == 0.00
        assert banco.comision_personalizada_compra is False
        assert banco.comision_personalizada_venta is False
        
        assert billetera.comision_compra == 0.00
        assert billetera.comision_venta == 0.00
        assert billetera.comision_personalizada_compra is False
        assert billetera.comision_personalizada_venta is False
        
        assert tarjeta.comision_compra == 0.00
        assert tarjeta.comision_venta == 0.00
        assert tarjeta.comision_personalizada_compra is False
        assert tarjeta.comision_personalizada_venta is False


class TestComisionEspecifica:
    """Tests para la lógica de comisión específica por catálogo"""
    
    def test_simulacion_usa_comision_banco_cuando_habilitada(
        self, 
        setup_divisas_y_tasa, 
        cliente_con_categoria
    ):
        """Test que simulación use comisión específica del banco cuando está habilitada"""
        base = setup_divisas_y_tasa['base']
        usd = setup_divisas_y_tasa['usd']
        cliente = cliente_con_categoria
        
        # Banco con comisión personalizada habilitada
        banco = Banco.objects.create(
            nombre='Banco Comision Personalizada',
            cvu='5555555555555555555555',
            comision_compra=1.0,  # Casa compra = cliente vende
            comision_venta=3.0,   # Casa vende = cliente compra
            comision_personalizada_compra=True,
            comision_personalizada_venta=True
        )
        
        metodo = MetodoFinanciero.objects.create(
            nombre=TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA,
            comision_pago_porcentaje=5.0,    # Por defecto - no debe usarse
            comision_cobro_porcentaje=5.0,   # Por defecto - no debe usarse
            permite_pago=True,
            permite_cobro=True,
            is_active=True
        )
        
        detalle = MetodoFinancieroDetalle.objects.create(
            cliente=cliente,
            metodo_financiero=metodo,
            alias='Cuenta Comision Personalizada'
        )
        
        cuenta = CuentaBancaria.objects.create(
            metodo_financiero_detalle=detalle,
            banco=banco,
            numero_cuenta='555000111',
            titular=cliente.nombre,
            cbu_cvu='0070555000111222333444'
        )
        
        # Simulación: Cliente compra USD (casa vende) -> debe usar comision_venta del banco
        resultado = calcular_simulacion_operacion_privada_con_instancia(
            cliente_id=cliente.idCliente,
            divisa_origen_id=base.id,  # PYG (base)
            divisa_destino_id=usd.id,  # USD
            monto=1000,
            detalle_metodo_id=detalle.id,
            metodo_id=None
        )
        
        # Debe usar comisión específica del banco (3.0) en lugar de la del método (5.0)
        assert resultado["parametros"]["comision_metodo"] == 3.0
        
    def test_simulacion_usa_comision_metodo_cuando_catalogo_deshabilitado(
        self, 
        setup_divisas_y_tasa, 
        cliente_con_categoria
    ):
        """Test que simulación use comisión del método cuando catálogo no tiene personalizada habilitada"""
        base = setup_divisas_y_tasa['base']
        usd = setup_divisas_y_tasa['usd']
        cliente = cliente_con_categoria
        
        # Banco con comisión personalizada deshabilitada
        banco = Banco.objects.create(
            nombre='Banco Sin Comision Personalizada',
            cvu='6666666666666666666666',
            comision_compra=1.0,  # No debe usarse
            comision_venta=3.0,   # No debe usarse
            comision_personalizada_compra=False,
            comision_personalizada_venta=False
        )
        
        metodo = MetodoFinanciero.objects.create(
            nombre=TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA,
            comision_pago_porcentaje=4.0,
            comision_cobro_porcentaje=4.5,  # Debe usarse esta
            permite_pago=True,
            permite_cobro=True,
            is_active=True
        )
        
        detalle = MetodoFinancieroDetalle.objects.create(
            cliente=cliente,
            metodo_financiero=metodo,
            alias='Cuenta Sin Comision Personalizada'
        )
        
        cuenta = CuentaBancaria.objects.create(
            metodo_financiero_detalle=detalle,
            banco=banco,
            numero_cuenta='666000111',
            titular=cliente.nombre,
            cbu_cvu='0070666000111222333444'
        )
        
        # Simulación: Cliente compra USD (casa vende) -> debe usar comision_cobro_porcentaje del método
        resultado = calcular_simulacion_operacion_privada_con_instancia(
            cliente_id=cliente.idCliente,
            divisa_origen_id=base.id,
            divisa_destino_id=usd.id,
            monto=1000,
            detalle_metodo_id=detalle.id,
            metodo_id=None
        )
        
        # Debe usar comisión del método (4.5) porque banco no tiene personalizada habilitada
        assert resultado["parametros"]["comision_metodo"] == 4.5
@pytest.fixture
def transaccion_data(admin_user, cliente_con_categoria, setup_divisas_y_tasa):
    """Fixture para datos de creación de transacción"""
    base = setup_divisas_y_tasa['base']
    usd = setup_divisas_y_tasa['usd']
    cliente = cliente_con_categoria
    
    # Crear Tauser
    tauser = Tauser.objects.create(
        codigo='TAUSER001',
        nombre='Terminal Test',
        direccion='Calle Test 123',
        ciudad='Asunción',
        departamento='Central',
        latitud=-25.2637,
        longitud=-57.5759
    )
    
    # Crear método financiero
    metodo = MetodoFinanciero.objects.create(
        nombre=TipoMetodoFinanciero.EFECTIVO,
        permite_cobro=True,
        permite_pago=True,
        is_active=True
    )
    
    return {
        'operador': admin_user.id,
        'cliente': cliente.idCliente,
        'operacion': 'compra',
        'tasa_aplicada': '7350.00',
        'tasa_inicial': '7300.00',
        'divisa_origen': base.id,
        'divisa_destino': usd.id,
        'monto_origen': '730000.00',
        'monto_destino': '100.00',
        'metodo_financiero': metodo.id,
        'tauser': tauser.idTauser,
        'estado': 'pendiente'
    }


@pytest.fixture
def transaccion_instance(admin_user, cliente_con_categoria, setup_divisas_y_tasa):
    """Fixture para instancia de transacción"""
    base = setup_divisas_y_tasa['base']
    usd = setup_divisas_y_tasa['usd']
    cliente = cliente_con_categoria
    
    # Crear Tauser
    tauser = Tauser.objects.create(
        codigo='TAUSER002',
        nombre='Terminal Test 2',
        direccion='Calle Test 456',
        ciudad='Asunción',
        departamento='Central',
        latitud=-25.2637,
        longitud=-57.5759
    )
    
    # Crear método financiero
    metodo = MetodoFinanciero.objects.create(
        nombre=TipoMetodoFinanciero.EFECTIVO,
        permite_cobro=True,
        permite_pago=True,
        is_active=True
    )
    
    return Transaccion.objects.create(
        operador=admin_user,
        cliente=cliente,
        operacion='compra',
        tasa_aplicada=Decimal('7350.00'),
        tasa_inicial=Decimal('7300.00'),
        divisa_origen=base,
        divisa_destino=usd,
        monto_origen=Decimal('730000.00'),
        monto_destino=Decimal('100.00'),
        metodo_financiero=metodo,
        tauser=tauser,
        estado='pendiente'
    )


class TestTransaccionAPI:
    """Tests para el CRUD de transacciones"""
    
    def test_crear_transaccion_api(self, api_client, transaccion_data):
        """Test crear transacción via API"""
        response = api_client.post('/api/operaciones/transacciones/', transaccion_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Transaccion.objects.count() == 1
        
        transaccion = Transaccion.objects.first()
        assert transaccion.operacion == 'compra'
        assert transaccion.estado == 'pendiente'

    def test_listar_transacciones_api(self, api_client, transaccion_instance):
        """Test listar transacciones via API"""
        response = api_client.get('/api/operaciones/transacciones/')
        assert response.status_code == status.HTTP_200_OK
        
        assert isinstance(response.data, list)
        assert len(response.data) >= 1

        transaccion_data = response.data[0]
        assert transaccion_data['id'] == transaccion_instance.id
        assert transaccion_data['operacion'] == 'compra'

    def test_obtener_transaccion_detalle_api(self, api_client, transaccion_instance):
        """Test obtener detalle de transacción via API"""
        response = api_client.get(f'/api/operaciones/transacciones/{transaccion_instance.id}/')
        assert response.status_code == status.HTTP_200_OK
        
        data = response.data
        assert data['id'] == transaccion_instance.id
        assert data['operacion'] == 'compra'
        assert 'operador_detalle' in data
        assert 'cliente_detalle' in data

    def test_actualizar_transaccion_api(self, api_client, transaccion_instance):
        """Test actualizar transacción via API"""
        update_data = {
            'estado': 'en_proceso'
        }
        response = api_client.patch(f'/api/operaciones/transacciones/{transaccion_instance.id}/', update_data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        transaccion_instance.refresh_from_db()
        assert transaccion_instance.estado == 'en_proceso'

    def test_eliminar_transaccion_no_permitido(self, api_client, transaccion_instance):
        """Test que no se permite eliminar transacciones"""
        response = api_client.delete(f'/api/operaciones/transacciones/{transaccion_instance.id}/')
        # El ViewSet debería denegar DELETE - verificar que retorna 405 (Method Not Allowed)
        assert response.status_code in [status.HTTP_405_METHOD_NOT_ALLOWED, status.HTTP_403_FORBIDDEN]

    def test_completar_transaccion_action(self, api_client, transaccion_instance):
        """Test action completar transacción"""
        response = api_client.patch(f'/api/operaciones/transacciones/{transaccion_instance.id}/completar/')
        assert response.status_code == status.HTTP_200_OK
        
        transaccion_instance.refresh_from_db()
        assert transaccion_instance.estado == 'completada'
        assert transaccion_instance.fecha_fin is not None

    def test_completar_transaccion_ya_completada_error(self, api_client, transaccion_instance):
        """Test error al completar transacción ya completada"""
        # Completar primero
        transaccion_instance.estado = 'completada'
        transaccion_instance.fecha_fin = timezone.now()
        transaccion_instance.save()
        
        response = api_client.patch(f'/api/operaciones/transacciones/{transaccion_instance.id}/completar/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data

    def test_cancelar_transaccion_action(self, api_client, transaccion_instance):
        """Test action cancelar transacción"""
        response = api_client.patch(f'/api/operaciones/transacciones/{transaccion_instance.id}/cancelar/')
        assert response.status_code == status.HTTP_200_OK
        
        transaccion_instance.refresh_from_db()
        assert transaccion_instance.estado == 'cancelada'
        assert transaccion_instance.fecha_fin is not None

    def test_cancelar_transaccion_completada_error(self, api_client, transaccion_instance):
        """Test error al cancelar transacción completada"""
        # Completar primero
        transaccion_instance.estado = 'completada'
        transaccion_instance.fecha_fin = timezone.now()
        transaccion_instance.save()
        
        response = api_client.patch(f'/api/operaciones/transacciones/{transaccion_instance.id}/cancelar/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data

    def test_estadisticas_transacciones_endpoint(self, api_client):
        """Test endpoint de estadísticas"""
        response = api_client.get('/api/operaciones/transacciones/estadisticas/')
        assert response.status_code == status.HTTP_200_OK
        
        data = response.data
        assert 'total' in data
        assert 'pendientes' in data
        assert 'completadas' in data
        assert 'canceladas' in data
        assert 'montos_por_divisa' in data

    def test_filtros_transacciones_api(self, api_client, transaccion_instance):
        """Test filtros en listado de transacciones"""
        response = api_client.get('/api/operaciones/transacciones/', {'operacion': 'compra'})
        assert response.status_code == status.HTTP_200_OK
        
        results = response.data
        assert isinstance(results, list)
        assert len(results) >= 1
        assert all(t['operacion'] == 'compra' for t in results)

    def test_busqueda_transacciones_api(self, api_client, transaccion_instance):
        """Test búsqueda en transacciones"""
        # Buscar por nombre del cliente
        response = api_client.get('/api/operaciones/transacciones/', {'search': transaccion_instance.cliente.nombre})
        assert response.status_code == status.HTTP_200_OK

        results = response.data
        assert isinstance(results, list)
        assert len(results) >= 1

    def test_ordenamiento_transacciones_api(self, api_client, transaccion_instance):
        """Test ordenamiento de transacciones"""
        response = api_client.get('/api/operaciones/transacciones/', {'ordering': '-created_at'})
        assert response.status_code == status.HTTP_200_OK
        
        results = response.data
        assert isinstance(results, list)
        assert len(results) >= 1

    def test_validaciones_crear_transaccion(self, api_client, transaccion_data):
        """Test validaciones al crear transacción"""
        # Test con divisas iguales
        invalid_data = transaccion_data.copy()
        invalid_data['divisa_destino'] = invalid_data['divisa_origen']
        
        response = api_client.post('/api/operaciones/transacciones/', invalid_data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Test con monto negativo
        invalid_data = transaccion_data.copy()
        invalid_data['monto_origen'] = '-100.00'
        
        response = api_client.post('/api/operaciones/transacciones/', invalid_data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_serializer_campos_detallados(self, api_client, transaccion_instance):
        """Test que el serializer incluye campos detallados"""
        response = api_client.get(f'/api/operaciones/transacciones/{transaccion_instance.id}/')
        assert response.status_code == status.HTTP_200_OK
        
        data = response.data
        # Verificar campos detallados
        assert 'operador_detalle' in data
        assert 'cliente_detalle' in data
        assert 'divisa_origen_detalle' in data
        assert 'divisa_destino_detalle' in data
        assert 'metodo_financiero_detalle' in data
        assert 'tauser_detalle' in data
        
        # Verificar estructura de campos detallados
        assert data['operador_detalle']['username'] == transaccion_instance.operador.username
        assert data['cliente_detalle']['nombre'] == transaccion_instance.cliente.nombre