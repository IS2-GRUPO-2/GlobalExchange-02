from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from apps.facturacion.factura_service import cargar_datos_factura, calcular_factura, generar_factura
from .models import Transaccion
from apps.facturacion.models import Factura, FacturaSettings
import json
import logging
from apps.stock.serializers import MovimientoStockSerializer
from apps.stock.models import MovimientoStock
from apps.stock.enums import TipoMovimiento, EstadoMovimiento

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Transaccion)
def manejar_transaccion_post_save(sender, instance, created, **kwargs):
    procesar_cambios_transaccion(instance, created)

def procesar_cambios_transaccion(transaccion: Transaccion, created):
    
    if transaccion.estado in ["en_proceso", "completada"]:
        generar_factura_al_pagar(transaccion)

    if created and transaccion.operacion == "venta":
        reservar_stock_divisa(instance=transaccion, created=created)

    if transaccion.operacion == "venta" and transaccion.estado == "completada":
        finalizar_movimiento_stock(transaccion)

    if not created and transaccion.estado in ["cancelada", "fallida"]:
        cancelar_reserva_stock(transaccion)  

def generar_factura_al_pagar(instance: Transaccion):
    """
        Genera y envía una factura cuando una transacción es pagada
    """
    logger.info(f"Generando factura para transaccion con id {instance.pk}")
    try:
        if instance.estado not in ["en_proceso", "completada"] or instance.factura_emitida:
            logger.error(f"Transacción con id {instance.pk} ya fue facturada o no puede ser facturada")
            return
            
        # No generar factura aquí si el método de pago es STRIPE
        if instance.metodo_financiero and instance.metodo_financiero.nombre == "STRIPE":
            logger.info(f"La factura para la transacción {instance.pk} se generará cuando se complete el pago en Stripe")
            return

        datos_factura = cargar_datos_factura(instance.pk)
        resultado = calcular_factura(datos_factura)

        if resultado.get('code') != 0 or not resultado.get('results'):
            logger.error(f"Ocurrió algún error calculando factura para transacción {instance.pk}")
            return

        factura_calculada = resultado['results'][0].get('DE')

        if not factura_calculada:
            logger.error(f"Ocurrió algún error calculando factura para transacción {instance.pk}")
            return
        
        cdc = generar_factura(factura_calculada)
        
        instance.factura_emitida = True
        instance.save()
        factura = Factura.objects.create(transaccion=instance, cdc=cdc)
        factura.save()

        settings = FacturaSettings.get_solo()
        settings.ultimo_num += 1
        settings.save()

    except ValidationError as e:
        logger.error(f"Error validando datos de factura: {e}")
    except Exception as e:
        logger.error(f"Error inesperado generando factura: {e}")

def reservar_stock_divisa(instance, created):
    if instance.estado not in ["en_proceso", "pendiente"] or instance.operacion == "compra":
        logger.warning("No se puede reservar stock para la transaccion con id " + instance.pk)
        return

    logger.info(f"Reservando stock para la transaccion con id {instance.pk}")

    tipo_movimiento = TipoMovimiento.SALCLT
    monto = instance.monto_destino
    divisa = instance.divisa_destino
    
    data = {
        "tipo_movimiento": tipo_movimiento,
        "tauser": instance.tauser.pk,
        "transaccion": instance.pk,
        "monto": monto,
        "divisa": divisa.pk
    }

    serializer = MovimientoStockSerializer(data=data)
    try:
        serializer.is_valid(raise_exception=True)
    except ValidationError:
        logger.error(f"No se puede reservar stock para transacción {instance.pk}, datos inválidos: {data}")
    serializer.save()

def cancelar_reserva_stock(transaccion: Transaccion):
    try:
        movimiento = MovimientoStock.objects.get(transaccion=transaccion)
    except MovimientoStock.DoesNotExist:
        logger.warning("No se puede cancelar reserva de stock para la transaccion con id" + transaccion.pk)
        return

    logger.info(f"Cancelando movimiento de stock debido a transacción {transaccion.pk} cancelada")
    movimiento.estado = EstadoMovimiento.CANCELADO

    movimiento.save()

def finalizar_movimiento_stock(transaccion: Transaccion):
    try:
        movimiento = MovimientoStock.objects.get(transaccion=transaccion)
    except MovimientoStock.DoesNotExist:
        logger.warning("No se puede finalizar reserva de stock para la transaccion con id" + transaccion.pk)
        return

    logger.info(f"Cancelando movimiento de stock debido a transacción {transaccion.pk} cancelada")
    movimiento.estado = EstadoMovimiento.FINALIZADO

    movimiento.save()