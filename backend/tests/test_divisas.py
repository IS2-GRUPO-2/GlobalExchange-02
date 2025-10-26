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
    assert Denominacion.objects.filter(
        divisa=divisa, denominacion=2000).exists()


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

    # Crear divisa sin tasa (no debe aparecer)
    eur = Divisa.objects.create(
        codigo="EUR", nombre="Euro", simbolo="€", es_base=False, is_active=True
    )

    url = reverse("divisa-con-tasa")  # usa el nombre del @action
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert "results" in data

    codigos = [d["codigo"] for d in data["results"]]

    # Validaciones
    assert "PYG" in codigos  # siempre incluye la base
    assert "USD" in codigos  # incluye la que tiene tasa
    assert "EUR" not in codigos  # no incluye la sin tasa


# ==================== TESTS PARA VALIDAR DENOMINACIONES ====================

@pytest.mark.django_db
def test_validar_denominaciones_monto_exacto(api_client, divisa):
    """Test: El monto coincide exactamente con una denominación."""
    Denominacion.objects.create(
        divisa=divisa, denominacion=1000, is_active=True)
    Denominacion.objects.create(
        divisa=divisa, denominacion=500, is_active=True)

    url = reverse("divisa-validar-denominaciones", args=[divisa.id])
    response = api_client.get(url, {"monto": 1000})

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["puede_acumular"] is True
    assert data["divisa_id"] == divisa.id
    assert data["monto"] == 1000


@pytest.mark.django_db
def test_validar_denominaciones_combinacion_simple(api_client, divisa):
    """Test: El monto se puede formar con combinación de denominaciones."""
    Denominacion.objects.create(
        divisa=divisa, denominacion=1000, is_active=True)
    Denominacion.objects.create(
        divisa=divisa, denominacion=500, is_active=True)

    url = reverse("divisa-validar-denominaciones", args=[divisa.id])
    response = api_client.get(url, {"monto": 1500})

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["puede_acumular"] is True


@pytest.mark.django_db
def test_validar_denominaciones_imposible(api_client, divisa):
    """Test: El monto NO se puede formar con las denominaciones disponibles."""
    Denominacion.objects.create(
        divisa=divisa, denominacion=1000, is_active=True)
    Denominacion.objects.create(
        divisa=divisa, denominacion=500, is_active=True)

    url = reverse("divisa-validar-denominaciones", args=[divisa.id])
    # 300 no se puede formar con 1000 y 500
    response = api_client.get(url, {"monto": 300})

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["puede_acumular"] is False


@pytest.mark.django_db
def test_validar_denominaciones_solo_denominaciones_activas(api_client, divisa):
    """Test: Solo considera denominaciones activas."""
    Denominacion.objects.create(
        divisa=divisa, denominacion=100, is_active=True)
    Denominacion.objects.create(
        divisa=divisa, denominacion=50, is_active=False)

    url = reverse("divisa-validar-denominaciones", args=[divisa.id])
    # 150 se podría formar con 100 + 50, pero 50 está inactiva
    response = api_client.get(url, {"monto": 150})

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["puede_acumular"] is False


@pytest.mark.django_db
def test_validar_denominaciones_sin_denominaciones(api_client, divisa):
    """Test: Divisa sin denominaciones activas retorna False."""
    url = reverse("divisa-validar-denominaciones", args=[divisa.id])
    response = api_client.get(url, {"monto": 1000})

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["puede_acumular"] is False


@pytest.mark.django_db
def test_validar_denominaciones_monto_cero(api_client, divisa):
    """Test: Monto cero o negativo retorna False."""
    Denominacion.objects.create(
        divisa=divisa, denominacion=1000, is_active=True)

    url = reverse("divisa-validar-denominaciones", args=[divisa.id])
    response = api_client.get(url, {"monto": 0})

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["puede_acumular"] is False


@pytest.mark.django_db
def test_validar_denominaciones_sin_parametro_monto(api_client, divisa):
    """Test: Sin parámetro monto retorna error 400."""
    url = reverse("divisa-validar-denominaciones", args=[divisa.id])
    response = api_client.get(url)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "monto" in response.json()["detail"].lower()


@pytest.mark.django_db
def test_validar_denominaciones_monto_invalido(api_client, divisa):
    """Test: Monto no numérico retorna error 400."""
    url = reverse("divisa-validar-denominaciones", args=[divisa.id])
    response = api_client.get(url, {"monto": "abc"})

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "entero positivo" in response.json()["detail"].lower()


@pytest.mark.django_db
def test_validar_denominaciones_monto_negativo(api_client, divisa):
    """Test: Monto negativo retorna False."""
    Denominacion.objects.create(
        divisa=divisa, denominacion=1000, is_active=True)

    url = reverse("divisa-validar-denominaciones", args=[divisa.id])
    response = api_client.get(url, {"monto": -500})

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_validar_denominaciones_divisa_inexistente(api_client):
    """Test: Divisa inexistente retorna error 404."""
    url = reverse("divisa-validar-denominaciones", args=[99999])
    response = api_client.get(url, {"monto": 1000})

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_validar_denominaciones_combinacion_compleja(api_client, divisa):
    """Test: Monto complejo que requiere múltiples denominaciones."""
    Denominacion.objects.create(
        divisa=divisa, denominacion=1000, is_active=True)
    Denominacion.objects.create(
        divisa=divisa, denominacion=500, is_active=True)
    Denominacion.objects.create(
        divisa=divisa, denominacion=100, is_active=True)
    Denominacion.objects.create(divisa=divisa, denominacion=50, is_active=True)

    url = reverse("divisa-validar-denominaciones", args=[divisa.id])
    # 1650 = 1000 + 500 + 100 + 50
    response = api_client.get(url, {"monto": 1650})

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["puede_acumular"] is True


@pytest.mark.django_db
def test_validar_denominaciones_solo_una_denominacion(api_client, divisa):
    """Test: Con una sola denominación, solo múltiplos son posibles."""
    Denominacion.objects.create(
        divisa=divisa, denominacion=100, is_active=True)

    url = reverse("divisa-validar-denominaciones", args=[divisa.id])

    # 500 es múltiplo de 100
    response = api_client.get(url, {"monto": 500})
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["puede_acumular"] is True

    # 350 NO es múltiplo de 100
    response = api_client.get(url, {"monto": 350})
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["puede_acumular"] is False
