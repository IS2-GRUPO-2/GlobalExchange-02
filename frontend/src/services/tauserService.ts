import axios from "axios";
import type { Tauser } from "../types/Tauser";

const API_URL = "/api/tauser/";

// Headers con token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

export const getTausers = async (params?: any) => {
  const res = await axios.get<Tauser[]>(API_URL, { params, ...getAuthHeaders() });
  return res.data; // Axios ya devuelve la data en res.data
};

export const getTauserById = (id: string) =>
  axios.get<Tauser>(`${API_URL}${id}/`, getAuthHeaders());

export const createTauser = (data: Partial<Tauser>) =>
  axios.post<Tauser>(API_URL, data, getAuthHeaders());

export const updateTauser = (id: string, data: Partial<Tauser>) =>
  axios.patch<Tauser>(`${API_URL}${id}/`, data, getAuthHeaders());

export const deleteTauser = (id: string) =>
  axios.delete(`${API_URL}${id}/`, getAuthHeaders());