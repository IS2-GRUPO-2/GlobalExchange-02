import pytest
from decimal import Decimal
from django.core.exceptions import ValidationError
from apps.stock.serializers import MovimientoStockSerializer
from apps.stock.models import (
    MovimientoStock,
    MovimientoStockDetalle,
    StockDivisaCasa,
    StockDivisaTauser,
    TipoMovimiento,
    EstadoMovimiento
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
    ent_clt = TipoMovimiento.objects.create(codigo="ENTCLT", descripcion="Entrada cliente")
    ent_cs = TipoMovimiento.objects.create(codigo="ENTCS", descripcion="Entrada casa")
    sal_clt = TipoMovimiento.objects.create(codigo="SALCLT", descripcion="Salida cliente")
    sal_cs = TipoMovimiento.objects.create(codigo="SALCS", descripcion="Salida casa")

    estado_inicial = EstadoMovimiento.objects.create(codigo="EN_PROCESO", descripcion="")

    # Crear stock inicial
    StockDivisaCasa.objects.create(denominacion=denom_100, stock=50)
    StockDivisaCasa.objects.create(denominacion=denom_50, stock=50)
    StockDivisaCasa.objects.create(denominacion=denom_20, stock=50)

    StockDivisaTauser.objects.create(tauser=tauser, denominacion=denom_100, stock=10)
    StockDivisaTauser.objects.create(tauser=tauser, denominacion=denom_50, stock=10)
    StockDivisaTauser.objects.create(tauser=tauser, denominacion=denom_20, stock=10)

    # Crear una transacción
    transaccion = Transaccion.objects.create(
        id_user=user,
        cliente=cliente,
        operacion='venta',
        tasa_aplicada=Decimal('1.0'),
        tasa_inicial=Decimal('1.0'),
        divisa_origen=divisa,
        divisa_destino=divisa,
        monto_origen=Decimal('170.00'),
        monto_destino=Decimal('170.00'),
        tauser=tauser,
        estado='en_proceso'
    )

    return {
        "tauser": tauser,
        "denominaciones": [denom_100, denom_50, denom_20],
        "tipos": {"ENTCLT": ent_clt, "ENTCS": ent_cs, "SALCLT": sal_clt, "SALCS": sal_cs},
        "estado": estado_inicial,
        "divisa": divisa,
        "transaccion": transaccion
    }

def test_create_movimiento_entclt(db, setup_data):
    tauser = setup_data["tauser"]
    tipo = setup_data["tipos"]["ENTCLT"]
    denom_100 = setup_data["denominaciones"][0]
    estado = setup_data["estado"]
    divisa = setup_data["divisa"]

    data = {
        "tipo_movimiento": tipo.codigo,
        "tauser": tauser.id,
        "monto": "100.00",
        "divisa": divisa.id,
        "estado": estado.codigo,
        "detalles": [
            {"denominacion": denom_100.id, "cantidad": 1}
        ],
    }

    serializer = MovimientoStockSerializer(data=data)
    assert serializer.is_valid(), serializer.errors
    movimiento = serializer.save()

    assert MovimientoStock.objects.count() == 1
    assert MovimientoStockDetalle.objects.count() == 1

    stock = StockDivisaTauser.objects.get(tauser=tauser, denominacion=denom_100)
    assert stock.stock == 11  # Se incrementó


def test_create_movimiento_entcs(db, setup_data):
    tauser = setup_data["tauser"]
    tipo = setup_data["tipos"]["ENTCS"]
    denom_50 = setup_data["denominaciones"][1]
    estado = setup_data["estado"]
    divisa = setup_data["divisa"]
    data = {
        "tipo_movimiento": tipo.codigo,
        "tauser": tauser.id,
        "monto": "50.00",
        "divisa": divisa.id,
        "estado": estado.codigo,
        "detalles": [
            {"denominacion": denom_50.id, "cantidad": 1}
        ],
    }

    serializer = MovimientoStockSerializer(data=data)
    assert serializer.is_valid(), serializer.errors
    movimiento = serializer.save()

    casa_stock = StockDivisaCasa.objects.get(denominacion=denom_50)
    tauser_stock = StockDivisaTauser.objects.get(tauser=tauser, denominacion=denom_50)

    assert casa_stock.stock == 49  # se descontó de la casa
    assert tauser_stock.stock == 11  # se incrementó en tauser

def test_create_movimiento_salclt(db, setup_data):
    tauser = setup_data["tauser"]
    tipo = setup_data["tipos"]["SALCLT"]
    estado = setup_data["estado"]
    divisa = setup_data["divisa"]
    transaccion = setup_data["transaccion"]

    data = {
        "tipo_movimiento": tipo.codigo,
        "tauser": tauser.id,
        "transaccion": transaccion.id,
        "estado": estado.codigo,
        "divisa": divisa.id,
    }

    serializer = MovimientoStockSerializer(data=data)
    assert serializer.is_valid(), serializer.errors
    movimiento = serializer.save()

    detalles = MovimientoStockDetalle.objects.filter(movimiento_stock=movimiento)
    total = sum(d.cantidad * d.denominacion.denominacion for d in detalles)

    # Verificar que el total del movimiento coincide con el monto de la transacción
    assert total == transaccion.monto_origen
    
    # Verificar que se descontó del stock del tauser
    for stock in StockDivisaTauser.objects.filter(tauser=tauser):
        assert stock.stock <= 10  # Se descontó algo
        
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
        "tipo_movimiento": tipo.codigo,
        "tauser": tauser.id,
        "monto": "40.00",
        "divisa": divisa.id,
        "estado": estado.codigo,
        "detalles": [
            {"denominacion": denom_20.id, "cantidad": 2}
        ],
    }

    serializer = MovimientoStockSerializer(data=data)
    assert serializer.is_valid(), serializer.errors
    movimiento = serializer.save()

    tauser_stock = StockDivisaTauser.objects.get(tauser=tauser, denominacion=denom_20)
    casa_stock = StockDivisaCasa.objects.get(denominacion=denom_20)

    assert tauser_stock.stock == 8  # se descontó
    assert casa_stock.stock == 52  # se incrementó



