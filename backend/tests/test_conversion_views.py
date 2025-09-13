import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from decimal import Decimal
from apps.divisas.models import Divisa
from apps.cotizaciones.models import Tasa
from apps.operaciones.models import MetodoFinanciero
from apps.clientes.models import Cliente, CategoriaCliente
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_simular_conversion_publica_endpoint():
    client = APIClient()

    base = Divisa.objects.create(codigo="PYG", nombre="Guaraní", simbolo="₲", es_base=True)
    usd = Divisa.objects.create(codigo="USD", nombre="Dólar", simbolo="$", es_base=False)
    metodo = MetodoFinanciero.objects.create(
        nombre="Efectivo", comision_pago_porcentaje=1, comision_cobro_porcentaje=2,
        permite_pago=True, permite_cobro=True, is_active=True
    )
    Tasa.objects.create(divisa=usd, precioBase=Decimal("7300"), comisionBase=Decimal("100"), activo=True)

    url = reverse("simular-conversion-publica")
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


@pytest.mark.django_db
def test_simular_conversion_privada_endpoint_authenticated():
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
    Tasa.objects.create(divisa=usd, precioBase=Decimal("7300"), comisionBase=Decimal("100"), activo=True)

    url = reverse("simular-conversion")
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
