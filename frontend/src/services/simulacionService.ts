import axios from "axios";
import { 
  type SimulacionRequest, 
  type SimulacionResponse, 
  type MetodosDisponiblesResponse,
  type SimulacionRequestConInstancia,
  type MetodosClienteResponse
} from "../types/Simulacion";

const API_URL = "/api/operaciones/";

export const simularOperacionPrivada = async (
  data: SimulacionRequest
): Promise<SimulacionResponse> => {
  const url = API_URL + "simular_privada/";
  const response = await axios.post(url, data);
  return response.data;
};

export const simularOperacionPublica = async (
  data: Omit<SimulacionRequest, "cliente_id">
): Promise<SimulacionResponse> => {
  const url = API_URL + "simular_publica/";
  const response = await axios.post(url, data);
  return response.data;
};


export const simularOperacionPrivadaConInstancia = async (
  data: SimulacionRequestConInstancia
): Promise<SimulacionResponse> => {
  const url = API_URL + "simular_privada_con_instancia/";
  const response = await axios.post(url, data);
  return response.data;
};


export const getMetodosDisponibles = async (
  divisa_origen: number,
  divisa_destino: number
): Promise<MetodosDisponiblesResponse> => {
  try {
    const res = await axios.get<MetodosDisponiblesResponse>(
      `${API_URL}metodos-disponibles/`,
      { params: { divisa_origen, divisa_destino } }
    );
    return res.data;
  } catch (err: any) {
    // Si el backend devolvió un error con mensaje
    if (err.response?.data?.error) {
      throw new Error(err.response.data.error);
    }
    throw new Error("Error al obtener los métodos disponibles.");
  }
};


export const getMetodosCliente = async (
  cliente_id: string,
  divisa_origen: number,
  divisa_destino: number,
  es_operacion_real: boolean = false
): Promise<MetodosClienteResponse> => {
  try {
    const res = await axios.get<MetodosClienteResponse>(
      `${API_URL}metodos-cliente/`,
      { params: { cliente_id, divisa_origen, divisa_destino, es_operacion_real } }
    );
    return res.data;
  } catch (err: any) {
    if (err.response?.data?.error) {
      throw new Error(err.response.data.error);
    }
    throw new Error("Error al obtener los métodos del cliente.");
  }
};
