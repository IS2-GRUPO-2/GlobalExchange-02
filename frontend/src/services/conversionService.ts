import axios from "axios";
import { type SimulacionRequest, type SimulacionResponse, type MetodosDisponiblesResponse } from "../types/Conversion";

const API_URL = "http://localhost:8000/api/conversiones/";

export const simularConversion = async (
  data: SimulacionRequest
): Promise<SimulacionResponse> => {
  const url = API_URL + "simular/";
  const response = await axios.post(url, data);
  return response.data;
};

export const simularConversionPublica = async (
  data: Omit<SimulacionRequest, "cliente_id">
): Promise<SimulacionResponse> => {
  const url = API_URL + "simular-publica/";
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
