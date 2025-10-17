import os
from datetime import datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any, Dict

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field


app = FastAPI(title="Simulador de Pagos")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

BACKEND_BASE_URL = "http://backend:8000/"
RECONFIRM_ENDPOINT_TEMPLATE = "/api/operaciones/transacciones/{transaccion_id}/reconfirmar-tasa-simulador-pago/"


class PagoIn(BaseModel):
    id_transaccion: str = Field(..., min_length=1)
    nombre: str = Field(..., min_length=1)
    monto: float


def _obtener_snapshot_transaccion(transaccion_id: str) -> Dict[str, Any]:
    url = f"{BACKEND_BASE_URL}{RECONFIRM_ENDPOINT_TEMPLATE.format(transaccion_id=transaccion_id)}"
    try:
        response = requests.get(url, timeout=5)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"No se pudo contactar al backend: {exc}") from exc

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Backend devolvió un estado inesperado ({response.status_code}) al verificar la transacción.",
        )

    try:
        return response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="Respuesta inválida del backend.") from exc


def _to_decimal(value: Any) -> Decimal:
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError) as exc:
        raise HTTPException(status_code=400, detail="Monto inválido.") from exc


def _formatear_decimal(valor: Decimal) -> str:
    return str(valor.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


@app.post("/pagar")
def pagar(pago: PagoIn):
    snapshot = _obtener_snapshot_transaccion(pago.id_transaccion)

    transaccion_info = snapshot.get("transaccion", {})
    monto_esperado = _to_decimal(transaccion_info.get("monto_origen"))
    monto_recibido = _to_decimal(pago.monto)

    monto_esperado_q = monto_esperado.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    monto_recibido_q = monto_recibido.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    if monto_recibido_q != monto_esperado_q:
        return JSONResponse(
            status_code=400,
            content={
                "status": "rechazada",
                "motivo": "MONTO_INCORRECTO",
                "mensaje": "El monto enviado no coincide con el monto esperado para la transacción.",
                "monto_correcto": _formatear_decimal(monto_esperado_q),
            },
        )

    if snapshot.get("cambio"):
        return JSONResponse(
            status_code=409,
            content={
                "status": "rechazada",
                "motivo": "TASA_VARIADA",
                "mensaje": "La tasa de cambio varió. Debes reconfirmar la transacción con la nueva cotización.",
                "tasa_anterior": snapshot.get("tasa_anterior"),
                "tasa_actual": snapshot.get("tasa_actual"),
                "delta_tc": snapshot.get("delta_tc"),
                "delta_pct": snapshot.get("delta_pct"),
            },
        )

    fecha = datetime.utcnow()
    comprobante = {
        "transaccion_id": pago.id_transaccion,
        "fecha": fecha.isoformat() + "Z",
        "cliente": transaccion_info.get("cliente_nombre"),
        "cuenta_origen": pago.nombre,
        "cuenta_destino": "GlobalExchange",
        "monto_enviado": _formatear_decimal(monto_recibido_q),
        "divisa": transaccion_info.get("divisa_origen"),
        "tasa_utilizada": snapshot.get("tasa_actual"),
        "monto_destino_estimado": snapshot.get("monto_destino_actual"),
        "operacion": transaccion_info.get("operacion"),
        "referencia": f"SIM-{pago.id_transaccion}-{fecha.strftime('%H%M%S')}",
    }

    return {
        "status": "aprobada",
        "comprobante": comprobante,
    }
