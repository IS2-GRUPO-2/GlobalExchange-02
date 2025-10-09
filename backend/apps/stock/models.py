from django.db import models
from apps.divisas.models import Denominacion
from apps.tauser.models import Tauser
from apps.operaciones.models import Transaccion

class StockDivisaCasa(models.Model):
    stock = models.IntegerField()
    denominacion = models.ForeignKey(Denominacion, on_delete=models.PROTECT, unique=True)    

class StockDivisaTauser(models.Model):
    tauser = models.ForeignKey(Tauser, on_delete=models.PROTECT, unique=True)
    stock = models.IntegerField()
    denominacion = models.ForeignKey(Denominacion, on_delete=models.PROTECT)

class TipoMovimiento(models.Model):
    codigo = models.CharField(max_length=10, unique=True)
    descripcion = models.CharField(max_length=100)
    
class EstadoMovimiento(models.Model):
    estado = models.CharField(max_length=15, unique=True)
class MovimientoStock(models.Model):
    tipo_movimiento = models.ForeignKey(TipoMovimiento, on_delete=models.PROTECT)
    tauser = models.ForeignKey(Tauser, on_delete=models.PROTECT)
    transaccion = models.ForeignKey(Transaccion, null=True, on_delete=models.PROTECT)
    fecha = models.DateTimeField(auto_now_add=True)
    estado = models.ForeignKey(EstadoMovimiento, on_delete=models.PROTECT)

class MovimientoStockDetalle(models.Model):
    cantidad = models.IntegerField()
    movimiento_stock = models.ForeignKey(MovimientoStock, on_delete=models.CASCADE)
    denominacion = models.ForeignKey(Denominacion, on_delete=models.PROTECT)    
    