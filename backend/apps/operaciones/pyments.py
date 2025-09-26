# apps/operaciones/payments.py

from dataclasses import dataclass
from typing import Optional

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
