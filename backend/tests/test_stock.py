import pytest
from decimal import Decimal
from apps.stock.serializers import MovimientoStockSerializer
from apps.stock.enums import TipoMovimiento, EstadoMovimiento
from apps.stock.models import (
    MovimientoStock,
    MovimientoStockDetalle,
    StockDivisaCasa,
    StockDivisaTauser
)
from apps.divisas.models import Denominacion, Divisa
from apps.tauser.models import Tauser

from apps.usuarios.models import User
from apps.clientes.models import Cliente, CategoriaCliente
from apps.operaciones.models import Transaccion

@pytest.fixture
def setup_data(db):
    # Crear objetos base
    user = User.objects.create_user(username="test", password="test")
    categoria = CategoriaCliente.objects.create(nombre="Test")
    cliente = Cliente.objects.create(
        nombre="Cliente Test",
        cedula="1234567",
        correo="cliente@test.com",
        telefono="0981000000",
        direccion="Av. Principal 123",
        is_active=True,
        id_categoria=categoria
    )
    
    tauser = Tauser.objects.create(
        codigo="CASA",
        nombre="Casa Central",
        direccion="Av. Principal 123",
        ciudad="Asunción",
        departamento="Central",
        latitud=Decimal("-25.2637"),
        longitud=Decimal("-57.5759"),
    )

    divisa = Divisa.objects.create(
        codigo="USD",
        nombre="Dólar estadounidense",
        simbolo="$",
        is_active=True,
        max_digitos=30,
        precision=10,
        es_base=False
    )

    # Crear denominaciones de USD
    denom_100 = Denominacion.objects.create(denominacion=100, divisa=divisa)
    denom_50 = Denominacion.objects.create(denominacion=50, divisa=divisa)
    denom_20 = Denominacion.objects.create(denominacion=20, divisa=divisa)

    # Crear tipos de movimiento
    ent_clt = TipoMovimiento.ENTCLT
    ent_cs = TipoMovimiento.ENTCS
    sal_clt = TipoMovimiento.SALCLT
    sal_cs = TipoMovimiento.SALCS

    estado_inicial = EstadoMovimiento.EN_PROCESO

    # Crear stock inicial
    StockDivisaCasa.objects.create(denominacion=denom_100, stock=50)
    StockDivisaCasa.objects.create(denominacion=denom_50, stock=50)
    StockDivisaCasa.objects.create(denominacion=denom_20, stock=50)

    StockDivisaTauser.objects.create(tauser=tauser, denominacion=denom_100, stock=10)
    StockDivisaTauser.objects.create(tauser=tauser, denominacion=denom_50, stock=10)
    StockDivisaTauser.objects.create(tauser=tauser, denominacion=denom_20, stock=10)

    return {
        "tauser": tauser,
        "denominaciones": [denom_100, denom_50, denom_20],
        "tipos": {"ENTCLT": ent_clt, "ENTCS": ent_cs, "SALCLT": sal_clt, "SALCS": sal_cs},
        "estado": estado_inicial,
        "divisa": divisa,
        "user": user,
        "cliente": cliente
    }


def crear_transaccion(user, cliente, divisa, tauser, monto):
    return Transaccion.objects.create(
        id_user=user,
        cliente=cliente,
        operacion='venta',
        tasa_aplicada=Decimal('1.0'),
        tasa_inicial=Decimal('1.0'),
        divisa_origen=divisa,
        divisa_destino=divisa,
        monto_origen=monto,
        monto_destino=monto,
        tauser=tauser,
        estado='pendiente'
    )

def test_create_movimiento_entclt(db, setup_data):
    tauser = setup_data["tauser"]
    tipo = setup_data["tipos"]["ENTCLT"]
    denom_100 = setup_data["denominaciones"][0]
    estado = setup_data["estado"]
    divisa = setup_data["divisa"]

    data = {
        "tipo_movimiento": tipo,
        "tauser": tauser.id,
        "monto": "100.00",
        "divisa": divisa.id,
        "estado": estado,
        "detalles": [
            {"denominacion": denom_100.id, "cantidad": 1}
        ],
    }

    initial_movimientos = MovimientoStock.objects.count()
    initial_detalles = MovimientoStockDetalle.objects.count()

    serializer = MovimientoStockSerializer(data=data)
    assert serializer.is_valid(), serializer.errors
    serializer.save()

    assert MovimientoStock.objects.count() == initial_movimientos + 1
    assert MovimientoStockDetalle.objects.count() == initial_detalles + 1

    stock = StockDivisaTauser.objects.get(tauser=tauser, denominacion=denom_100)
    assert stock.stock == 11  # Se incrementó


def test_create_movimiento_entcs(db, setup_data):
    tauser = setup_data["tauser"]
    tipo = setup_data["tipos"]["ENTCS"]
    denom_50 = setup_data["denominaciones"][1]
    estado = setup_data["estado"]
    divisa = setup_data["divisa"]
    data = {
        "tipo_movimiento": tipo,
        "tauser": tauser.id,
        "monto": "50.00",
        "divisa": divisa.id,
        "estado": estado,
        "detalles": [
            {"denominacion": denom_50.id, "cantidad": 1}
        ],
    }

    tauser_stock = StockDivisaTauser.objects.get(tauser=tauser, denominacion=denom_50)
    casa_stock = StockDivisaCasa.objects.get(denominacion=denom_50)

    serializer = MovimientoStockSerializer(data=data)
    assert serializer.is_valid(), serializer.errors
    serializer.save()

    tauser_stock.refresh_from_db()
    casa_stock.refresh_from_db()

    assert casa_stock.stock == 49  # se descontó de la casa
    assert tauser_stock.stock == 11  # se incrementó en tauser

def test_create_movimiento_salclt(db, setup_data):
    tauser = setup_data["tauser"]
    tipo = setup_data["tipos"]["SALCLT"]
    estado = setup_data["estado"]
    divisa = setup_data["divisa"]
    transaccion = crear_transaccion(
        setup_data["user"],
        setup_data["cliente"],
        divisa,
        tauser,
        Decimal('170.00')
    )

    data = {
        "tipo_movimiento": tipo,
        "tauser": tauser.id,
        "transaccion": transaccion.id,
        "estado": estado,
        "divisa": divisa.id,
    }

    movimiento = MovimientoStock.objects.filter(transaccion=transaccion).first()

    detalles = MovimientoStockDetalle.objects.filter(movimiento_stock=movimiento)
    total = sum(d.cantidad * d.denominacion.denominacion for d in detalles)

    # Verificar que el total del movimiento coincide con el monto de la transacción
    assert total == transaccion.monto_origen
    
    esperado = {
        setup_data["denominaciones"][0].id: 9,
        setup_data["denominaciones"][1].id: 9,
        setup_data["denominaciones"][2].id: 9,
    }
    for stock in StockDivisaTauser.objects.filter(tauser=tauser):
        assert stock.stock == esperado[stock.denominacion_id]
        
    # Verificar que no se puede crear otro movimiento con la misma transacción
    data_duplicada = data.copy()
    serializer_duplicado = MovimientoStockSerializer(data=data_duplicada)
    assert not serializer_duplicado.is_valid()
    assert 'transaccion' in serializer_duplicado.errors


def test_create_movimiento_salcs(db, setup_data):
    tauser = setup_data["tauser"]
    tipo = setup_data["tipos"]["SALCS"]
    denom_20 = setup_data["denominaciones"][2]
    estado = setup_data["estado"]
    divisa = setup_data["divisa"]

    data = {
        "tipo_movimiento": tipo,
        "tauser": tauser.id,
        "monto": "40.00",
        "divisa": divisa.id,
        "estado": estado,
        "detalles": [
            {"denominacion": denom_20.id, "cantidad": 2}
        ],
    }

    tauser_stock = StockDivisaTauser.objects.get(tauser=tauser, denominacion=denom_20)
    casa_stock = StockDivisaCasa.objects.get(denominacion=denom_20)

    serializer = MovimientoStockSerializer(data=data)
    assert serializer.is_valid(), serializer.errors
    serializer.save()

    tauser_stock.refresh_from_db()
    casa_stock.refresh_from_db()

    assert tauser_stock.stock == 8  # se descontó
    assert casa_stock.stock == 52  # se incrementó



