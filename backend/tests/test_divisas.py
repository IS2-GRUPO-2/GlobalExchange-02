import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.divisas.models import Divisa, Denominacion
from apps.cotizaciones.models import Tasa

@pytest.fixture
def api_client(db, django_user_model):
    """Cliente autenticado como admin."""
    user = django_user_model.objects.create_superuser(
        username="admin", password="adminpass", email="admin@test.com"
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def divisa():
    return Divisa.objects.create(codigo="USD", nombre="Dólar", simbolo="$")

def test_list_divisas(api_client, divisa):
    url = reverse("divisa-list")
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert "results" in data
    assert data["count"] == 1
    assert len(data["results"]) == 1
    assert data["results"][0]["codigo"] == "USD"

def test_create_divisa(api_client):
    url = reverse("divisa-list")
    data = {"codigo": "EUR", "nombre": "Euro", "simbolo": "€"}
    response = api_client.post(url, data, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    assert Divisa.objects.filter(codigo="EUR").exists()

def test_retrieve_divisa(api_client, divisa):
    url = reverse("divisa-detail", args=[divisa.id])
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["codigo"] == "USD"

def test_update_divisa(api_client, divisa):
    url = reverse("divisa-detail", args=[divisa.id])
    data = {"codigo": "USD", "nombre": "US Dollar", "simbolo": "$"}
    response = api_client.put(url, data, format="json")
    assert response.status_code == status.HTTP_200_OK
    divisa.refresh_from_db()
    assert divisa.nombre == "US Dollar"

def test_partial_update_divisa(api_client, divisa):
    url = reverse("divisa-detail", args=[divisa.id])
    data = {"nombre": "Dólar Americano"}
    response = api_client.patch(url, data, format="json")
    assert response.status_code == status.HTTP_200_OK
    divisa.refresh_from_db()
    assert divisa.nombre == "Dólar Americano"

def test_destroy_divisa(api_client, divisa):
    url = reverse("divisa-detail", args=[divisa.id])
    response = api_client.delete(url)
    assert response.status_code == status.HTTP_200_OK

    divisa.refresh_from_db()
    assert divisa.is_active is False
@pytest.fixture
def denominacion(divisa):
    return Denominacion.objects.create(
        divisa=divisa, denominacion=1000, is_active=True
    )


def test_list_denominaciones(api_client, divisa, denominacion):
    url = reverse("denominacion-list")
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["denominacion"] == 1000
    assert data[0]["divisa"] == divisa.id


def test_create_denominacion_success(api_client, divisa):
    url = reverse("denominacion-list")
    data = {"divisa": divisa.id, "denominacion": 2000}
    response = api_client.post(url, data, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    assert Denominacion.objects.filter(divisa=divisa, denominacion=2000).exists()


def test_create_denominacion_duplicate(api_client, divisa, denominacion):
    url = reverse("denominacion-list")
    data = {"divisa": divisa.id, "denominacion": 1000}
    response = api_client.post(url, data, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Ya existe una denominación" in response.json()["detail"]


def test_retrieve_denominacion(api_client, denominacion):
    url = reverse("denominacion-detail", args=[denominacion.id])
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["denominacion"] == 1000


def test_destroy_denominacion(api_client, denominacion):
    url = reverse("denominacion-detail", args=[denominacion.id])
    response = api_client.delete(url)
    assert response.status_code == status.HTTP_200_OK

    denominacion.refresh_from_db()
    assert denominacion.is_active is False


def test_destroy_denominacion_inactive(api_client, denominacion):
    denominacion.is_active = False
    denominacion.save()

    url = reverse("denominacion-detail", args=[denominacion.id])
    response = api_client.delete(url)
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_divisas_con_tasa_incluye_base_y_extranjeras(api_client):
    # Crear divisa base (PYG)
    base = Divisa.objects.create(
        codigo="PYG", nombre="Guaraní", simbolo="₲", es_base=True, is_active=True
    )

    # Crear divisa con tasa activa
    usd = Divisa.objects.create(
        codigo="USD", nombre="Dólar", simbolo="$", es_base=False, is_active=True
    )
    Tasa.objects.create(
        divisa=usd, 
        precioBase=7000, 
        comisionBaseCompra=100, 
        comisionBaseVenta=100, 
        activo=True
    )

    #Crear divisa sin tasa (no debe aparecer)
    eur = Divisa.objects.create(
        codigo="EUR", nombre="Euro", simbolo="€", es_base=False, is_active=True
    )

    url = reverse("divisa-con-tasa")  # usa el nombre del @action
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert "results" in data

    codigos = [d["codigo"] for d in data["results"]]

    #Validaciones
    assert "PYG" in codigos  # siempre incluye la base
    assert "USD" in codigos  # incluye la que tiene tasa
    assert "EUR" not in codigos  # no incluye la sin tasa