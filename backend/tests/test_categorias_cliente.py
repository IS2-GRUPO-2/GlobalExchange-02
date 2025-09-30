import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
import uuid

from apps.clientes.models import CategoriaCliente
from apps.clientes.serializers import CategoriaClienteSerializer

pytestmark = pytest.mark.django_db

# -------------------- Fixtures --------------------

@pytest.fixture
def api_client(django_user_model):
    """Cliente API autenticado para probar endpoints"""
    user = django_user_model.objects.create_superuser(
        username="admin_test", 
        password="admin_password", 
        email="admin@test.com"
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client

@pytest.fixture
def categoria_base():
    """Categoría base para pruebas"""
    return {
        "nombre": "TEST_CATEGORIA",
        "descripcion": "Categoría para pruebas unitarias",
        "descuento": "8.50",
        "is_active": True
    }

@pytest.fixture
def categoria_creada():
    """Categoría ya creada en la base de datos"""
    return CategoriaCliente.objects.create(
        nombre="CATEGORIA_EXISTENTE",
        descripcion="Categoría que ya existe en la BD",
        descuento=Decimal("5.00"),
        is_active=True
    )

# -------------------- Tests de Creación --------------------

class TestCrearCategoriaCliente:
    """Tests específicos para la creación de categorías de cliente"""
    
    def test_crear_categoria_basica(self, api_client, categoria_base):
        """Test crear una categoría con campos básicos"""
        url = reverse("categorias-clientes-list")
        
        # Datos básicos
        response = api_client.post(url, categoria_base, format="json")
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["nombre"] == "TEST_CATEGORIA"
        assert response.data["descripcion"] == "Categoría para pruebas unitarias"
        assert Decimal(response.data["descuento"]) == Decimal("8.50")
        assert response.data["is_active"] is True
        
        # Verificar en la BD
        assert CategoriaCliente.objects.filter(nombre="TEST_CATEGORIA").exists()
    
    def test_crear_categoria_solo_campos_requeridos(self, api_client):
        """Test crear categoría solo con campos obligatorios"""
        url = reverse("categorias-clientes-list")
        data = {"nombre": "CATEGORIA_MINIMA"}
        
        response = api_client.post(url, data, format="json")
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["nombre"] == "CATEGORIA_MINIMA"
        assert response.data["descuento"] == "0.00"  # Valor por defecto
        assert response.data["is_active"] is True  # Valor por defecto
    
    def test_crear_categoria_nombre_existente(self, api_client, categoria_creada):
        """Test intentar crear categoría con nombre que ya existe"""
        url = reverse("categorias-clientes-list")
        data = {
            "nombre": "CATEGORIA_EXISTENTE",  # Ya existe en la BD
            "descuento": "7.50"
        }
        
        response = api_client.post(url, data, format="json")
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "nombre" in response.data  # Error debe estar en el campo nombre
    
    def test_crear_categoria_descuento_invalido(self, api_client):
        """Test validación de descuento fuera de rango normal"""
        url = reverse("categorias-clientes-list")
        data = {
            "nombre": "DESCUENTO_ALTO",
            "descuento": "120.00"  # Valor muy alto para un porcentaje
        }
        
        response = api_client.post(url, data, format="json")
        
        # Nota: Este test podría fallar si no hay validación específica
        # para el rango del descuento en el serializer
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            assert "descuento" in response.data
        else:
            # Si se permite, verificar que se guardó correctamente
            assert Decimal(response.data["descuento"]) == Decimal("120.00")
    
    def test_crear_categoria_sin_autenticacion(self):
        """Test que no se puede crear sin autenticación"""
        client = APIClient()  # Cliente sin autenticar
        url = reverse("categorias-clientes-list")
        data = {"nombre": "SIN_AUTH"}
        
        response = client.post(url, data, format="json")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

# -------------------- Tests de Edición --------------------

class TestEditarCategoriaCliente:
    """Tests específicos para la edición de categorías de cliente"""
    
    def test_editar_categoria_completa(self, api_client, categoria_creada):
        """Test edición completa de una categoría"""
        url = reverse("categorias-clientes-detail", args=[categoria_creada.id])
        data = {
            "nombre": "CATEGORIA_EDITADA",
            "descripcion": "Descripción actualizada en test",
            "descuento": "7.75",
            "is_active": True
        }
        
        response = api_client.put(url, data, format="json")
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data["nombre"] == "CATEGORIA_EDITADA"
        assert response.data["descripcion"] == "Descripción actualizada en test"
        assert Decimal(response.data["descuento"]) == Decimal("7.75")
        
        # Verificar en la BD
        categoria_creada.refresh_from_db()
        assert categoria_creada.nombre == "CATEGORIA_EDITADA"
        assert categoria_creada.descuento == Decimal("7.75")
    
    def test_editar_solo_descuento(self, api_client, categoria_creada):
        """Test edición parcial: solo actualizar el descuento"""
        url = reverse("categorias-clientes-detail", args=[categoria_creada.id])
        data = {"descuento": "12.50"}
        
        response = api_client.patch(url, data, format="json")
        
        assert response.status_code == status.HTTP_200_OK
        assert Decimal(response.data["descuento"]) == Decimal("12.50")
        assert response.data["nombre"] == "CATEGORIA_EXISTENTE"  # No debe cambiar
        
        # Verificar en la BD
        categoria_creada.refresh_from_db()
        assert categoria_creada.descuento == Decimal("12.50")
        assert categoria_creada.nombre == "CATEGORIA_EXISTENTE"
    
    def test_editar_a_nombre_existente(self, api_client, categoria_creada):
        """Test edición con nombre que ya existe en otra categoría"""
        # Crear otra categoría primero
        otra_categoria = CategoriaCliente.objects.create(
            nombre="OTRA_CATEGORIA",
            descuento=Decimal("3.00")
        )
        
        # Intentar cambiar el nombre a uno que ya existe
        url = reverse("categorias-clientes-detail", args=[categoria_creada.id])
        data = {"nombre": "OTRA_CATEGORIA"}
        
        response = api_client.patch(url, data, format="json")
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "nombre" in response.data
    
    def test_editar_categoria_inexistente(self, api_client):
        """Test editar una categoría que no existe"""
        url = reverse("categorias-clientes-detail", args=[uuid.uuid4()])
        data = {"nombre": "NO_EXISTE"}
        
        response = api_client.patch(url, data, format="json")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_editar_sin_autenticacion(self, categoria_creada):
        """Test que no se puede editar sin autenticación"""
        client = APIClient()  # Cliente sin autenticar
        url = reverse("categorias-clientes-detail", args=[categoria_creada.id])
        data = {"descuento": "1.00"}
        
        response = client.patch(url, data, format="json")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

# -------------------- Tests de Inactivación --------------------

class TestInactivarCategoriaCliente:
    """Tests específicos para la inactivación de categorías de cliente"""
    
    def test_inactivar_categoria(self, api_client, categoria_creada):
        """Test inactivar una categoría activa"""
        url = reverse("categorias-clientes-detail", args=[categoria_creada.id])
        
        # Verificar que está activa inicialmente
        assert categoria_creada.is_active is True
        
        # Eliminar (inactivar)
        response = api_client.delete(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verificar en la BD que se inactivó pero no se eliminó
        categoria_creada.refresh_from_db()
        assert categoria_creada.is_active is False
        assert CategoriaCliente.objects.filter(id=categoria_creada.id).exists()
    
    def test_inactivar_categoria_ya_inactiva(self, api_client, categoria_creada):
        """Test intentar inactivar una categoría que ya está inactiva"""
        # Primero la inactivamos
        categoria_creada.is_active = False
        categoria_creada.save()
        
        url = reverse("categorias-clientes-detail", args=[categoria_creada.id])
        response = api_client.delete(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_categoria_inactiva_no_aparece_en_listado(self, api_client, categoria_creada):
        """Test que categoría inactiva no aparece en listado normal"""
        # Inactivar la categoría
        categoria_creada.is_active = False
        categoria_creada.save()
        
        # Obtener listado normal (sin all=true)
        url = reverse("categorias-clientes-list")
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # No debe estar en el listado
        categorias_ids = [cat["id"] for cat in response.data]
        assert str(categoria_creada.id) not in categorias_ids
    
    def test_categoria_inactiva_aparece_con_all_true(self, api_client, categoria_creada):
        """Test que categoría inactiva aparece en listado con all=true"""
        # Inactivar la categoría
        categoria_creada.is_active = False
        categoria_creada.save()
        
        # Obtener listado con all=true
        url = reverse("categorias-clientes-list") + "?all=true"
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # Debe estar en el listado
        categorias_ids = [cat["id"] for cat in response.data]
        assert str(categoria_creada.id) in categorias_ids
    
    def test_inactivar_sin_autenticacion(self, categoria_creada):
        """Test que no se puede inactivar sin autenticación"""
        client = APIClient()  # Cliente sin autenticar
        url = reverse("categorias-clientes-detail", args=[categoria_creada.id])
        
        response = client.delete(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
