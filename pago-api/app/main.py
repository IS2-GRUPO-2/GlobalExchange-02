from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Simulador de  Pagos")


class PagoIn(BaseModel):
    id_transaccion: str
    nombre: str
    monto: float


@app.post("/pagar")
def pagar(pago: PagoIn):
    return {
        "status": "ok",
        "id_transaccion": pago.id_transaccion,
        "nombre_destino": pago.nombre,
        "monto_pagado": pago.monto,
    }
