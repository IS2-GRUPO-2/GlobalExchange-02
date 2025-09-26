import axios from "axios";
import { 
  type OperacionRealRequest,
  type OperacionRealResponse,
  type TransaccionCreateRequest,
  type TransaccionResponse
} from "../types/OperacionReal";

const API_URL = "/api/operaciones/";

export const simularOperacionReal = async (
  data: OperacionRealRequest
): Promise<OperacionRealResponse> => {
  const url = API_URL + "simular_operacion_real/";
  const response = await axios.post(url, data);
  return response.data;
};

export const crearTransaccion = async (
  data: TransaccionCreateRequest
): Promise<TransaccionResponse> => {
  const url = API_URL + "crear_transaccion/";
  const response = await axios.post(url, data);
  return response.data;
};

export const obtenerTransacciones = async () => {
  const url = API_URL + "transacciones/";
  const response = await axios.get(url);
  return response.data;
};