import pytest
from django.contrib.auth.hashers import check_password
from rest_framework.test import APIClient
from rest_framework import status
import uuid

from apps.usuarios.models import User
from apps.usuarios.serializers import UserSerializer
from apps.clientes.models import Cliente, CategoriaCliente

pytestmark = pytest.mark.django_db


# Fixtures para datos de prueba
@pytest.fixture
def authenticated_client():
    """Cliente API autenticado con permisos para asignar clientes"""
    from rest_framework.test import APIClient
    client = APIClient()
    user = User.objects.create_superuser(username="adminuser", password="adminpass123", email="admin@example.com")
    client.force_authenticate(user=user)
    return client
@pytest.fixture
def user_data():
    """Datos básicos para crear un usuario"""
    return {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpass123',
        'first_name': 'Test',
        'last_name': 'User'
    }


@pytest.fixture
def cliente_test():
    """Cliente de prueba"""
    categoria, _ = CategoriaCliente.objects.get_or_create(nombre='VIP', descuento=10)
    return Cliente.objects.create(
        nombre='Cliente Test',
        is_persona_fisica=True,
        id_categoria=categoria,
        correo='cliente.test@example.com',
        telefono='123456789',
        direccion='Dirección de prueba',
        cedula='12345678'
    )


@pytest.fixture
def cliente_corporativo():
    """Cliente corporativo de prueba"""
    categoria, _ = CategoriaCliente.objects.get_or_create(nombre='CORPORATIVO', descuento=5)
    return Cliente.objects.create(
        nombre='Cliente Corporativo',
        is_persona_fisica=False,
        id_categoria=categoria,
        correo='corporativo@example.com',
        telefono='987654321',
        direccion='Dirección corporativa',
        ruc='20123456789'
    )


@pytest.fixture
def user_instance(user_data):
    """Usuario de prueba creado"""
    return User.objects.create_user(**user_data)


@pytest.fixture
def api_client():
    """Cliente API para pruebas"""
    return APIClient()


# Tests del Modelo User
class TestUserModel:
    """Pruebas para el modelo User"""
    
    def test_crear_usuario(self, user_data):
        """Prueba la creación básica de un usuario"""
        user = User.objects.create_user(**user_data)
        
        assert user.username == 'testuser'
        assert user.email == 'test@example.com'
        assert user.first_name == 'Test'
        assert user.last_name == 'User'
        assert user.email_verified is False  # Por defecto debe ser False
        assert check_password('testpass123', user.password)
    
    def test_usuario_str_method(self, user_instance):
        """Prueba el método __str__ del modelo User"""
        assert str(user_instance) == 'testuser'
    
    def test_email_verified_default(self, user_instance):
        """Prueba que email_verified sea False por defecto"""
        assert user_instance.email_verified is False
    
    def test_asignar_clientes_a_usuario(self, user_instance, cliente_test, cliente_corporativo):
        """Prueba la asignación de clientes a un usuario"""
        user_instance.clientes.add(cliente_test, cliente_corporativo)
        
        assert user_instance.clientes.count() == 2
        assert cliente_test in user_instance.clientes.all()
        assert cliente_corporativo in user_instance.clientes.all()
    
    def test_relacion_muchos_a_muchos_clientes(self, cliente_test):
        """Prueba la relación many-to-many con clientes"""
        user1 = User.objects.create_user(username='user1', password='pass123')
        user2 = User.objects.create_user(username='user2', password='pass123')
        
        # Un cliente puede tener múltiples usuarios
        cliente_test.usuarios.add(user1, user2)
        
        assert cliente_test.usuarios.count() == 2
        assert user1 in cliente_test.usuarios.all()
        assert user2 in cliente_test.usuarios.all()
    
    def test_crear_superuser(self):
        """Prueba la creación de un superusuario"""
        superuser = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        
        assert superuser.is_superuser
        assert superuser.is_staff
        assert superuser.username == 'admin'


# Tests del Serializer
class TestUserSerializer:
    """Pruebas para el serializer de User"""
    
    def test_crear_usuario_con_serializer(self, user_data):
        """Prueba la creación de usuario usando el serializer"""
        serializer = UserSerializer(data=user_data)
        
        assert serializer.is_valid(), serializer.errors
        user = serializer.save()
        
        assert user.username == 'testuser'
        assert user.email == 'test@example.com'
        assert check_password('testpass123', user.password)
    
    def test_crear_usuario_con_clientes(self, user_data, cliente_test):
        """Prueba la creación de usuario con clientes asignados"""
        data = user_data.copy()
        data['clientes'] = [cliente_test.id]
        
        serializer = UserSerializer(data=data)
        
        assert serializer.is_valid(), serializer.errors
        user = serializer.save()
        
        assert user.clientes.count() == 1
        assert cliente_test in user.clientes.all()
    
    def test_password_write_only(self, user_instance):
        """Prueba que el password sea write-only"""
        serializer = UserSerializer(user_instance)
        
        assert 'password' not in serializer.data
    
    def test_campos_requeridos(self, user_data):
        """Prueba validación de campos requeridos"""
        # Test sin username
        data = user_data.copy()
        del data['username']
        serializer = UserSerializer(data=data)
        
        assert not serializer.is_valid()
        assert 'username' in serializer.errors
        
        # Test sin password
        data = user_data.copy()
        del data['password']
        serializer = UserSerializer(data=data)
        
        assert not serializer.is_valid()
        assert 'password' in serializer.errors
    
    def test_username_unico(self, user_instance):
        """Prueba que el username debe ser único"""
        data = {
            'username': 'testuser',  # mismo username que user_instance
            'email': 'otro@example.com',
            'password': 'pass123'
        }
        
        serializer = UserSerializer(data=data)
        
        assert not serializer.is_valid()
        assert 'username' in serializer.errors
    
    def test_campos_opcionales(self):
        """Prueba que algunos campos son opcionales"""
        data = {
            'username': 'minimaluser',
            'password': 'pass123'
        }
        
        serializer = UserSerializer(data=data)
        
        assert serializer.is_valid(), serializer.errors
        user = serializer.save()
        
        assert user.username == 'minimaluser'
        assert user.email == ''  # Campo opcional


# Tests de las Vistas/API
class TestUserAPI:
    """Pruebas para la API de usuarios"""
    
    def test_listar_usuarios(self, api_client, user_instance):
        """Prueba el endpoint para listar usuarios"""
        response = api_client.get('/api/usuarios/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['username'] == 'testuser'
    
    def test_crear_usuario_api(self, api_client):
        """Prueba el endpoint para crear un usuario"""
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        
        response = api_client.post('/api/usuarios/', data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.count() == 1
        
        new_user = User.objects.get(username='newuser')
        assert new_user.email == 'newuser@example.com'
        assert check_password('newpass123', new_user.password)
    
    def test_obtener_usuario_detalle(self, api_client, user_instance):
        """Prueba el endpoint para obtener detalles de un usuario"""
        response = api_client.get(f'/api/usuarios/{user_instance.id}/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == 'testuser'
        assert response.data['email'] == 'test@example.com'
    
    def test_actualizar_usuario(self, api_client, user_instance):
        """Prueba el endpoint para actualizar un usuario"""
        data = {
            'username': 'testuser',
            'email': 'updated@example.com',
            'password': 'testpass123',
            'first_name': 'Updated',
            'last_name': 'User'
        }
        
        response = api_client.put(f'/api/usuarios/{user_instance.id}/', data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        user_instance.refresh_from_db()
        assert user_instance.email == 'updated@example.com'
        assert user_instance.first_name == 'Updated'
    
    def test_actualizar_parcial_usuario(self, api_client, user_instance):
        """Prueba la actualización parcial de un usuario"""
        data = {'first_name': 'Partially Updated'}
        
        response = api_client.patch(f'/api/usuarios/{user_instance.id}/', data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        user_instance.refresh_from_db()
        assert user_instance.first_name == 'Partially Updated'
        assert user_instance.username == 'testuser'  # Sin cambios
    
    def test_eliminar_usuario(self, api_client, user_instance):
        """Prueba el endpoint para eliminar un usuario (soft delete)"""
        user_id = user_instance.id
        response = api_client.delete(f'/api/usuarios/{user_id}/')

        assert response.status_code == status.HTTP_200_OK
        # Verificar que el usuario fue desactivado, no eliminado
        user_instance.refresh_from_db()
        assert user_instance.is_active == False
        # El usuario sigue existiendo en la base de datos pero desactivado
        assert User.objects.count() == 1
        assert User.objects.filter(is_active=False).count() == 1
    
    def test_asignar_clientes_endpoint(self, authenticated_client, user_instance, cliente_test, cliente_corporativo):
        """Prueba el endpoint personalizado para asignar clientes"""
        data = {
            'clientes': [str(cliente_test.id), str(cliente_corporativo.id)]
        }
        
        response = authenticated_client.post(f'/api/usuarios/{user_instance.id}/asignar_clientes/', data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['message'] == 'Clientes asignados correctamente'
        assert len(response.data['clientes']) == 2
        
        user_instance.refresh_from_db()
        assert user_instance.clientes.count() == 2
        assert cliente_test in user_instance.clientes.all()
        assert cliente_corporativo in user_instance.clientes.all()
    
    def test_asignar_clientes_datos_invalidos(self, authenticated_client, user_instance):
        """Prueba el endpoint de asignar clientes con datos inválidos"""
        # Test con clientes que no es una lista
        data = {'clientes': 'not_a_list'}
        response = authenticated_client.post(f'/api/usuarios/{user_instance.id}/asignar_clientes/', data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
    
    def test_asignar_clientes_ids_inexistentes(self, authenticated_client, user_instance):
        """Prueba asignar clientes con IDs que no existen"""
        fake_uuid = str(uuid.uuid4())
        data = {'clientes': [fake_uuid]}
        
        response = authenticated_client.post(f'/api/usuarios/{user_instance.id}/asignar_clientes/', data, format='json')
        
        # Debería funcionar pero no asignar ningún cliente
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['clientes']) == 0
        
        user_instance.refresh_from_db()
        assert user_instance.clientes.count() == 0
    
    def test_obtener_clientes_asignados(self, api_client, user_instance, cliente_test, cliente_corporativo):
        """Prueba el endpoint para obtener clientes asignados a un usuario"""
        # Asignar clientes al usuario
        user_instance.clientes.add(cliente_test, cliente_corporativo)
        
        response = api_client.get(f'/api/usuarios/{user_instance.id}/get_clientes_asignados/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        
        # Verificar que los datos del cliente estén presentes
        cliente_nombres = [cliente['nombre'] for cliente in response.data]
        assert 'Cliente Test' in cliente_nombres
        assert 'Cliente Corporativo' in cliente_nombres
    
    def test_obtener_clientes_usuario_sin_clientes(self, api_client, user_instance):
        """Prueba obtener clientes de un usuario sin clientes asignados"""
        response = api_client.get(f'/api/usuarios/{user_instance.id}/get_clientes_asignados/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0
    
    def test_usuario_inexistente(self, api_client):
        """Prueba endpoints con un usuario que no existe"""
        fake_id = 99999
        response = api_client.get(f'/api/usuarios/{fake_id}/')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


# Tests de Validaciones y Casos Límite
class TestUserValidations:
    """Pruebas de validaciones y casos límite"""
    
    def test_username_vacio(self, api_client):
        """Prueba crear usuario con username vacío"""
        data = {
            'username': '',
            'password': 'pass123'
        }
        
        response = api_client.post('/api/usuarios/', data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'username' in response.data
    
    def test_password_vacio(self, api_client):
        """Prueba crear usuario con password vacío"""
        data = {
            'username': 'testuser',
            'password': ''
        }
        
        response = api_client.post('/api/usuarios/', data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password' in response.data
    
    def test_email_formato_invalido(self, api_client):
        """Prueba crear usuario con email de formato inválido"""
        data = {
            'username': 'testuser',
            'email': 'email-invalido',
            'password': 'pass123'
        }
        
        response = api_client.post('/api/usuarios/', data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'email' in response.data
    
    def test_username_muy_largo(self, api_client):
        """Prueba crear usuario con username demasiado largo"""
        data = {
            'username': 'a' * 200,  # Username muy largo
            'password': 'pass123'
        }
        
        response = api_client.post('/api/usuarios/', data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_asignar_lista_vacia_clientes(self, authenticated_client, user_instance):
        """Prueba asignar lista vacía de clientes"""
        data = {'clientes': []}
        
        response = authenticated_client.post(f'/api/usuarios/{user_instance.id}/asignar_clientes/', data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['clientes']) == 0
        
        user_instance.refresh_from_db()
        assert user_instance.clientes.count() == 0
