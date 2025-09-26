import axios from "axios";
import type { 
  TransaccionRequest, 
  Transaccion, 
  OperacionCompleta,
  TransaccionResponse,
  SimulacionOperacionResultado
} from "../types/Transaccion";

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
): Promise<TransaccionResponse> => {
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
  simulacionData: TransaccionRequest,
  tauserId: string
): Promise<OperacionCompleta> => {
  try {
    // Reutilizamos la simulación existente
    const { simularOperacionPrivadaConInstancia } = await import('./simulacionService');
    const simulacionResponse = await simularOperacionPrivadaConInstancia({
      ...simulacionData,
      tauser_id: tauserId
    });
    
    // Obtenemos información del tauser
    const { getTauserById } = await import('./tauserService');
    const tauserResponse = await getTauserById(tauserId);
    
    return {
      ...simulacionResponse,
      tauser_seleccionado: tauserResponse.data
    };
  } catch (error) {
    console.error("Error al simular operación completa:", error);
    throw new Error("No se pudo completar la simulación de la operación");
  }
};

// Verificar si la tasa cambió desde la última simulación
export const verificarCambioTasa = async (
  datosActuales: TransaccionRequest,
  resultadoAnterior: OperacionCompleta
): Promise<SimulacionOperacionResultado> => {
  try {
    // Realizamos una nueva simulación para comparar
    const nuevaSimulacion = await simularOperacionCompleta(
      datosActuales,
      datosActuales.tauser_id
    );
    
    // Comparamos las tasas para ver si hubo cambios
    const tasaCambio = nuevaSimulacion.tc_final !== resultadoAnterior.tc_final;
    
    return {
      tasa_cambio: tasaCambio,
      resultado_anterior: resultadoAnterior,
      resultado_actual: nuevaSimulacion
    };
  } catch (err) {
    console.error("Error al verificar cambios en la tasa", err);
    throw new Error("No se pudo verificar si hay cambios en la tasa");
  }
};

// Simular el procesamiento de pago (éxito o fallo)
export const procesarPago = async (
  transaccionId: string,
  simulacionExitosa: boolean = true
): Promise<{ exito: boolean; mensaje: string }> => {
  try {
    // Esta es una simulación, en producción este endpoint debería conectar con un gateway de pagos real
    const url = API_URL + "procesar_pago/";
    const response = await axios.post(url, {
      transaccion_id: transaccionId,
      simulacion_exitosa: simulacionExitosa
    }, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error("Error al procesar el pago", error);
    const err = error as Error;
    const axiosError = error as { response?: { data?: { error?: string } } };
    if (axiosError.response?.data?.error) {
      throw new Error(axiosError.response.data.error);
    }
    throw new Error(err.message || "Error al procesar el pago");
  }
};