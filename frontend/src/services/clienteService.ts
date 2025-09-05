import axios from "axios";
import { type Cliente } from "../types/Cliente";
import { type User } from "../types/User";

// Usamos rutas relativas para que las peticiones pasen por el proxy de Nginx
const API_URL = "/api/clientes/";

// 👇 función auxiliar para obtener headers con token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token"); // el mismo que guardas en login
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

export const getClientes = (search: string = "") =>
  axios.get<Cliente[]>(API_URL + `?search=${search}`, getAuthHeaders());

export const getCliente = (id: string) =>
  axios.get<Cliente>(`${API_URL}${id}/`, getAuthHeaders());

export const createCliente = (data: Partial<Cliente>) =>
  axios.post<Cliente>(API_URL, data, getAuthHeaders());

export const updateCliente = (id: string, data: Partial<Cliente>) =>
  axios.put<Cliente>(`${API_URL}${id}/`, data, getAuthHeaders());

export const deleteCliente = (id: string) =>
  axios.delete(`${API_URL}${id}/`, getAuthHeaders());

export const getUsuariosAsignados = async (id_cliente: string) => {
  const res = await axios.get<User[]>(
    `${API_URL}${id_cliente}/get_usuarios_asignados/`
  );
  return res;
};
