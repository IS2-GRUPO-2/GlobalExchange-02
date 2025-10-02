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
        with pytest.raises(Exception):  # DataError en PostgreSQL, ValidationError en otros
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

    def test_list_tausers_unauthenticated(self, api_client, tauser):
        """Test: Listar Tausers sin autenticación debe fallar"""
        url = reverse('tauser-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

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
        create_response = authenticated_client.post(create_url, tauser_data, format='json')
        assert create_response.status_code == status.HTTP_201_CREATED
        tauser_id = create_response.data['id']
        
        # 2. READ
        detail_url = reverse('tauser-detail', kwargs={'pk': tauser_id})
        read_response = authenticated_client.get(detail_url)
        assert read_response.status_code == status.HTTP_200_OK
        assert read_response.data['codigo'] == tauser_data['codigo']
        
        # 3. UPDATE
        update_data = {'nombre': 'Tauser Actualizado'}
        update_response = authenticated_client.patch(detail_url, update_data, format='json')
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
