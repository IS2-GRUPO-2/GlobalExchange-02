import pytest
from decimal import Decimal
from unittest.mock import patch
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from rest_framework import status
from rest_framework.test import APIClient
from apps.tauser.models import Tauser
from apps.tauser.serializers import TauserSerializer, TauserPaginatedResponseSerializer

User = get_user_model()


@pytest.fixture
def tauser_data():
    """Datos de prueba para crear un Tauser"""
    return {
        'codigo': 'TAU-TEST-001',
        'nombre': 'Tauser Test',
        'direccion': 'Av. Test 1234',
        'ciudad': 'Test City',
        'departamento': 'Test Department',
        'latitud': Decimal('-25.263739'),
        'longitud': Decimal('-57.575926'),
        'is_active': True
    }


@pytest.fixture
def tauser(tauser_data):
    """Crear un Tauser de prueba"""
    return Tauser.objects.create(**tauser_data)


@pytest.fixture
def api_client():
    """Cliente API de prueba"""
    return APIClient()


@pytest.fixture
def authenticated_user():
    """Usuario autenticado para las pruebas"""
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )

    # Asignar permisos necesarios para Tauser
    content_type = ContentType.objects.get_for_model(Tauser)
    permissions = Permission.objects.filter(content_type=content_type)
    user.user_permissions.set(permissions)

    return user


@pytest.fixture
def authenticated_client(api_client, authenticated_user):
    """Cliente API autenticado"""
    api_client.force_authenticate(user=authenticated_user)
    return api_client


@pytest.mark.django_db
class TestTauserModel:
    """Pruebas para el modelo Tauser"""

    def test_create_tauser_success(self, tauser_data):
        """Test: Crear un Tauser exitosamente"""
        tauser = Tauser.objects.create(**tauser_data)

        assert tauser.id is not None
        assert tauser.codigo == tauser_data['codigo']
        assert tauser.nombre == tauser_data['nombre']
        assert tauser.direccion == tauser_data['direccion']
        assert tauser.ciudad == tauser_data['ciudad']
        assert tauser.departamento == tauser_data['departamento']
        assert tauser.latitud == tauser_data['latitud']
        assert tauser.longitud == tauser_data['longitud']
        assert tauser.is_active == tauser_data['is_active']

    def test_tauser_str_method(self, tauser):
        """Test: Método __str__ del modelo"""
        expected = f"{tauser.codigo} - {tauser.nombre}"
        assert str(tauser) == expected

    def test_codigo_unique_constraint(self, tauser_data):
        """Test: Restricción de unicidad en el campo codigo"""
        Tauser.objects.create(**tauser_data)

        # Intentar crear otro Tauser con el mismo código debería fallar
        with pytest.raises(IntegrityError):
            Tauser.objects.create(**tauser_data)

    def test_default_is_active_true(self, tauser_data):
        """Test: Valor por defecto de is_active es True"""
        del tauser_data['is_active']
        tauser = Tauser.objects.create(**tauser_data)
        assert tauser.is_active is True

    def test_tauser_fields_max_length(self):
        """Test: Validación de longitud máxima de campos"""
        long_string_51 = 'a' * 51
        long_string_101 = 'a' * 101

        # Test codigo max_length=50
        # DataError en PostgreSQL, ValidationError en otros
        with pytest.raises(Exception):
            Tauser.objects.create(
                codigo=long_string_51,
                nombre='Test',
                direccion='Test address',
                ciudad='Test city',
                departamento='Test department',
                latitud=Decimal('-25.263739'),
                longitud=Decimal('-57.575926')
            )

    def test_decimal_precision(self, tauser_data):
        """Test: Precisión de campos decimales"""
        # Test con exactamente 6 decimales
        tauser_data['latitud'] = Decimal('-25.263739')
        tauser_data['longitud'] = Decimal('-57.575926')

        tauser = Tauser.objects.create(**tauser_data)

        # Verificar que los decimales se mantienen correctamente
        assert tauser.latitud == Decimal('-25.263739')
        assert tauser.longitud == Decimal('-57.575926')


@pytest.mark.django_db
class TestTauserSerializer:
    """Pruebas para el serializer de Tauser"""

    def test_serialize_tauser(self, tauser):
        """Test: Serialización de un Tauser"""
        serializer = TauserSerializer(tauser)
        data = serializer.data

        assert data['id'] == str(tauser.id)
        assert data['codigo'] == tauser.codigo
        assert data['nombre'] == tauser.nombre
        assert data['direccion'] == tauser.direccion
        assert data['ciudad'] == tauser.ciudad
        assert data['departamento'] == tauser.departamento
        assert data['latitud'] == str(tauser.latitud)
        assert data['longitud'] == str(tauser.longitud)
        assert data['is_active'] == tauser.is_active

    def test_deserialize_valid_data(self, tauser_data):
        """Test: Deserialización de datos válidos"""
        serializer = TauserSerializer(data=tauser_data)
        assert serializer.is_valid()

        tauser = serializer.save()
        assert tauser.codigo == tauser_data['codigo']
        assert tauser.nombre == tauser_data['nombre']

    def test_deserialize_invalid_data(self):
        """Test: Deserialización de datos inválidos"""
        invalid_data = {
            'codigo': '',  # Campo requerido vacío
            'nombre': 'Test Name',
            'direccion': 'Test address',
            'ciudad': 'Test city',
            'departamento': 'Test department',
            'latitud': 'invalid_decimal',  # Decimal inválido
            'longitud': Decimal('-57.575926')
        }

        serializer = TauserSerializer(data=invalid_data)
        assert not serializer.is_valid()
        assert 'codigo' in serializer.errors
        assert 'latitud' in serializer.errors

    def test_update_tauser(self, tauser):
        """Test: Actualización de un Tauser existente"""
        update_data = {
            'nombre': 'Tauser Actualizado',
            'ciudad': 'Ciudad Actualizada'
        }

        serializer = TauserSerializer(tauser, data=update_data, partial=True)
        assert serializer.is_valid()

        updated_tauser = serializer.save()
        assert updated_tauser.nombre == update_data['nombre']
        assert updated_tauser.ciudad == update_data['ciudad']
        assert updated_tauser.codigo == tauser.codigo  # No debería cambiar

    def test_paginated_response_serializer(self, tauser):
        """Test: Serializer de respuesta paginada"""
        mock_data = {
            'count': 1,
            'next': None,
            'previous': None,
            'results': [TauserSerializer(tauser).data]
        }

        # Este serializer es solo para documentación, no para validación
        serializer = TauserPaginatedResponseSerializer(mock_data)
        assert serializer.data['count'] == 1
        assert len(serializer.data['results']) == 1


@pytest.mark.django_db
class TestTauserViewSet:
    """Pruebas para el ViewSet de Tauser"""

    def test_list_tausers_authenticated(self, authenticated_client, tauser):
        """Test: Listar Tausers con usuario autenticado"""
        url = reverse('tauser-list')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['codigo'] == tauser.codigo

    def test_list_all_tausers(self, authenticated_client, tauser_data):
        """Test: Listar todos los Tausers sin paginación"""
        # Crear múltiples Tausers
        for i in range(3):
            data = tauser_data.copy()
            data['codigo'] = f'TAU-TEST-{i:03d}'
            Tauser.objects.create(**data)

        url = reverse('tauser-list')
        response = authenticated_client.get(url, {'all': 'true'})

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) == 3

    def test_search_tausers(self, authenticated_client, tauser_data):
        """Test: Búsqueda de Tausers"""
        # Crear Tausers con diferentes nombres
        tauser1_data = tauser_data.copy()
        tauser1_data['codigo'] = 'TAU-ASU-001'
        tauser1_data['nombre'] = 'Tauser Asunción'
        tauser1_data['ciudad'] = 'Asunción'
        Tauser.objects.create(**tauser1_data)

        tauser2_data = tauser_data.copy()
        tauser2_data['codigo'] = 'TAU-CDE-001'
        tauser2_data['nombre'] = 'Tauser Ciudad del Este'
        tauser2_data['ciudad'] = 'Ciudad del Este'
        Tauser.objects.create(**tauser2_data)

        url = reverse('tauser-list')
        response = authenticated_client.get(url, {'search': 'Asunción'})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert 'Asunción' in response.data['results'][0]['nombre']

    def test_create_tauser(self, authenticated_client, tauser_data):
        """Test: Crear un nuevo Tauser"""
        url = reverse('tauser-list')
        response = authenticated_client.post(url, tauser_data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['codigo'] == tauser_data['codigo']
        assert Tauser.objects.filter(codigo=tauser_data['codigo']).exists()

    def test_create_tauser_invalid_data(self, authenticated_client):
        """Test: Crear Tauser con datos inválidos"""
        invalid_data = {
            'codigo': '',  # Campo requerido vacío
            'nombre': 'Test Name'
        }

        url = reverse('tauser-list')
        response = authenticated_client.post(url, invalid_data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'codigo' in response.data

    def test_retrieve_tauser(self, authenticated_client, tauser):
        """Test: Obtener un Tauser específico"""
        url = reverse('tauser-detail', kwargs={'pk': tauser.pk})
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['codigo'] == tauser.codigo

    def test_update_tauser(self, authenticated_client, tauser):
        """Test: Actualizar un Tauser existente"""
        update_data = {
            'nombre': 'Tauser Actualizado',
            'ciudad': 'Ciudad Actualizada'
        }

        url = reverse('tauser-detail', kwargs={'pk': tauser.pk})
        response = authenticated_client.patch(url, update_data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['nombre'] == update_data['nombre']

        # Verificar en base de datos
        tauser.refresh_from_db()
        assert tauser.nombre == update_data['nombre']

    def test_delete_tauser_soft_delete(self, authenticated_client, tauser):
        """Test: Eliminación suave de Tauser (soft delete)"""
        url = reverse('tauser-detail', kwargs={'pk': tauser.pk})
        response = authenticated_client.delete(url)

        assert response.status_code == status.HTTP_200_OK

        # Verificar que el Tauser sigue existiendo pero está inactivo
        tauser.refresh_from_db()
        assert tauser.is_active is False

    def test_delete_inactive_tauser_returns_404(self, authenticated_client, tauser):
        """Test: Intentar eliminar un Tauser ya inactivo retorna 404"""
        # Primero marcar como inactivo
        tauser.is_active = False
        tauser.save()

        url = reverse('tauser-detail', kwargs={'pk': tauser.pk})
        response = authenticated_client.delete(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_pagination(self, authenticated_client, tauser_data):
        """Test: Paginación de resultados"""
        # Crear 15 Tausers para probar paginación
        for i in range(15):
            data = tauser_data.copy()
            data['codigo'] = f'TAU-TEST-{i:03d}'
            Tauser.objects.create(**data)

        url = reverse('tauser-list')
        response = authenticated_client.get(url, {'page_size': 5})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 5
        assert response.data['count'] == 15
        assert response.data['next'] is not None

    def test_pagination_custom_page_size(self, authenticated_client, tauser_data):
        """Test: Tamaño de página personalizado"""
        # Crear 12 Tausers
        for i in range(12):
            data = tauser_data.copy()
            data['codigo'] = f'TAU-TEST-{i:03d}'
            Tauser.objects.create(**data)

        url = reverse('tauser-list')
        response = authenticated_client.get(url, {'page_size': 8})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 8

    def test_user_without_permissions(self, api_client):
        """Test: Usuario sin permisos DjangoModelPermissions puede acceder"""
        # Nota: Sin DjangoModelPermissions específico configurado en settings,
        # el usuario autenticado puede acceder. Este test verifica el comportamiento actual.
        user = User.objects.create_user(
            username='noperms',
            email='noperms@example.com',
            password='testpass123'
        )
        api_client.force_authenticate(user=user)

        url = reverse('tauser-list')
        response = api_client.get(url)

        # Sin configuración específica de permisos, usuario autenticado puede acceder
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestTauserURLs:
    """Pruebas para las URLs de Tauser"""

    def test_tauser_list_url_resolves(self):
        """Test: URL de lista de Tausers se resuelve correctamente"""
        url = reverse('tauser-list')
        assert url == '/api/tauser/'

    def test_tauser_detail_url_resolves(self, tauser):
        """Test: URL de detalle de Tauser se resuelve correctamente"""
        url = reverse('tauser-detail', kwargs={'pk': tauser.pk})
        assert url == f'/api/tauser/{tauser.pk}/'


@pytest.mark.django_db
class TestTauserIntegration:
    """Pruebas de integración para Tauser"""

    def test_complete_crud_workflow(self, authenticated_client, tauser_data):
        """Test: Flujo completo CRUD de Tauser"""
        # 1. CREATE
        create_url = reverse('tauser-list')
        create_response = authenticated_client.post(
            create_url, tauser_data, format='json')
        assert create_response.status_code == status.HTTP_201_CREATED
        tauser_id = create_response.data['id']

        # 2. READ
        detail_url = reverse('tauser-detail', kwargs={'pk': tauser_id})
        read_response = authenticated_client.get(detail_url)
        assert read_response.status_code == status.HTTP_200_OK
        assert read_response.data['codigo'] == tauser_data['codigo']

        # 3. UPDATE
        update_data = {'nombre': 'Tauser Actualizado'}
        update_response = authenticated_client.patch(
            detail_url, update_data, format='json')
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.data['nombre'] == 'Tauser Actualizado'

        # 4. DELETE (soft delete)
        delete_response = authenticated_client.delete(detail_url)
        assert delete_response.status_code == status.HTTP_200_OK

        # Verificar que está marcado como inactivo
        tauser = Tauser.objects.get(id=tauser_id)
        assert tauser.is_active is False

    def test_search_and_filter_integration(self, authenticated_client, tauser_data):
        """Test: Integración de búsqueda y filtros"""
        # Crear varios Tausers con diferentes datos
        cities = ['Asunción', 'Ciudad del Este', 'Encarnación']
        for i, city in enumerate(cities):
            data = tauser_data.copy()
            data['codigo'] = f'TAU-{city[:3].upper()}-{i:03d}'
            data['nombre'] = f'Tauser {city}'
            data['ciudad'] = city
            Tauser.objects.create(**data)

        url = reverse('tauser-list')

        # Test búsqueda por ciudad
        response = authenticated_client.get(url, {'search': 'Asunción'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1

        # Test búsqueda por código - usar código completo
        response = authenticated_client.get(url, {'search': 'TAU-CIU'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1

        # Test búsqueda que no encuentra resultados
        response = authenticated_client.get(url, {'search': 'NoExiste'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 0


@pytest.mark.django_db
class TestTauserConStockEndpoint:
    """Pruebas para el endpoint con-stock de Tauser"""

    @pytest.fixture
    def divisa(self):
        """Crear una divisa de prueba"""
        from apps.divisas.models import Divisa
        return Divisa.objects.create(
            codigo='USD',
            nombre='Dólar Estadounidense',
            simbolo='$',
            is_active=True,
            max_digitos=30,
            precision=6,
            es_base=False
        )

    @pytest.fixture
    def denominaciones(self, divisa):
        """Crear denominaciones de prueba para la divisa"""
        from apps.divisas.models import Denominacion
        return [
            Denominacion.objects.create(
                divisa=divisa, denominacion=1, is_active=True),
            Denominacion.objects.create(
                divisa=divisa, denominacion=5, is_active=True),
            Denominacion.objects.create(
                divisa=divisa, denominacion=10, is_active=True),
            Denominacion.objects.create(
                divisa=divisa, denominacion=20, is_active=True),
            Denominacion.objects.create(
                divisa=divisa, denominacion=50, is_active=True),
            Denominacion.objects.create(
                divisa=divisa, denominacion=100, is_active=True),
        ]

    @pytest.fixture
    def tausers_con_stock(self, tauser_data, denominaciones, divisa):
        """Crear tausers con diferentes niveles de stock"""
        from apps.stock.models import StockDivisaTauser

        # Tauser 1: Stock total = 1000 (100x10)
        tauser1_data = tauser_data.copy()
        tauser1_data['codigo'] = 'TAU-001'
        tauser1_data['nombre'] = 'Tauser Alto Stock'
        tauser1 = Tauser.objects.create(**tauser1_data)
        StockDivisaTauser.objects.create(
            tauser=tauser1,
            denominacion=denominaciones[5],  # Denominación de 100
            stock=10
        )

        # Tauser 2: Stock total = 250 (50x5)
        tauser2_data = tauser_data.copy()
        tauser2_data['codigo'] = 'TAU-002'
        tauser2_data['nombre'] = 'Tauser Medio Stock'
        tauser2 = Tauser.objects.create(**tauser2_data)
        StockDivisaTauser.objects.create(
            tauser=tauser2,
            denominacion=denominaciones[4],  # Denominación de 50
            stock=5
        )

        # Tauser 3: Stock total = 50 (10x5)
        tauser3_data = tauser_data.copy()
        tauser3_data['codigo'] = 'TAU-003'
        tauser3_data['nombre'] = 'Tauser Bajo Stock'
        tauser3 = Tauser.objects.create(**tauser3_data)
        StockDivisaTauser.objects.create(
            tauser=tauser3,
            denominacion=denominaciones[2],  # Denominación de 10
            stock=5
        )

        # Tauser 4: Stock mixto = 165 (100x1 + 50x1 + 10x1 + 5x1)
        tauser4_data = tauser_data.copy()
        tauser4_data['codigo'] = 'TAU-004'
        tauser4_data['nombre'] = 'Tauser Stock Mixto'
        tauser4 = Tauser.objects.create(**tauser4_data)
        StockDivisaTauser.objects.create(
            tauser=tauser4,
            denominacion=denominaciones[5],  # 100
            stock=1
        )
        StockDivisaTauser.objects.create(
            tauser=tauser4,
            denominacion=denominaciones[4],  # 50
            stock=1
        )
        StockDivisaTauser.objects.create(
            tauser=tauser4,
            denominacion=denominaciones[2],  # 10
            stock=1
        )
        StockDivisaTauser.objects.create(
            tauser=tauser4,
            denominacion=denominaciones[1],  # 5
            stock=1
        )

        # Tauser 5: Sin stock
        tauser5_data = tauser_data.copy()
        tauser5_data['codigo'] = 'TAU-005'
        tauser5_data['nombre'] = 'Tauser Sin Stock'
        tauser5 = Tauser.objects.create(**tauser5_data)

        # Tauser 6: Inactivo con stock (no debería aparecer)
        tauser6_data = tauser_data.copy()
        tauser6_data['codigo'] = 'TAU-006'
        tauser6_data['nombre'] = 'Tauser Inactivo'
        tauser6_data['is_active'] = False
        tauser6 = Tauser.objects.create(**tauser6_data)
        StockDivisaTauser.objects.create(
            tauser=tauser6,
            denominacion=denominaciones[5],
            stock=10
        )

        return [tauser1, tauser2, tauser3, tauser4, tauser5, tauser6]

    def test_con_stock_missing_divisa_id(self, authenticated_client):
        """Test: Error cuando falta el parámetro divisa_id"""
        url = reverse('tauser-con-stock')
        response = authenticated_client.get(url, {'monto': 100})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'divisa_id' in response.data['detail']

    def test_con_stock_missing_monto(self, authenticated_client, divisa):
        """Test: Error cuando falta el parámetro monto"""
        url = reverse('tauser-con-stock')
        response = authenticated_client.get(url, {'divisa_id': divisa.id})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'monto' in response.data['detail']

    def test_con_stock_invalid_divisa_id(self, authenticated_client):
        """Test: Error cuando divisa_id no es un número"""
        url = reverse('tauser-con-stock')
        response = authenticated_client.get(
            url, {'divisa_id': 'invalid', 'monto': 100})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'numéricos válidos' in response.data['detail']

    def test_con_stock_invalid_monto(self, authenticated_client, divisa):
        """Test: Error cuando monto no es un número"""
        url = reverse('tauser-con-stock')
        response = authenticated_client.get(
            url, {'divisa_id': divisa.id, 'monto': 'invalid'})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'numéricos válidos' in response.data['detail']

    def test_con_stock_monto_bajo(self, authenticated_client, divisa, tausers_con_stock):
        """Test: Solo aparecen tausers que pueden formar el monto con sus denominaciones"""
        url = reverse('tauser-con-stock')
        response = authenticated_client.get(
            url, {'divisa_id': divisa.id, 'monto': 10})

        assert response.status_code == status.HTTP_200_OK
        # Solo pueden entregar 10 exacto TAU-003 (10x5) y TAU-004 (tiene una de 10)
        assert len(response.data) == 2
        codigos = [t['codigo'] for t in response.data]
        assert 'TAU-003' in codigos
        assert 'TAU-004' in codigos
        assert 'TAU-005' not in codigos  # Sin stock
        assert 'TAU-006' not in codigos  # Inactivo

    def test_con_stock_monto_medio(self, authenticated_client, divisa, tausers_con_stock):
        """Test: Solo tausers con stock suficiente aparecen para monto medio"""
        url = reverse('tauser-con-stock')
        response = authenticated_client.get(
            url, {'divisa_id': divisa.id, 'monto': 100})

        assert response.status_code == status.HTTP_200_OK
        # Deberían aparecer TAU-001 (1000), TAU-002 (250), TAU-004 (165)
        # No debería aparecer TAU-003 (50)
        assert len(response.data) == 3
        codigos = [t['codigo'] for t in response.data]
        assert 'TAU-001' in codigos
        assert 'TAU-002' in codigos
        assert 'TAU-004' in codigos
        assert 'TAU-003' not in codigos

    def test_con_stock_monto_alto(self, authenticated_client, divisa, tausers_con_stock):
        """Test: Solo tausers con stock muy alto aparecen"""
        url = reverse('tauser-con-stock')
        response = authenticated_client.get(
            url, {'divisa_id': divisa.id, 'monto': 500})

        assert response.status_code == status.HTTP_200_OK
        # Solo debería aparecer TAU-001 (1000)
        assert len(response.data) == 1
        assert response.data[0]['codigo'] == 'TAU-001'

    def test_con_stock_monto_exacto(self, authenticated_client, divisa, tausers_con_stock):
        """Test: Solo aparecen tausers con combinación exacta para el monto"""
        url = reverse('tauser-con-stock')
        response = authenticated_client.get(
            url, {'divisa_id': divisa.id, 'monto': 250})

        assert response.status_code == status.HTTP_200_OK
        # TAU-002 puede formar 250 con 5 billetes de 50; TAU-001 no puede formar 250 exacto
        assert len(response.data) == 1
        codigos = [t['codigo'] for t in response.data]
        assert 'TAU-002' in codigos

    def test_con_stock_monto_imposible(self, authenticated_client, divisa, tausers_con_stock):
        """Test: Ningún tauser aparece si el monto es muy alto"""
        url = reverse('tauser-con-stock')
        response = authenticated_client.get(
            url, {'divisa_id': divisa.id, 'monto': 10000})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_con_stock_divisa_inexistente(self, authenticated_client, tausers_con_stock):
        """Test: Ningún tauser aparece para divisa que no tiene stock"""
        url = reverse('tauser-con-stock')
        response = authenticated_client.get(
            url, {'divisa_id': 99999, 'monto': 10})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_con_stock_monto_cero(self, authenticated_client, divisa, tausers_con_stock):
        """Test: Todos los tausers con stock aparecen para monto cero"""
        url = reverse('tauser-con-stock')
        response = authenticated_client.get(
            url, {'divisa_id': divisa.id, 'monto': 0})

        assert response.status_code == status.HTTP_200_OK
        # Deberían aparecer todos menos TAU-005 (sin stock) y TAU-006 (inactivo)
        assert len(response.data) == 4

    def test_con_stock_monto_decimal(self, authenticated_client, divisa, tausers_con_stock):
        """Test: Montos no enteros no se pueden formar con denominaciones enteras"""
        url = reverse('tauser-con-stock')
        response = authenticated_client.get(
            url, {'divisa_id': divisa.id, 'monto': 49.99})

        assert response.status_code == status.HTTP_200_OK
        # Ningún tauser puede cubrir un monto con decimales usando denominaciones enteras
        assert len(response.data) == 0

    def test_con_stock_ordenado_por_codigo(self, authenticated_client, divisa, tausers_con_stock):
        """Test: Los resultados están ordenados por código"""
        url = reverse('tauser-con-stock')
        response = authenticated_client.get(
            url, {'divisa_id': divisa.id, 'monto': 10})

        assert response.status_code == status.HTTP_200_OK
        codigos = [t['codigo'] for t in response.data]
        assert codigos == sorted(codigos)

    def test_con_stock_calculo_stock_mixto(self, authenticated_client, divisa, tausers_con_stock):
        """Test: Cálculo correcto de stock con múltiples denominaciones"""
        url = reverse('tauser-con-stock')
        # TAU-004 tiene: 100x1 + 50x1 + 10x1 + 5x1 = 165 total
        response = authenticated_client.get(
            url, {'divisa_id': divisa.id, 'monto': 165})

        assert response.status_code == status.HTTP_200_OK
        codigos = [t['codigo'] for t in response.data]
        assert codigos == ['TAU-004']  # Solo TAU-004 puede formar 165 exacto

    def test_con_stock_solo_tausers_activos(self, authenticated_client, divisa, tausers_con_stock):
        """Test: Solo tausers activos aparecen en los resultados"""
        url = reverse('tauser-con-stock')
        response = authenticated_client.get(
            url, {'divisa_id': divisa.id, 'monto': 10})

        assert response.status_code == status.HTTP_200_OK
        codigos = [t['codigo'] for t in response.data]
        # TAU-006 está inactivo pero tiene stock, no debería aparecer
        assert 'TAU-006' not in codigos
        # Verificar que todos los retornados tienen is_active=True
        for tauser_data in response.data:
            assert tauser_data['is_active'] is True
