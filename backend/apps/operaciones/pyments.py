# apps/operaciones/payments.py

from dataclasses import dataclass
from typing import Optional
from globalexchange.configuration import config
import stripe
from apps.operaciones.models import Transaccion
from apps.clientes.models import Cliente
from django.db import transaction
from django.db.models import F
stripe.api_key = config.STRIPE_KEY

# Códigos normalizados del “procesador”
APROBADO = 1200
FONDOS_INSUFICIENTES = 1400

# Tabla de mensajes de respuesta
CODE_MESSAGES: dict[int, str] = {
    APROBADO: "Aprobado",
    FONDOS_INSUFICIENTES: "Fondo Insuficiente",
}

def code_message(code: int) -> str:
    return CODE_MESSAGES.get(code, "Desconocido")

@dataclass
class PagoResult:
    codigo: int
    mensaje: str
    referencia: Optional[str] = None

def componenteSimuladorPagosCobros(transaccion, *, force_code: Optional[int] = None) -> PagoResult:
    """
    Simulador “dummy” de pasarela de pagos/cobros.
    - Por defecto SIEMPRE aprueba (código 1200).
    - Si querés testear otros casos, pasá force_code=FONDOS_INSUFICIENTES, etc.
    """
    codigo = force_code if force_code is not None else APROBADO
    return PagoResult(
        codigo=codigo,
        mensaje=code_message(codigo),
        referencia=f"SIM-{transaccion.id}",
    )

def completar_pago_stripe(session_id):
    checkout_session = stripe.checkout.Session.retrieve(
        session_id,
        expand=['line_items'],
    )
    print("Completar pago stripe llamado, webhook se supone que funciona")

    if checkout_session.payment_status != 'paid':
        print("Pago no confirmado aún")
        return

    transaccion_id = checkout_session['metadata'].get('transaccion_id')
    if not transaccion_id:
        print("No se encontró transaccion_id en metadata")
        return
    
    with transaction.atomic():
        try:
            transaccion = Transaccion.objects.select_for_update().select_related('cliente').get(id=transaccion_id)
        except Transaccion.DoesNotExist:
            print("La transacción no existe en la base de datos")
            return
        
        if transaccion.stripe_session_id == session_id or transaccion.estado != "pendiente":
            print("Esta sesión ya fue procesada previamente")
            return
        
        # Actualizar información
        transaccion.stripe_session_id = session_id
        transaccion.estado = "en_proceso"
        print("Actualizando informacion de transaccion")
        transaccion.save()
        cliente = transaccion.cliente
        
        monto = transaccion.monto_origen
        
        # Actualización segura en SQL usando F()
        Cliente.objects.filter(pk=cliente.pk).update(
            gasto_diario=F('gasto_diario') + monto,
            gasto_mensual=F('gasto_mensual') + monto
        )

        cliente.refresh_from_db(fields=["gasto_diario", "gasto_mensual"])

    print(f"Transacción {transaccion_id} completada con éxito (Stripe Session {session_id})")    