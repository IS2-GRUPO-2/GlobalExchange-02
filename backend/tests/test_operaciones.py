import pytest
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
)

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
def cuenta_data():
    return {
        'banco': 'Banco Test',
        'numero_cuenta': '123456789',
        'titular': 'Casa Cambio',
        'cbu_cvu': '0000000000000000000000',
    }


@pytest.fixture
def billetera_data():
    return {
        'plataforma': 'MercadoPago',
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

    def test_eliminar_cuenta_desactiva_detalle(self, api_client, metodo_data, detalle_data, cuenta_data):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='Casa-Acc2')
        cuenta = CuentaBancaria.objects.create(metodo_financiero_detalle=detalle, **cuenta_data)

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

    def test_eliminar_billetera_desactiva_detalle(self, api_client, metodo_data, detalle_data, billetera_data):
        metodo = MetodoFinanciero.objects.create(**metodo_data)
        detalle = MetodoFinancieroDetalle.objects.create(metodo_financiero=metodo, es_cuenta_casa=True, alias='Casa-Bill2')
        billetera = BilleteraDigital.objects.create(metodo_financiero_detalle=detalle, **billetera_data)

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
