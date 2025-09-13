import pytest
from decimal import Decimal
from apps.conversiones.services import (
    _inferir_operacion,
    aplicar_descuento,
    calcular_conversion,
    calcular_conversion_publica,
)
from apps.divisas.models import Divisa
from apps.cotizaciones.models import Tasa
from apps.clientes.models import Cliente, CategoriaCliente
from apps.operaciones.models import MetodoFinanciero


@pytest.mark.django_db
def test_inferir_operacion_compra_y_venta():
    base = Divisa.objects.create(codigo="PYG", nombre="Guaraní", simbolo="₲", es_base=True)
    usd = Divisa.objects.create(codigo="USD", nombre="Dólar", simbolo="$", es_base=False)

    cliente_op, casa_op = _inferir_operacion(base, usd)
    assert cliente_op == "compra"
    assert casa_op == "venta"

    cliente_op, casa_op = _inferir_operacion(usd, base)
    assert cliente_op == "venta"
    assert casa_op == "compra"


@pytest.mark.django_db
def test_aplicar_descuento():
    com_base = Decimal("100")
    descuento = Decimal("10")  # 10%
    assert aplicar_descuento(com_base, descuento) == Decimal("90")


@pytest.mark.django_db
def test_calcular_conversion_privada():
    # Setup
    base = Divisa.objects.create(codigo="PYG", nombre="Guaraní", simbolo="₲", es_base=True)
    usd = Divisa.objects.create(codigo="USD", nombre="Dólar", simbolo="$", es_base=False)
    categoria, _= CategoriaCliente.objects.get_or_create(nombre="VIP", descuento=10)
    cliente = Cliente.objects.create(nombre="Juan Perez", idCategoria=categoria)
    metodo = MetodoFinanciero.objects.create(
        nombre="Transferencia", comision_pago_porcentaje=2, comision_cobro_porcentaje=3,
        permite_pago=True, permite_cobro=True, is_active=True
    )
    Tasa.objects.create(divisa=usd, precioBase=Decimal("7300"), comisionBase=Decimal("100"), activo=True)

    # Ejecutar simulación
    resultado = calcular_conversion(
        cliente_id=cliente.idCliente,
        divisa_origen_id=base.id,
        divisa_destino_id=usd.id,
        monto=1000,
        metodo_id=metodo.id
    )

    assert resultado["operacion_cliente"] == "compra"
    assert resultado["operacion_casa"] == "venta"
    assert "tc_final" in resultado
    assert "monto_destino" in resultado


@pytest.mark.django_db
def test_calcular_conversion_publica():
    base = Divisa.objects.create(codigo="PYG", nombre="Guaraní", simbolo="₲", es_base=True)
    usd = Divisa.objects.create(codigo="USD", nombre="Dólar", simbolo="$", es_base=False)
    metodo = MetodoFinanciero.objects.create(
        nombre="Efectivo", comision_pago_porcentaje=1, comision_cobro_porcentaje=2,
        permite_pago=True, permite_cobro=True, is_active=True
    )
    Tasa.objects.create(divisa=usd, precioBase=Decimal("7300"), comisionBase=Decimal("100"), activo=True)

    resultado = calcular_conversion_publica(
        divisa_origen_id=base.id,
        divisa_destino_id=usd.id,
        monto=5000,
        metodo_id=metodo.id
    )

    assert resultado["operacion_cliente"] == "compra"
    assert resultado["divisa_origen"] == "PYG"
    assert resultado["divisa_destino"] == "USD"
