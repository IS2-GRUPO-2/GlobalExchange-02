import type { Tasa } from "../types/Tasa";
import axios from "axios";

const API_URL = "/api/cotizaciones/";

interface GetTasasParams {
  search?: string;
}

export const getTasas = async (params: GetTasasParams = {}): Promise<Tasa[]> => {
  try {
    const res = await axios.get(API_URL, { params });
    const data = res.data;
    if (Array.isArray(data)) return data as Tasa[];
    if (data && Array.isArray(data.results)) return data.results as Tasa[];
    return [];
  } catch (err: any) {
    console.error("Error fetching tasas: ", err?.response?.data || err.message);
    throw err;
  }
};

export const getTasa = async (tasa_id: number): Promise<Tasa> => {
  try {
    const res = await axios.get<Tasa>(`${API_URL}${tasa_id}/`);
    return res.data;
  } catch (err: any) {
    console.error("Error fetching tasa: ", err?.response?.data || err.message);
    throw err;
  }
};

export const createTasa = async (tasaData: Tasa) => {
  try {
    const res = await axios.post<Tasa>(API_URL, tasaData);
    return res;
  } catch (err) {
    console.error("Error creating tasa: ", err);
    throw err;
  }
};

export const updateTasa = async (tasaData: Tasa, tasa_id: number) => {
  try {
    const res = await axios.put<Tasa>(`${API_URL}${tasa_id}/`, tasaData);
    return res;
  } catch (err) {
    console.error("Error updating tasa: ", err);
    throw err;
  }
};

export const partialUpdateTasa = async (
  tasaData: Partial<Tasa>,
  tasa_id: number
) => {
  try {
    const res = await axios.patch<Tasa>(`${API_URL}${tasa_id}/`, tasaData);
    return res;
  } catch (err) {
    console.error("Error patching tasa: ", err);
    throw err;
  }
};

export const deactivateTasa = async (tasa_id: number) => {
  try {
    const res = await axios.delete(`${API_URL}${tasa_id}/`);
    return res;
  } catch (err) {
    console.error("Error deactivating tasa: ", err);
    throw err;
  }
};

export const getPublicTasas = async (): Promise<any[]> => {
  try {
    const res = await axios.get(`${API_URL}public/`);
    return res.data;
  } catch (err: any) {
    console.error("Error fetching public tasas: ", err?.response?.data || err.message);
    throw err;
  }
};

export type PublicHistoryPoint = {
  fecha: string;
  tasaCompra: string;
  tasaVenta: string;
};

export type PublicHistoryResponse = {
  divisa: { codigo: string; nombre: string };
  base?: { codigo: string; nombre: string; simbolo: string } | null;
  points: PublicHistoryPoint[];
};

export const getPublicHistory = async (params: {
  divisa: string;
  start?: string;
  end?: string;
}): Promise<PublicHistoryResponse> => {
  try {
    const res = await axios.get<PublicHistoryResponse>(`${API_URL}public/history/`, {
      params,
    });
    return res.data;
  } catch (err: any) {
    console.error("Error fetching public history: ", err?.response?.data || err.message);
    throw err;
  }
};
