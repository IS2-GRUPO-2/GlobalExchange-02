from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from apps.facturacion.factura_service import cargar_datos_factura, calcular_factura, generar_factura
from .models import Transaccion
from apps.facturacion.models import Factura, FacturaSettings
import json
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Transaccion)
def generar_factura_al_pagar(sender, instance: Transaccion, **kwargs):
    """
        Genera y envía una factura cuando una transacción es pagada
    """
    logger.info(f"Generando factura para transaccion con id {instance.pk}")
    try:
        if instance.estado != "en_proceso" or instance.factura_emitida:
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
