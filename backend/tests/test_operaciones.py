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
    TipoMetodoFinanciero,
    Banco,
    BilleteraDigitalCatalogo,
    Cheque,
)

from apps.operaciones.services import (
    _inferir_operacion,
    calcular_simulacion_operacion_privada,
    calcular_simulacion_operacion_publica,
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
        defaults={'cvu': '0000000000000000000000'}
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
        nombre='MercadoPago'
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
def tarjeta_data():
    return {
        'stripe_payment_method_id': 'pm_test_123',
        'brand': 'VISA',
        'last4': '4242',
        'exp_month': 12,
        'exp_year': 2030,
        'titular': 'Casa Cambio'
    }


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
        assert len(response.data) >= 1

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


#===============================SIMULACION SERVICES TESTS=================================



def test_inferir_operacion_compra_y_venta():
    base = Divisa.objects.create(codigo="PYG", nombre="Guaraní", simbolo="₲", es_base=True)
    usd = Divisa.objects.create(codigo="USD", nombre="Dólar", simbolo="$", es_base=False)

    cliente_op, casa_op = _inferir_operacion(base, usd)
    assert cliente_op == "compra"
    assert casa_op == "venta"

    cliente_op, casa_op = _inferir_operacion(usd, base)
    assert cliente_op == "venta"
    assert casa_op == "compra"



def test_calcular_simulacion_operacion_privada():
    # Setup
    base = Divisa.objects.create(codigo="PYG", nombre="Guaraní", simbolo="₲", es_base=True)
    usd = Divisa.objects.create(codigo="USD", nombre="Dólar", simbolo="$", es_base=False)
    categoria, _= CategoriaCliente.objects.get_or_create(nombre="VIP", descuento=10)
    cliente = Cliente.objects.create(nombre="Juan Perez", idCategoria=categoria)
    metodo = MetodoFinanciero.objects.create(
        nombre="Transferencia", comision_pago_porcentaje=2, comision_cobro_porcentaje=3,
        permite_pago=True, permite_cobro=True, is_active=True
    )
    Tasa.objects.create(
        divisa=usd, 
        precioBase=Decimal("7300"), 
        comisionBaseCompra=Decimal("100"), 
        comisionBaseVenta=Decimal("100"), 
        activo=True
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



def test_calcular_simulacion_operacion_publica():
    base = Divisa.objects.create(codigo="PYG", nombre="Guaraní", simbolo="₲", es_base=True)
    usd = Divisa.objects.create(codigo="USD", nombre="Dólar", simbolo="$", es_base=False)
    metodo = MetodoFinanciero.objects.create(
        nombre="Efectivo", comision_pago_porcentaje=1, comision_cobro_porcentaje=2,
        permite_pago=True, permite_cobro=True, is_active=True
    )
    Tasa.objects.create(
        divisa=usd, 
        precioBase=Decimal("7300"), 
        comisionBaseCompra=Decimal("100"), 
        comisionBaseVenta=Decimal("100"), 
        activo=True
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


#===============================SIMULACION VIEWS TESTS=================================

@pytest.mark.django_db
def test_simular_operacion_publica_endpoint():
    client = APIClient()

    base = Divisa.objects.create(codigo="PYG", nombre="Guaraní", simbolo="₲", es_base=True)
    usd = Divisa.objects.create(codigo="USD", nombre="Dólar", simbolo="$", es_base=False)
    metodo = MetodoFinanciero.objects.create(
        nombre="Efectivo", comision_pago_porcentaje=1, comision_cobro_porcentaje=2,
        permite_pago=True, permite_cobro=True, is_active=True
    )
    Tasa.objects.create(
        divisa=usd, 
        precioBase=Decimal("7300"), 
        comisionBaseCompra=Decimal("100"), 
        comisionBaseVenta=Decimal("100"), 
        activo=True
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



def test_simular_operacion_privada_endpoint_authenticated():
    client = APIClient()

    # Crear usuario autenticado
    user = User.objects.create_user(username="test", password="1234")
    client.force_authenticate(user=user)

    base = Divisa.objects.create(codigo="PYG", nombre="Guaraní", simbolo="₲", es_base=True)
    usd = Divisa.objects.create(codigo="USD", nombre="Dólar", simbolo="$", es_base=False)
    categoria, _ = CategoriaCliente.objects.get_or_create(nombre="VIP", descuento=10)
    cliente = Cliente.objects.create(nombre="Carlos", idCategoria=categoria)
    metodo = MetodoFinanciero.objects.create(
        nombre="Transferencia", comision_pago_porcentaje=2, comision_cobro_porcentaje=3,
        permite_pago=True, permite_cobro=True, is_active=True
    )
    Tasa.objects.create(
        divisa=usd, 
        precioBase=Decimal("7300"), 
        comisionBaseCompra=Decimal("100"), 
        comisionBaseVenta=Decimal("100"), 
        activo=True
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


# =============================== CHEQUE ENDPOINTS ==================================
def test_cheque_tipos_endpoint(api_client):
    """
    Verifica que el endpoint de tipos de cheque devuelva una lista de objetos {value, label}.
    """
    url = reverse('cheque-tipos')
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.data, list)
    assert len(response.data) >= 1
    assert 'value' in response.data[0] and 'label' in response.data[0]


def test_cheque_divisas_endpoint(api_client):
    """
    Verifica que el endpoint de divisas de cheque devuelva la lista esperada.
    """
    url = reverse('cheque-divisas')
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.data, list)
    assert len(response.data) >= 1
    assert 'value' in response.data[0] and 'label' in response.data[0]
