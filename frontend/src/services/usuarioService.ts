import axios from "axios";
import { type User } from "../types/User";

const API_URL = "http://localhost:8000/api/usuarios/";

const getAuthHeaders = () => {
  const token = localStorage.getItem("access"); // el mismo que guardas en login
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

export const getUsuarios = () => axios.get<User[]>(API_URL, getAuthHeaders());

export const getUsuario = (id: string, headers = getAuthHeaders()) =>
  axios.get<User>(`${API_URL}${id}/`, headers);

export const createUsuario = (data: Partial<User>) =>
  axios.post<User>(API_URL, data, getAuthHeaders());

export const updateUsuario = (id: string, data: Partial<User>) =>
  axios.put<User>(`${API_URL}${id}/`, data, getAuthHeaders());

export const deleteUsuario = (id: string) =>
  axios.delete(`${API_URL}${id}/`, getAuthHeaders());
