// services/transaccionService.ts
import axios from "axios";
import type {
  Transaccion,
  TransaccionRequest,
  TransaccionDetalle,
} from "../types/Transaccion";

const API_URL = "/api/operaciones/";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: token ? `Bearer ${token}` : "" } };
};

export const crearTransaccion = async (
  data: TransaccionRequest
): Promise<Transaccion> => {
  try {
    const response = await axios.post(
      `${API_URL}transacciones/`,
      data,
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        error.response.data.detail || "Error al crear la transacción"
      );
    } else {
      throw new Error("Error de red o del servidor");
    }
  }
};

export const reconfirmarTasa = async (id: number) => {
  const response = await axios.get(
    `${API_URL}transacciones/${id}/reconfirmar-tasa/`,
    getAuthHeaders()
  );
  return response.data as {
    cambio: boolean;
    tasa_anterior: string;
    tasa_actual: string;
    delta_tc: string;
    delta_pct: string;
    monto_destino_anterior: string;
    monto_destino_actual: string;
  };
};

export const actualizarTransaccion = async (
  id: number,
  payload: {
    tasa_actual?: number;
    monto_destino_actual?: number;
    monto_origen?: number;
  }
): Promise<Transaccion> => {
  const response = await axios.patch(
    `${API_URL}transacciones/${id}/actualizar-reconfirmacion/`,
    payload,
    getAuthHeaders()
  );
  return response.data;
};

export const confirmarPago = async (
  id: number,
  payload: { terminos_aceptados: boolean; acepta_cambio?: boolean }
): Promise<TransaccionDetalle> => {
  const response = await axios.patch(
    `${API_URL}transacciones/${id}/confirmar-pago/`,
    payload,
    getAuthHeaders()
  );
  return response.data;
};

export const cancelarTransaccion = async (
  id: number
): Promise<TransaccionDetalle> => {
  const response = await axios.patch(
    `${API_URL}transacciones/${id}/cancelar/`,
    {},
    getAuthHeaders()
  );
  return response.data;
};

export const stripeCheckout = async (
  id: number,
  payload: {
    terminos_aceptados: boolean;
    acepta_cambio?: boolean;
  }
) => {
  const res = await axios.post(
    `${API_URL}transacciones/${id}/crear_checkout_stripe/`,
    payload
  );
  console.log(res);
  return res.data;
};
