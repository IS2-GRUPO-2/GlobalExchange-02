import axios from "axios";
import type { TransaccionRequest, Transaccion, OperacionCompleta } from "../types/Transaccion";

const API_URL = "/api/operaciones/";

// Headers con token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

export const crearTransaccion = async (
  data: TransaccionRequest
): Promise<Transaccion> => {
  const response = await axios.post(`${API_URL}crear-transaccion/`, data, getAuthHeaders());
  return response.data;
};

export const getTransacciones = async (params?: any) => {
  const response = await axios.get<{ results: Transaccion[] }>(
    `${API_URL}transacciones/`, 
    { params, ...getAuthHeaders() }
  );
  return response.data;
};

export const getTransaccionById = async (id: number): Promise<Transaccion> => {
  const response = await axios.get(`${API_URL}transacciones/${id}/`, getAuthHeaders());
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