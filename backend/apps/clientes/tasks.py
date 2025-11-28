from celery import shared_task

from .models import Cliente
import logging

logger = logging.getLogger(__name__)

@shared_task
def resetear_limite_diario():
    logger.info("Iniciando reinicio de límites diarios...")

    total_actualizados = Cliente.objects.update(gasto_diario=0)

    logger.info(f"Se reiniciaron los límites diarios de {total_actualizados} clientes")


    return total_actualizados


@shared_task
def resetear_limite_mensual():
    logger.info("Iniciando reinicio de límites mensuales...")

    total_actualizados = Cliente.objects.update(gasto_mensual=0)

    logger.info(f"Se reiniciaron los límites mensuales de {total_actualizados} clientes")    

    return total_actualizados