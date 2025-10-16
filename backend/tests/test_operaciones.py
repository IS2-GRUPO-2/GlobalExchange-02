import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
import uuid

from apps.operaciones.models import Transaccion, PermisosOperacion
from apps.usuarios.models import User
from apps.clientes.models import Cliente, CategoriaCliente
from apps.divisas.models import Divisa
from apps.tauser.models import Tauser
from apps.metodos_financieros.models import MetodoFinanciero, MetodoFinancieroDetalle
from apps.cotizaciones.models import Tasa

pytestmark = pytest.mark.django_db


# ========== FIXTURES ==========

@pytest.fixture
def api_client():
    """Cliente API no autenticado"""
    return APIClient()


@pytest.fixture
def authenticated_client():
    """Cliente API autenticado"""
    client = APIClient()
    user = User.objects.create_superuser(
        username="admin", 
        password="adminpass", 
        email="admin@test.com"
    )
    client.force_authenticate(user=user)
    return client, user


@pytest.fixture
def operador_usuario():
    """Usuario operador para transacciones"""
    return User.objects.create_user(
        username="operador",
        password="operadorpass", 
        email="operador@test.com"
    )


@pytest.fixture
def categoria_cliente():
    """Categoría de cliente de prueba"""
    return CategoriaCliente.objects.create(
        nombre='VIP',
        descuento=10
    )


@pytest.fixture
def cliente_test(categoria_cliente):
    """Cliente de prueba"""
    return Cliente.objects.create(
        nombre='Cliente Test',
        is_persona_fisica=True,
        id_categoria=categoria_cliente,
        correo='cliente@test.com',
        telefono='123456789',
        direccion='Dirección test',
        cedula='12345678'
    )


@pytest.fixture
def divisa_usd():
    """Divisa USD de prueba"""
    return Divisa.objects.create(
        codigo="USD",
        nombre="Dólar Americano",
        simbolo="$"
    )


@pytest.fixture
def divisa_eur():
    """Divisa EUR de prueba"""
    return Divisa.objects.create(
        codigo="EUR", 
        nombre="Euro",
        simbolo="€"
    )


@pytest.fixture
def divisa_pyg():
    """Divisa Guaraní Paraguayo"""
    return Divisa.objects.create(
        codigo="PYG",
        nombre="Guaraní Paraguayo",
        simbolo="₲",
        is_active=True,
        max_digitos=30,
        precision=0,
        es_base=True
    )
@pytest.fixture
def tasa_usd(divisa_usd):
    """Tasa de cambio para USD"""
    return Tasa.objects.create(
        divisa=divisa_usd,
        precioBase=Decimal('7250.00'),
        comisionBaseCompra=Decimal('50.00'),
        comisionBaseVenta=Decimal('50.00'),
        activo=True
    )


@pytest.fixture
def tasa_eur(divisa_eur):
    """Tasa de cambio para EUR"""
    return Tasa.objects.create(
        divisa=divisa_eur,
        tasa_compra=Decimal('8000.00'),
        tasa_venta=Decimal('8100.00'),
        is_active=True
    )


@pytest.fixture
def metodo_efectivo():
    """Método financiero EFECTIVO"""
    return MetodoFinanciero.objects.create(
        nombre="EFECTIVO",
        comision_pago_porcentaje=Decimal('0.00'),
        comision_cobro_porcentaje=Decimal('0.00')
    )


@pytest.fixture
def metodo_transferencia():
    """Método financiero TRANSFERENCIA_BANCARIA"""
    return MetodoFinanciero.objects.create(
        nombre="TRANSFERENCIA_BANCARIA",
        comision_pago_porcentaje=Decimal('1.00'),
        comision_cobro_porcentaje=Decimal('0.50')
    )


@pytest.fixture
def tauser_test():
    """Terminal de usuario de prueba"""
    return Tauser.objects.create(
        codigo="TAU001",
        nombre="Terminal 001",
        direccion="Oficina Central",
        ciudad="Asuncion",
        departamento="Central",
        latitud=Decimal('-25.263740'),
        longitud=Decimal('-57.575926'),
        is_active=True
    )


@pytest.fixture
def transaccion_data(operador_usuario, cliente_test, divisa_usd, divisa_pyg, metodo_efectivo, tauser_test):
    """Datos básicos para crear una transacción"""
    return {
        'id_user': operador_usuario.id,
        'cliente': str(cliente_test.id),
        'operacion': 'compra',
        'tasa_aplicada': Decimal('7250.00'),
        'tasa_inicial': Decimal('7250.00'),
        'divisa_origen': divisa_pyg.id,
        'divisa_destino': divisa_usd.id,
        'monto_origen': Decimal('725000.00'),
        'monto_destino': Decimal('100.00'),
        'metodo_financiero': metodo_efectivo.id,
        'tauser': str(tauser_test.id),
        'estado': 'pendiente'
    }


# ========== TESTS DEL MODELO TRANSACCION ==========

class TestTransaccionModel:
    """Pruebas para el modelo Transacción"""
    
    def test_crear_transaccion(self, transaccion_data, operador_usuario, cliente_test, divisa_usd, divisa_pyg, metodo_efectivo, tauser_test):
        """Prueba la creación básica de una transacción"""
        transaccion = Transaccion.objects.create(
            id_user=operador_usuario,
            cliente=cliente_test,
            operacion='compra',
            tasa_aplicada=Decimal('7250.00'),
            tasa_inicial=Decimal('7250.00'),
            divisa_origen=divisa_pyg,
            divisa_destino=divisa_usd,
            monto_origen=Decimal('725000.00'),
            monto_destino=Decimal('100.00'),
            metodo_financiero=metodo_efectivo,
            tauser=tauser_test
        )
        
        assert transaccion.operacion == 'compra'
        assert transaccion.estado == 'pendiente'  # Default
        assert transaccion.tasa_aplicada == Decimal('7250.00')
        assert str(transaccion) == f"Compra - {cliente_test} - pendiente"
    
    def test_transaccion_str_method(self, operador_usuario, cliente_test, divisa_usd, divisa_pyg, metodo_efectivo, tauser_test):
        """Prueba el método __str__ de Transaccion"""
        transaccion = Transaccion.objects.create(
            id_user=operador_usuario,
            cliente=cliente_test,
            operacion='venta',
            tasa_aplicada=Decimal('7300.00'),
            tasa_inicial=Decimal('7300.00'),
            divisa_origen=divisa_usd,
            divisa_destino=divisa_pyg,
            monto_origen=Decimal('100.00'),
            monto_destino=Decimal('730000.00'),
            metodo_financiero=metodo_efectivo,
            tauser=tauser_test,
            estado='completada'
        )
        
        expected = f"Venta - {cliente_test} - completada"
        assert str(transaccion) == expected


# ========== TESTS DEL VIEWSET TRANSACCIONES ==========

class TestTransaccionViewSet:
    """Pruebas para el ViewSet de Transacciones"""
    
    def test_list_transacciones_authenticated(self, authenticated_client):
        """Prueba listar transacciones con usuario autenticado"""
        client, user = authenticated_client
        url = reverse('transaccion-list')
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)  # Sin paginación, devuelve lista directa

    def test_list_transacciones_unauthenticated(self, api_client):
        """Prueba listar transacciones sin autenticación"""
        url = reverse('transaccion-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_transaccion(self, authenticated_client, transaccion_data):
        """Prueba crear una nueva transacción"""
        client, user = authenticated_client
        url = reverse('transaccion-list')
        
        response = client.post(url, transaccion_data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Transaccion.objects.filter(operacion='compra').exists()
        
        transaccion = Transaccion.objects.get(id=response.data['id'])
        assert transaccion.operacion == 'compra'
        assert transaccion.estado == 'pendiente'

    def test_create_transaccion_con_detalle_metodo(self, authenticated_client, operador_usuario, cliente_test, divisa_usd, divisa_pyg, metodo_transferencia, tauser_test):
        """Prueba crear transacción usando metodo_financiero_detalle (nuestro método create personalizado)"""
        from apps.metodos_financieros.models import MetodoFinancieroDetalle
        
        client, user = authenticated_client
        
        # Crear un detalle de método financiero
        detalle_metodo = MetodoFinancieroDetalle.objects.create(
            metodo_financiero=metodo_transferencia,
            es_cuenta_casa=True,
            alias='Cuenta Test API'
        )
        
        # Datos de transacción usando SOLO metodo_financiero_detalle
        transaccion_data = {
            'id_user': operador_usuario.id,
            'cliente': str(cliente_test.id),
            'operacion': 'compra',
            'tasa_aplicada': '7250.00',
            'tasa_inicial': '7250.00',
            'divisa_origen': divisa_pyg.id,
            'divisa_destino': divisa_usd.id,
            'monto_origen': '725000.00',
            'monto_destino': '100.00',
            'metodo_financiero_detalle': detalle_metodo.id,  # SOLO este campo, no metodo_financiero
            'tauser': str(tauser_test.id),
            'estado': 'pendiente'
        }
        
        url = reverse('transaccion-list')
        response = client.post(url, transaccion_data, format='json')
        
        # Verificar que se creó exitosamente
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verificar que nuestro método create personalizado pobló automáticamente metodo_financiero
        transaccion = Transaccion.objects.get(id=response.data['id'])
        assert transaccion.metodo_financiero_detalle.id == detalle_metodo.id
        assert transaccion.metodo_financiero is not None, "metodo_financiero debe poblarse automáticamente"
        assert transaccion.metodo_financiero.id == metodo_transferencia.id, "metodo_financiero debe ser el del detalle"
        
        # Verificar datos de respuesta
        assert response.data['metodo_financiero'] == metodo_transferencia.id
        assert response.data['metodo_financiero_detalle'] == detalle_metodo.id

    def test_create_transaccion_metodo_directo(self, authenticated_client, operador_usuario, cliente_test, divisa_usd, divisa_pyg, metodo_efectivo, tauser_test):
        """Prueba crear transacción usando metodo_financiero directo (EFECTIVO/CHEQUE)"""
        client, user = authenticated_client
        
        # Datos de transacción usando SOLO metodo_financiero
        transaccion_data = {
            'id_user': operador_usuario.id,
            'cliente': str(cliente_test.id),
            'operacion': 'venta',
            'tasa_aplicada': '4000.00',
            'tasa_inicial': '4000.00',
            'divisa_origen': divisa_usd.id,
            'divisa_destino': divisa_pyg.id,
            'monto_origen': '500.00',
            'monto_destino': '2000000.00',
            'metodo_financiero': metodo_efectivo.id,  # SOLO este campo
            'tauser': str(tauser_test.id),
            'estado': 'pendiente'
        }
        
        url = reverse('transaccion-list')
        response = client.post(url, transaccion_data, format='json')
        
        # Verificar que se creó exitosamente
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verificar que metodo_financiero está presente y no hay detalle
        transaccion = Transaccion.objects.get(id=response.data['id'])
        assert transaccion.metodo_financiero.id == metodo_efectivo.id
        assert transaccion.metodo_financiero_detalle is None
        
        # Verificar datos de respuesta
        assert response.data['metodo_financiero'] == metodo_efectivo.id
        assert response.data['metodo_financiero_detalle'] is None

    def test_create_transaccion_error_sin_metodos(self, authenticated_client, operador_usuario, cliente_test, divisa_usd, divisa_pyg, tauser_test):
        """Prueba error al crear transacción sin ningún método financiero"""
        client, user = authenticated_client
        
        # Datos de transacción SIN métodos financieros
        transaccion_data = {
            'id_user': operador_usuario.id,
            'cliente': str(cliente_test.id),
            'operacion': 'venta',
            'tasa_aplicada': '4000.00',
            'tasa_inicial': '4000.00',
            'divisa_origen': divisa_usd.id,
            'divisa_destino': divisa_pyg.id,
            'monto_origen': '500.00',
            'monto_destino': '2000000.00',
            'tauser': str(tauser_test.id),
            'estado': 'pendiente'
        }
        
        url = reverse('transaccion-list')
        response = client.post(url, transaccion_data, format='json')
        
        # Verificar que devuelve error 400
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
        assert 'Debe proporcionar' in response.data['error']

    def test_create_transaccion_error_ambos_metodos(self, authenticated_client, operador_usuario, cliente_test, divisa_usd, divisa_pyg, metodo_efectivo, metodo_transferencia, tauser_test):
        """Prueba error al crear transacción con ambos métodos financieros"""
        from apps.metodos_financieros.models import MetodoFinancieroDetalle
        
        client, user = authenticated_client
        
        # Crear un detalle de método financiero
        detalle_metodo = MetodoFinancieroDetalle.objects.create(
            metodo_financiero=metodo_transferencia,
            es_cuenta_casa=True,
            alias='Cuenta Test'
        )
        
        # Datos de transacción con AMBOS métodos
        transaccion_data = {
            'id_user': operador_usuario.id,
            'cliente': str(cliente_test.id),
            'operacion': 'venta',
            'tasa_aplicada': '4000.00',
            'tasa_inicial': '4000.00',
            'divisa_origen': divisa_usd.id,
            'divisa_destino': divisa_pyg.id,
            'monto_origen': '500.00',
            'monto_destino': '2000000.00',
            'metodo_financiero': metodo_efectivo.id,
            'metodo_financiero_detalle': detalle_metodo.id,
            'tauser': str(tauser_test.id),
            'estado': 'pendiente'
        }
        
        url = reverse('transaccion-list')
        response = client.post(url, transaccion_data, format='json')
        
        # Verificar que devuelve error 400
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
        assert 'No puede proporcionar ambos' in response.data['error']
    
    def test_retrieve_transaccion(self, authenticated_client, operador_usuario, cliente_test, divisa_usd, divisa_pyg, metodo_efectivo, tauser_test):
        """Prueba obtener una transacción específica"""
        client, user = authenticated_client
        
        transaccion = Transaccion.objects.create(
            id_user=operador_usuario,
            cliente=cliente_test,
            operacion='compra',
            tasa_aplicada=Decimal('7250.00'),
            tasa_inicial=Decimal('7250.00'),
            divisa_origen=divisa_pyg,
            divisa_destino=divisa_usd,
            monto_origen=Decimal('725000.00'),
            monto_destino=Decimal('100.00'),
            metodo_financiero=metodo_efectivo,
            tauser=tauser_test
        )
        
        url = reverse('transaccion-detail', args=[transaccion.id])
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['operacion'] == 'compra'
    
    def test_update_transaccion(self, authenticated_client, operador_usuario, cliente_test, divisa_usd, divisa_pyg, metodo_efectivo, tauser_test):
        """Prueba actualizar una transacción"""
        client, user = authenticated_client
        
        transaccion = Transaccion.objects.create(
            id_user=operador_usuario,
            cliente=cliente_test,
            operacion='compra',
            tasa_aplicada=Decimal('7250.00'),
            tasa_inicial=Decimal('7250.00'),
            divisa_origen=divisa_pyg,
            divisa_destino=divisa_usd,
            monto_origen=Decimal('725000.00'),
            monto_destino=Decimal('100.00'),
            metodo_financiero=metodo_efectivo,
            tauser=tauser_test
        )
        
        url = reverse('transaccion-detail', args=[transaccion.id])
        update_data = {
            'id_user': operador_usuario.id,
            'cliente': str(cliente_test.id),
            'operacion': 'compra',
            'tasa_aplicada': Decimal('7260.00'),  # Tasa actualizada
            'tasa_inicial': Decimal('7250.00'),
            'divisa_origen': divisa_pyg.id,
            'divisa_destino': divisa_usd.id,
            'monto_origen': Decimal('726000.00'),  # Monto actualizado
            'monto_destino': Decimal('100.00'),
            'metodo_financiero': metodo_efectivo.id,
            'tauser': str(tauser_test.id),
            'estado': 'en_proceso'  # Estado actualizado
        }
        
        response = client.put(url, update_data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        transaccion.refresh_from_db()
        assert transaccion.tasa_aplicada == Decimal('7260.00')
        assert transaccion.estado == 'en_proceso'
    
    def test_delete_transaccion_forbidden(self, authenticated_client, operador_usuario, cliente_test, divisa_usd, divisa_pyg, metodo_efectivo, tauser_test):
        """Prueba que no se permite eliminar transacciones"""
        client, user = authenticated_client
        
        transaccion = Transaccion.objects.create(
            id_user=operador_usuario,
            cliente=cliente_test,
            operacion='compra',
            tasa_aplicada=Decimal('7250.00'),
            tasa_inicial=Decimal('7250.00'),
            divisa_origen=divisa_pyg,
            divisa_destino=divisa_usd,
            monto_origen=Decimal('725000.00'),
            monto_destino=Decimal('100.00'),
            metodo_financiero=metodo_efectivo,
            tauser=tauser_test
        )
        
        url = reverse('transaccion-detail', args=[transaccion.id])
        response = client.delete(url)
        
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        assert Transaccion.objects.filter(id=transaccion.id).exists()


# ========== TESTS DE ENDPOINTS PERSONALIZADOS ==========

class TestOperacionPrivada:
    """Pruebas para el endpoint de operación privada"""
    
    def test_operacion_privada_authenticated(self, authenticated_client, cliente_test, divisa_usd, divisa_pyg, metodo_efectivo, tasa_usd):
        """Prueba operación privada con usuario autenticado"""
        client, user = authenticated_client
        url = reverse('operacion-privada')
        
        data = {
            'cliente_id': str(cliente_test.id),
            'divisa_origen': divisa_pyg.id,
            'divisa_destino': divisa_usd.id,
            'monto_origen': Decimal('725000.00'),
            'op_perspectiva_casa': 'compra',
            'metodo_id': metodo_efectivo.id
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'tc_final' in response.data
        assert 'monto_origen' in response.data
        assert 'monto_destino' in response.data
    
    def test_operacion_privada_unauthenticated(self, api_client):
        """Prueba operación privada sin autenticación"""
        url = reverse('operacion-privada')
        data = {'divisa_origen': 1, 'divisa_destino': 2}
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_operacion_privada_datos_invalidos(self, authenticated_client):
        """Prueba operación privada con datos inválidos"""
        client, user = authenticated_client
        url = reverse('operacion-privada')
        
        data = {
            'divisa_origen': 999,  # Divisa inexistente
            'divisa_destino': 998,  # Divisa inexistente
            'monto_origen': -100  # Monto negativo
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestOperacionPublica:
    """Pruebas para el endpoint de operación pública"""
    
    def test_operacion_publica_sin_auth(self, api_client, divisa_usd, divisa_pyg, metodo_efectivo, tasa_usd):
        """Prueba operación pública sin autenticación (permitido)"""
        url = reverse('operacion-publica')
        
        data = {
            'divisa_origen': divisa_pyg.id,
            'divisa_destino': divisa_usd.id,
            'monto_origen': Decimal('725000.00'),
            'op_perspectiva_casa': 'compra',
            'metodo_id': metodo_efectivo.id
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'tc_final' in response.data
        assert 'monto_origen' in response.data
        assert 'monto_destino' in response.data
    
    def test_operacion_publica_datos_requeridos(self, api_client):
        """Prueba operación pública con datos faltantes"""
        url = reverse('operacion-publica')
        
        data = {
            'divisa_origen': 1,
            # Falta divisa_destino
            'monto_origen': Decimal('100.00')
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'divisa_destino' in response.data or 'error' in response.data


class TestOpPerspectivaCasa:
    """Pruebas para el endpoint de perspectiva de operación"""
    
    def test_get_op_perspectiva_casa_valida(self, api_client, divisa_usd, divisa_pyg):
        """Prueba obtener perspectiva de operación con divisas válidas"""
        url = reverse('op-perspectiva-casa')

        response = api_client.get(url, {
            'divisa_origen': divisa_pyg.id,
            'divisa_destino': divisa_usd.id
        })

        assert response.status_code == status.HTTP_200_OK
        assert 'op_perspectiva_casa' in response.data
        assert response.data['op_perspectiva_casa'] in ['compra', 'venta']
        assert 'op_perspectiva_casa' in response.data
        assert response.data['op_perspectiva_casa'] in ['compra', 'venta']
    
    def test_get_op_perspectiva_casa_sin_params(self, api_client):
        """Prueba obtener perspectiva sin parámetros"""
        url = reverse('op-perspectiva-casa')
        
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
    
    def test_get_op_perspectiva_casa_divisas_iguales(self, api_client, divisa_usd):
        """Prueba perspectiva con divisas origen y destino iguales"""
        url = reverse('op-perspectiva-casa')
        
        response = api_client.get(url, {
            'divisa_origen': divisa_usd.id,
            'divisa_destino': divisa_usd.id
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data


# ========== TESTS DE ACCIONES PERSONALIZADAS DEL VIEWSET ==========

class TestTransaccionAcciones:
    """Pruebas para acciones personalizadas del ViewSet de transacciones"""
    
    def test_completar_transaccion(self, authenticated_client, operador_usuario, cliente_test, divisa_usd, divisa_pyg, metodo_efectivo, tauser_test):
        """Prueba completar una transacción pendiente"""
        client, user = authenticated_client
        
        transaccion = Transaccion.objects.create(
            id_user=operador_usuario,
            cliente=cliente_test,
            operacion='compra',
            tasa_aplicada=Decimal('7250.00'),
            tasa_inicial=Decimal('7250.00'),
            divisa_origen=divisa_pyg,
            divisa_destino=divisa_usd,
            monto_origen=Decimal('725000.00'),
            monto_destino=Decimal('100.00'),
            metodo_financiero=metodo_efectivo,
            tauser=tauser_test,
            estado='pendiente'
        )
        
        url = reverse('transaccion-completar', args=[transaccion.id])
        response = client.patch(url)
        
        assert response.status_code == status.HTTP_200_OK
        transaccion.refresh_from_db()
        assert transaccion.estado == 'completada'
        assert transaccion.fecha_fin is not None
    
    def test_cancelar_transaccion(self, authenticated_client, operador_usuario, cliente_test, divisa_usd, divisa_pyg, metodo_efectivo, tauser_test):
        """Prueba cancelar una transacción"""
        client, user = authenticated_client
        
        transaccion = Transaccion.objects.create(
            id_user=operador_usuario,
            cliente=cliente_test,
            operacion='compra',
            tasa_aplicada=Decimal('7250.00'),
            tasa_inicial=Decimal('7250.00'),
            divisa_origen=divisa_pyg,
            divisa_destino=divisa_usd,
            monto_origen=Decimal('725000.00'),
            monto_destino=Decimal('100.00'),
            metodo_financiero=metodo_efectivo,
            tauser=tauser_test,
            estado='pendiente'
        )
        
        url = reverse('transaccion-cancelar', args=[transaccion.id])
        response = client.patch(url)
        
        assert response.status_code == status.HTTP_200_OK
        transaccion.refresh_from_db()
        assert transaccion.estado == 'cancelada'
        assert transaccion.fecha_fin is not None
    
    def test_completar_transaccion_ya_completada(self, authenticated_client, operador_usuario, cliente_test, divisa_usd, divisa_pyg, metodo_efectivo, tauser_test):
        """Prueba completar una transacción ya completada"""
        client, user = authenticated_client
        
        transaccion = Transaccion.objects.create(
            id_user=operador_usuario,
            cliente=cliente_test,
            operacion='compra',
            tasa_aplicada=Decimal('7250.00'),
            tasa_inicial=Decimal('7250.00'),
            divisa_origen=divisa_pyg,
            divisa_destino=divisa_usd,
            monto_origen=Decimal('725000.00'),
            monto_destino=Decimal('100.00'),
            metodo_financiero=metodo_efectivo,
            tauser=tauser_test,
            estado='completada'
        )
        
        url = reverse('transaccion-completar', args=[transaccion.id])
        response = client.patch(url)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
