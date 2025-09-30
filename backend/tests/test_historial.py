from decimal import Decimal
import pytest
from rest_framework.test import APIClient
from django.urls import reverse

from apps.usuarios.models import User  # tu custom User
from apps.clientes.models import Cliente, CategoriaCliente
from apps.operaciones.models import Transaccion
from apps.divisas.models import Divisa
from apps.operaciones.models import MetodoFinanciero
from apps.tauser.models import Tauser

@pytest.fixture
def api_client(db, django_user_model):
    """Cliente autenticado como admin."""
    user = django_user_model.objects.create_superuser(
        username="admin", password="adminpass", email="admin@test.com"
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
def test_get_historial_transacciones_returns_transactions(api_client):
    # Arrange - crear datos mínimos necesarios
    operador = User.objects.create_user(username="operador", password="test123", is_superuser=True)

    categoria = CategoriaCliente.objects.create(nombre="VIP")
    cliente = Cliente.objects.create(
        nombre="Juan Pérez",
        isPersonaFisica=True,
        id_categoria=categoria,
        cedula="1234567",
        correo="juan@example.com",
        telefono="123456",
        direccion="Calle Falsa 123",
        ruc="80012345",
    )

    divisa_usd = Divisa.objects.create(codigo="USD", nombre="Dólar", simbolo="$", es_base=True)
    divisa_eur = Divisa.objects.create(codigo="EUR", nombre="Euro", simbolo="€")

    metodo = MetodoFinanciero.objects.create(nombre="EFECTIVO")

    tauser = Tauser.objects.create(
        codigo="TAU001",
        nombre="Tauser Central",
        direccion="Av. Principal 1000",
        ciudad="Asunción",
        departamento="Central",
        latitud=-25.2637,
        longitud=-57.5759,
    )

    transaccion = Transaccion.objects.create(
        operador=operador,
        cliente=cliente,
        operacion="compra",
        tasa_aplicada=Decimal("7100.123456"),
        tasa_inicial=Decimal("7000.000000"),
        divisa_origen=divisa_usd,
        divisa_destino=divisa_eur,
        monto_origen=Decimal("100.00"),
        monto_destino=Decimal("95.00"),
        metodo_financiero=metodo,
        tauser=tauser,
        estado="pendiente",
    )

    # Act - llamar al endpoint
    url = reverse("clientes-get-transacciones", args=[cliente.idCliente])
    response = api_client.get(url)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["id"] == transaccion.id
    assert data[0]["operacion"] == "compra"
    assert data[0]["estado"] == "pendiente"
    assert data[0]["cliente"] == str(cliente.idCliente)
