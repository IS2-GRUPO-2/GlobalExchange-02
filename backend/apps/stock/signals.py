from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.stock.serializers import MovimientoStockSerializer
from apps.stock.models import MovimientoStock
from apps.stock.enums import TipoMovimiento, EstadoMovimiento
import logging
from django.db import transaction

logger = logging.getLogger(__name__)

@receiver(post_save, sender=MovimientoStock)
def manejar_movimientostock_post_save(sender, instance, created, **kwargs):
    procesar_cambios_movimientostock(instance, created)

def procesar_cambios_movimientostock(movimiento: MovimientoStock, created: bool):
    if movimiento.estado == EstadoMovimiento.CANCELADO:
        cancelar_movimientostock(movimiento)


@transaction.atomic
def cancelar_movimientostock(movimiento: MovimientoStock):
    from apps.stock.models import MovimientoStockDetalle, StockDivisaTauser

    detalles = MovimientoStockDetalle.objects.filter(movimiento_stock=movimiento)
    tauser = movimiento.tauser

    for detalle in detalles:
        try:
            stock_actual = StockDivisaTauser.objects.get(tauser=tauser, denominacion=detalle.denominacion)
        except StockDivisaTauser.DoesNotExist:
            logger.error(
                f"No existe stock para denominación {detalle.denominacion.pk} en el tauser {tauser.id}")
            continue
            
        stock_actual.stock += detalle.cantidad

        stock_actual.save()    