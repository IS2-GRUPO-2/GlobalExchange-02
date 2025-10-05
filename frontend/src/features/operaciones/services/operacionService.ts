import axios from "axios";
import { 
  type OperacionRequest, 
  type CalcularOperacionResponse, 
} from "../types/Operacion";

const API_URL = "/api/operaciones/";

// Para el endpoint privado (usuarios autenticados)
export const operacionPrivada = async (
  data: OperacionRequest
): Promise<CalcularOperacionResponse> => {
  const url = API_URL + "operacion_privada/";
  const response = await axios.post(url, data);
  return response.data;
};


// Para el endpoint publico (landing page)
export const operacionPublica = async (
  data: OperacionRequest
): Promise<CalcularOperacionResponse> => {
  const url = API_URL + "operacion_publica/";
  const response = await axios.post(url, data);
  return response.data;
};

export const getOpPerspectivaCasa = async (
  divisa_origen: number,
  divisa_destino: number
): Promise<{ op_perspectiva_casa: "compra" | "venta" }> => {
  try {
    const res = await axios.get<{ op_perspectiva_casa: "compra" | "venta" }>(
      `${API_URL}op_perspectiva_casa/`,
      { params: { divisa_origen, divisa_destino } }
    );
    return res.data;
  } catch (err: any) {
    // Si el backend devolvió un error con mensaje
    if (err.response?.data?.error) {
      throw new Error(err.response.data.error);
    }
    throw new Error("Error al obtener la operación desde la perspectiva de la casa.");
  }
};



