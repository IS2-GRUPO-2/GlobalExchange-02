import axios from "axios";
import { type SimulacionRequest, type SimulacionResponse } from "../types/Conversion";
import { type MetodoFinanciero, type PaginatedMetodoFinanciero } from "../types/MetodoFinanciero";


const API_URL = "http://localhost:8000/api/conversiones/";

export const simularConversion = async (
  data: SimulacionRequest
): Promise<SimulacionResponse> => {
  const url = API_URL + "simular/";
  console.log("URL utilizada para simulación:", url, "Payload:", data);
  const response = await axios.post(API_URL + "simular/", data);
  return response.data;
};

export const getMetodosDisponibles = async (
  operacion: "compra" | "venta"
): Promise<MetodoFinanciero[]> => {
  const res = await axios.get<MetodoFinanciero[]>(`${API_URL}metodos-disponibles/`, {
    params: { operacion },
  });
  return res.data;
};
