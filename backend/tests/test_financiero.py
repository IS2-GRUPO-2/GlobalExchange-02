import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.metodos_financieros.models import (
    MetodoFinanciero,
    MetodoFinancieroDetalle,
    CuentaBancaria,
    BilleteraDigital,
    Tarjeta,
    TipoMetodoFinanciero,
    Banco,
    BilleteraDigitalCatalogo,
    TarjetaCatalogo,
    Cheque,
)

from apps.tauser.models import Tauser
from django.utils import timezone

from apps.operaciones.service import (
    calcular_operacion
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
def tarjeta_catalogo_instance():
    tarjeta_catalogo, _ = TarjetaCatalogo.objects.get_or_create(
        marca='Visa',
        defaults={
            'comision_compra': 3.00,
            'comision_venta': 2.50,
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': False
        }
    )
    return tarjeta_catalogo

@pytest.fixture
def tarjeta_data(tarjeta_catalogo_instance):
    return {
        'tipo': 'STRIPE',
        'payment_method_id': 'pm_test_123',
        'marca': tarjeta_catalogo_instance.id,  # Para API - usar ID
        'brand': 'visa',
        'last4': '4242',
        'exp_month': 12,
        'exp_year': 2030,
        'titular': 'Casa Cambio'
    }

@pytest.fixture
def tarjeta_data_orm(tarjeta_catalogo_instance):
    return {
        'tipo': 'STRIPE',
        'payment_method_id': 'pm_test_123_orm',
        'marca': tarjeta_catalogo_instance,  # Para ORM - usar instancia
        'brand': 'visa',
        'last4': '4242',
        'exp_month': 12,
        'exp_year': 2030,
        'titular': 'Casa Cambio'
    }


@pytest.fixture
def tarjeta_local_data(tarjeta_catalogo_instance):
    return {
        'tipo': 'LOCAL',
        'payment_method_id': 'pm_local_123',
        'marca': tarjeta_catalogo_instance.id,  # Para API - usar ID
        'brand': 'visa',
        'last4': '1234',
        'exp_month': 8,
        'exp_year': 2028,
        'titular': 'Juan Perez'
    }

@pytest.fixture
def tarjeta_local_data_orm(tarjeta_catalogo_instance):
    return {
        'tipo': 'LOCAL',
        'payment_method_id': 'pm_local_123_orm',
        'marca': tarjeta_catalogo_instance,  # Para ORM - usar instancia
        'brand': 'visa',
        'last4': '1234',
        'exp_month': 8,
        'exp_year': 2028,
        'titular': 'Juan Perez'
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
        id_categoria=categoria
    )
    return cliente


# Tests
class TestMetodoFinancieroAPI:
    def test_crear_metodo_api(self, api_client, metodo_data):
        response = api_client.post('/api/metodos_financieros/metodos/', metodo_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert MetodoFinanciero.objects.count() == 1

    def test_listar_metodos_api(self, api_client, metodo_data):
        # crear uno por ORM
        MetodoFinanciero.objects.create(**metodo_data)
        response = api_client.get('/api/metodos_financieros/metodos/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_eliminar_metodo_soft_delete(self, api_client, metodo_data):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        response = api_client.delete(f'/api/metodos_financieros/metodos/{metodo.id}/')
        assert response.status_code == status.HTTP_200_OK
        metodo.refresh_from_db()
        assert metodo.is_active is False


class TestMetodoFinancieroDetalleAPI:
    def test_crear_detalle_api(self, api_client, metodo_data, detalle_data):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        payload = detalle_data.copy()
        payload['metodo_financiero'] = metodo.id

        response = api_client.post('/api/metodos_financieros/detalles/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert MetodoFinancieroDetalle.objects.count() == 1

    def test_eliminar_detalle_soft_delete(self, api_client, metodo_data, detalle_data):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='D1')
        response = api_client.delete(f'/api/metodos_financieros/detalles/{detalle.id}/')
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
        
        response = api_client.post(f'/api/metodos_financieros/detalles/{detalle.id}/toggle_active/')
        assert response.status_code == status.HTTP_200_OK
        detalle.refresh_from_db()
        assert detalle.is_active is False


class TestCuentasBancariasAPI:
    def test_crear_cuenta_api(self, api_client, metodo_data, detalle_data, cuenta_data):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='Casa-Acc')

        payload = cuenta_data.copy()
        payload['metodo_financiero_detalle'] = detalle.id

        response = api_client.post('/api/metodos_financieros/cuentas-bancarias/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert CuentaBancaria.objects.count() == 1

    def test_eliminar_cuenta_desactiva_detalle(self, api_client, metodo_data, detalle_data, cuenta_data_orm):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='Casa-Acc2')
        cuenta = CuentaBancaria.objects.create(metodo_financiero_detalle=detalle, **cuenta_data_orm)

        response = api_client.delete(f'/api/metodos_financieros/cuentas-bancarias/{cuenta.id}/')
        assert response.status_code == status.HTTP_200_OK
        detalle.refresh_from_db()
        assert detalle.is_active is False


class TestBilleteraDigitalAPI:
    def test_crear_billetera_api(self, api_client, metodo_data, detalle_data, billetera_data):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='Casa-Billetera')

        payload = billetera_data.copy()
        payload['metodo_financiero_detalle'] = detalle.id

        response = api_client.post('/api/metodos_financieros/billeteras-digitales/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert BilleteraDigital.objects.count() == 1

    def test_eliminar_billetera_desactiva_detalle(self, api_client, metodo_data, detalle_data, billetera_data_orm):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='Casa-Bill2')
        billetera = BilleteraDigital.objects.create(metodo_financiero_detalle=detalle, **billetera_data_orm)

        response = api_client.delete(f'/api/metodos_financieros/billeteras-digitales/{billetera.id}/')
        assert response.status_code == status.HTTP_200_OK
        detalle.refresh_from_db()
        assert detalle.is_active is False


class TestTarjetaAPI:
    def test_crear_tarjeta_api(self, api_client, metodo_data, detalle_data, tarjeta_data):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='Casa-Tarj')

        payload = tarjeta_data.copy()
        payload['metodo_financiero_detalle'] = detalle.id

        response = api_client.post('/api/metodos_financieros/tarjetas/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Tarjeta.objects.count() == 1

    def test_eliminar_tarjeta_desactiva_detalle(self, api_client, metodo_data, detalle_data, tarjeta_data_orm):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='Casa-Tarj2')
        tarjeta = Tarjeta.objects.create(metodo_financiero_detalle=detalle, **tarjeta_data_orm)

        response = api_client.delete(f'/api/metodos_financieros/tarjetas/{tarjeta.id}/')
        assert response.status_code == status.HTTP_200_OK
        detalle.refresh_from_db()
        assert detalle.is_active is False

    def test_crear_tarjeta_local_api(self, api_client, metodo_data, detalle_data, tarjeta_local_data):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='Casa-TarjLocal')

        payload = tarjeta_local_data.copy()
        payload['metodo_financiero_detalle'] = detalle.id

        response = api_client.post('/api/metodos_financieros/tarjetas/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Tarjeta.objects.count() >= 1

    def test_eliminar_tarjeta_local_desactiva_detalle(self, api_client, metodo_data, detalle_data, tarjeta_local_data_orm):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='Casa-TarjLocal2')
        tarjeta_local = Tarjeta.objects.create(metodo_financiero_detalle=detalle, **tarjeta_local_data_orm)

        response = api_client.delete(f'/api/metodos_financieros/tarjetas/{tarjeta_local.id}/')
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
        response = api_client.post('/api/metodos_financieros/bancos/', banco_data, format='json')
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
        response = api_client.post(f'/api/metodos_financieros/bancos/{banco_instance.id}/toggle_active/')
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
        response = api_client.post('/api/metodos_financieros/billeteras-catalogo/', billetera_data, format='json')
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
        response = api_client.post('/api/metodos_financieros/tarjetas-catalogo/', tarjeta_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        tarjeta = TarjetaCatalogo.objects.first()
        assert tarjeta.comision_compra == Decimal('3.1')
        assert tarjeta.comision_personalizada_compra is True


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
            comision_venta=3.25,
            comision_personalizada_compra=True,
            comision_personalizada_venta=False
        )
        
        assert banco.comision_compra == 2.75
        assert banco.comision_venta == 3.25
        assert banco.comision_personalizada_compra is True
        assert banco.comision_personalizada_venta is False
        assert banco.is_active is True  # valor por defecto
    
    def test_billetera_digital_campos_comisiones_diferenciadas(self):
        """Verifica que BilleteraDigitalCatalogo tenga comisiones diferenciadas"""
        billetera = BilleteraDigitalCatalogo.objects.create(
            nombre='PayPal Test',
            comision_compra=3.50,
            comision_venta=2.80,
            comision_personalizada_compra=False,
            comision_personalizada_venta=True
        )
        
        assert billetera.comision_compra == 3.50
        assert billetera.comision_venta == 2.80
        assert billetera.comision_personalizada_compra is False
        assert billetera.comision_personalizada_venta is True
        assert billetera.is_active is True  # valor por defecto
    
    def test_tarjeta_catalogo_campos_comisiones(self):
        """Verifica que el modelo TarjetaCatalogo tenga los campos de comisiones"""
        tarjeta = TarjetaCatalogo.objects.create(
            marca='Visa Test',
            comision_compra=1.25,
            comision_venta=1.50,
            comision_personalizada_compra=True,
            comision_personalizada_venta=False
        )
        
        assert tarjeta.comision_compra == 1.25
        assert tarjeta.comision_venta == 1.50
        assert tarjeta.comision_personalizada_compra is True
        assert tarjeta.comision_personalizada_venta is False
        assert tarjeta.is_active is True  # valor por defecto
    
    def test_valores_por_defecto_comisiones_diferenciadas(self):
        """Verifica valores por defecto de comisiones diferenciadas"""
        banco = Banco.objects.create(
            nombre='Banco Default Diferenciado',
            cvu='0987654321098765432109'
        )
        billetera = BilleteraDigitalCatalogo.objects.create(
            nombre='Billetera Default Diferenciada'
        )
        tarjeta = TarjetaCatalogo.objects.create(
            marca='Tarjeta Default Test'
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
        resultado = calcular_operacion(
            cliente_id=cliente.id,
            divisa_origen_id=base.id,  # PYG (base)
            divisa_destino_id=usd.id,  # USD
            monto=1000,
            detalle_metodo_id=detalle.id,
            metodo_id=None,
            op_perspectiva_casa="venta"  # Casa vende USD
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
        resultado = calcular_operacion(
            cliente_id=cliente.id,
            divisa_origen_id=base.id,
            divisa_destino_id=usd.id,
            monto=1000,
            detalle_metodo_id=detalle.id,
            metodo_id=None,
            op_perspectiva_casa="venta"  # Casa vende USD
        )
        # Debe usar comisión del método (4.5) en lugar de la del banco
        assert resultado["parametros"]["comision_metodo"] == 4.5

        
  