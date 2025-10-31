import axios from "axios";
import type { Tauser } from "../types/Tauser";

const API_URL = "/api/tauser/";

export const getTausers = async (params: Record<string, unknown> = {}) => {
  const res = await axios.get<Tauser[]>(API_URL, { params });
  return res.data;
};

export const getTausersConStock = async (divisa_id: number, monto: number) => {
  const params: any = { divisa_id , monto};
  const res = await axios.get<Tauser[]>(`${API_URL}con-stock/`, { params });
  return res.data;
};

export const getTauserById = (id: string) =>
  axios.get<Tauser>(`${API_URL}${id}/`);

export const createTauser = (data: Partial<Tauser>) =>
  axios.post<Tauser>(API_URL, data);

export const updateTauser = (id: string, data: Partial<Tauser>) =>
  axios.patch<Tauser>(`${API_URL}${id}/`, data);

export const deleteTauser = (id: string) =>
  axios.delete(`${API_URL}${id}/`);
