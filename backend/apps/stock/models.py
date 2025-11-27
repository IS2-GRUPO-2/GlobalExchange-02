from django.db import models
from apps.divisas.models import Denominacion, Divisa
from apps.tauser.models import Tauser
from apps.operaciones.models import Transaccion
from apps.stock.enums import EstadoMovimiento as estados, TipoMovimiento as tipos

TIPO_CHOICES = [
    (tipos.SALCLT, "Salida de stock para el cliente"),
    (tipos.ENTCLT, "Entrada de stock del cliente"),
    (tipos.SALCS, "Salida de stock para la casa"),
    (tipos.ENTCS, "Entrada de stock para la casa"),
    ]

ESTADO_CHOICES = [
    (estados.EN_PROCESO, "Movimiento de stock en proceso"),
    (estados.FINALIZADO, "Movimiento de stock finalizado"),
    (estados.CANCELADO, "Movimiento de stock cancelado"),
]

TIPOS = [tipo[0] for tipo in TIPO_CHOICES]
ESTADOS = [estado[0] for estado in ESTADO_CHOICES]
class StockDivisaCasa(models.Model):
    stock = models.IntegerField()
    denominacion = models.ForeignKey(
        Denominacion, on_delete=models.PROTECT, unique=True)


class StockDivisaTauser(models.Model):
    tauser = models.ForeignKey(Tauser, on_delete=models.PROTECT)
    stock = models.IntegerField()
    denominacion = models.ForeignKey(Denominacion, on_delete=models.PROTECT)

    class Meta:
        unique_together = [['tauser', 'denominacion']]
        verbose_name = "Stock de Divisa en Tauser"
        verbose_name_plural = "Stocks de Divisas en Tausers"

class MovimientoStock(models.Model):
    tipo_movimiento = models.CharField(max_length=20, choices=TIPO_CHOICES)
    tauser = models.ForeignKey(Tauser, on_delete=models.PROTECT)
    transaccion = models.ForeignKey(
        Transaccion, null=True, on_delete=models.PROTECT)
    fecha = models.DateTimeField(auto_now_add=True)
    monto = models.DecimalField(max_digits=30, decimal_places=10)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES)
    divisa = models.ForeignKey(Divisa, on_delete=models.PROTECT)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(tipo_movimiento__in=TIPOS),
                name="stock_movimientostock_tipo_movimiento_check"
            ),
            models.CheckConstraint(
                check=models.Q(estado__in=ESTADOS),
                name="stock_movimientostock_estado_check"
            ),
        ]


class MovimientoStockDetalle(models.Model):
    cantidad = models.IntegerField()
    movimiento_stock = models.ForeignKey(
        MovimientoStock, on_delete=models.CASCADE)
    denominacion = models.ForeignKey(Denominacion, on_delete=models.PROTECT)
