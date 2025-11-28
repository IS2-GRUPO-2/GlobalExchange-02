from celery import shared_task
from .models import Transaccion
import logging

logger = logging.getLogger(__name__)

@shared_task
def expire_transaction_task(transaction_id):
    try:
        transaccion = Transaccion.objects.get(id=transaction_id)

        if transaccion.estado == "pendiente":
            transaccion.estado = "cancelada"
            transaccion.save()
            logger.info(f"Transacción {transaction_id} expiró, cancelada automáticamente.")
        else:
            logger.info(f"Transacción {transaction_id} ya fue pagada o ya se canceló.")
    except Transaccion.DoesNotExist:
        logger.warning(f"La transacción {transaction_id} no existe.")