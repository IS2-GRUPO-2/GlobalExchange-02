# apps/operaciones/payments.py

from dataclasses import dataclass
from typing import Optional
from globalexchange.configuration import config
import stripe
from apps.operaciones.models import Transaccion
from django.db import transaction
from apps.metodos_financieros.models import Tarjeta, MetodoFinancieroDetalle, MetodoFinanciero
from apps.clientes.models import Cliente
from apps.pagos.models import Pagos

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
    
    pago_id = checkout_session['metadata'].get('pago_id')
    if not pago_id:
        print("No se encontró pago_id en metadata")
        return

    with transaction.atomic():
        try:
            transaccion = Transaccion.objects.select_for_update().get(id=transaccion_id)
            pago = Pagos.objects.select_for_update().get(id=pago_id)
        except Transaccion.DoesNotExist:
            print("La transacción no existe en la base de datos")
            return
        except Pagos.DoesNotExist:
            print("El pago no existe en la base de datos")
            return    


        if transaccion.stripe_session_id == session_id or transaccion.estado != "pendiente":
            print("Esta sesión ya fue procesada previamente")
            return
        
        # Actualizar información
        transaccion.stripe_session_id = session_id
        transaccion.estado = "en_proceso"
        print("Actualizando informacion de transaccion")
        transaccion.save()

        pago.estado = "APROBADO"
        pago.response = "checkout.session.completed"
        pago.save()

    print(f"Transacción {transaccion_id} completada con éxito (Stripe Session {session_id})")    

def guardar_tarjeta_stripe(payment_method_id):
    payment_method = stripe.PaymentMethod.retrieve(payment_method_id, expand=["card"])

    cliente = Cliente.objects.get(stripe_customer_id=payment_method.customer)

    if payment_method.card is None:
        print("El metodo no es una tarjeta")
        return
    
    with transaction.atomic():
        metodo_financiero = MetodoFinanciero.objects.get(nombre="STRIPE")

        metodo_financiero_detalle, _ = MetodoFinancieroDetalle.objects.get_or_create(
            alias="Mi " + payment_method["card"]["brand"],
            cliente=cliente,
            metodo_financiero=metodo_financiero
        )

        metodo_financiero_detalle.save()

        tarjeta, _ = Tarjeta.objects.get_or_create(
            tipo="STRIPE",
            payment_method_id=payment_method_id,
            brand=payment_method["card"]["brand"],
            last4=payment_method["card"]["last4"],
            exp_month=payment_method["card"]["exp_month"],
            exp_year=payment_method["card"]["exp_year"],
            titular=cliente.nombre,
            metodo_financiero_detalle=metodo_financiero_detalle,
            funding=payment_method["card"]["funding"],
            stripe_customer_id=cliente.stripe_customer_id
        )

        tarjeta.save()