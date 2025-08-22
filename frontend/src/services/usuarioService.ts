import axios from "axios";
import { type Usuario} from "../types/Cliente";

const API_URL = "http://localhost:8000/api/usuarios/";

const getAuthHeaders = () => {
  const token = localStorage.getItem("access"); // el mismo que guardas en login
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

export const getUsuarios = () =>
  axios.get<Usuario[]>(API_URL, getAuthHeaders());

export const getUsuario = (id: string) =>
  axios.get<Usuario>(`${API_URL}${id}/`, getAuthHeaders());

export const createUsuario = (data: Partial<Usuario>) =>
  axios.post<Usuario>(API_URL, data, getAuthHeaders());

export const updateUsuario = (id: string, data: Partial<Usuario>) =>
  axios.put<Usuario>(`${API_URL}${id}/`, data, getAuthHeaders());

export const deleteUsuario = (id: string) =>
  axios.delete(`${API_URL}${id}/`, getAuthHeaders());
