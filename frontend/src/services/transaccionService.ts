// services/transaccionService.ts
import axios from "axios";
import type { TransaccionRequest, Transaccion } from "../types/Transaccion";

const API_URL = "/api/operaciones/";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: token ? `Bearer ${token}` : "" } };
};

export const crearTransaccion = async (data: TransaccionRequest): Promise<Transaccion> => {
  const response = await axios.post(`${API_URL}crear-transaccion/`, data, getAuthHeaders());
  return response.data;
};

export const reconfirmarTasa = async (id: number) => {
  const response = await axios.get(`${API_URL}transacciones/${id}/reconfirmar-tasa/`, getAuthHeaders());
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

export const confirmarPago = async (
  id: number,
  payload: { terminos_aceptados: boolean; acepta_cambio?: boolean }
): Promise<Transaccion> => {
  const response = await axios.patch(
    `${API_URL}transacciones/${id}/confirmar-pago/`,
    payload,
    getAuthHeaders()
  );
  return response.data;
};

export const cancelarTransaccion = async (id: number): Promise<Transaccion> => {
  const response = await axios.patch(
    `${API_URL}transacciones/${id}/cancelar/`,
    {},
    getAuthHeaders()
  );
  return response.data;
};

// Función para simular una operación completa (simulación + tauser)
export const simularOperacionCompleta = async (
  simulacionData: any,
  tauserId: string
): Promise<OperacionCompleta> => {
  // Reutilizamos la simulación existente
  const { simularOperacionPrivadaConInstancia } = await import('./simulacionService');
  const simulacionResponse = await simularOperacionPrivadaConInstancia(simulacionData);
  
  // Obtenemos información del tauser
  const { getTauserById } = await import('./tauserService');
  const tauserResponse = await getTauserById(tauserId);
  
  return {
    ...simulacionResponse,
    tauser_seleccionado: tauserResponse.data
  };
};