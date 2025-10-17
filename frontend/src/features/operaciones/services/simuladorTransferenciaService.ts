export interface SimuladorTransferenciaPayload {
  transaccionId: string;
  monto: number;
  destinoNombre: string;
}

export interface SimuladorTransferenciaComprobante {
  transaccion_id: string;
  fecha: string;
  cliente?: string | null;
  cuenta_origen: string;
  cuenta_destino: string;
  monto_enviado: string;
  divisa?: string | null;
  tasa_utilizada?: string | null;
  monto_destino_estimado?: string | null;
  operacion?: string | null;
  referencia: string;
}

export type SimuladorTransferenciaResult =
  | {
      kind: "aprobada";
      comprobante: SimuladorTransferenciaComprobante;
      raw: Record<string, unknown>;
    }
  | {
      kind: "rechazada";
      motivo: string;
      mensaje: string;
      detalles: Record<string, unknown>;
    };



export const simularTransferenciaBancaria = async (
  payload: SimuladorTransferenciaPayload
): Promise<SimuladorTransferenciaResult> => {
  const baseUrl = "/simulador-pagos";
  const response = await fetch(`${baseUrl}/pagar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id_transaccion: payload.transaccionId,
      nombre: payload.destinoNombre,
      monto: payload.monto,
    }),
    mode: "cors",
    credentials: "omit",
  });

  let payloadJson: any = null;
  try {
    payloadJson = await response.json();
  } catch (error) {
    if (response.ok) {
      throw error instanceof Error ? error : new Error("Respuesta inválida del simulador de transferencias.");
    }
  }

  if (response.ok) {
    const comprobante = (payloadJson?.comprobante ?? {}) as Record<string, unknown>;
    return {
      kind: "aprobada",
      comprobante: {
        transaccion_id: String(comprobante.transaccion_id ?? payload.transaccionId),
        fecha: String(comprobante.fecha ?? ""),
        cliente: (comprobante.cliente as string | undefined) ?? null,
        cuenta_origen: String(comprobante.cuenta_origen ?? payload.destinoNombre),
        cuenta_destino: String(comprobante.cuenta_destino ?? "GlobalExchange"),
        monto_enviado: String(comprobante.monto_enviado ?? payload.monto),
        divisa: (comprobante.divisa as string | undefined) ?? null,
        tasa_utilizada: (comprobante.tasa_utilizada as string | undefined) ?? null,
        monto_destino_estimado: (comprobante.monto_destino_estimado as string | undefined) ?? null,
        operacion: (comprobante.operacion as string | undefined) ?? null,
        referencia: String(comprobante.referencia ?? ""),
      },
      raw: payloadJson ?? {},
    };
  }

  if (payloadJson && typeof payloadJson === "object") {
    return {
      kind: "rechazada",
      motivo: String(payloadJson.motivo ?? "DESCONOCIDO"),
      mensaje: String(payloadJson.mensaje ?? "La transacción fue rechazada por el simulador."),
      detalles: payloadJson as Record<string, unknown>,
    };
  }

  throw new Error("No se pudo simular la transferencia bancaria.");
};
