import axios from "axios";
import type { PaginatedCliente, Cliente } from "../types/Cliente";
import { type User } from "../../../types/User";

// Usamos rutas relativas para que las peticiones pasen por el proxy de Nginx
const API_URL = "/api/clientes/";

interface GetParams {
  search: string;
  page: number;
}


export const getClientes = async (params: GetParams) => {
  try {
    const res = await axios.get<PaginatedCliente>(`${API_URL}`, { params });
    return res.data;
  } catch (err) {
    console.error("Error en get clientes");
    throw err;
  }
};
export const getCliente = (id: string) =>
  axios.get<Cliente>(`${API_URL}${id}/`);

export const createCliente = (data: Partial<Cliente>) =>
  axios.post<Cliente>(API_URL, data);

export const updateCliente = (id: string, data: Partial<Cliente>) =>
  axios.patch<Cliente>(`${API_URL}${id}/`, data);

export const deleteCliente = (id: string) =>
  axios.delete(`${API_URL}${id}/`);

export const getUsuariosAsignados = async (id_cliente: string) => {
  const res = await axios.get<User[]>(
    `${API_URL}${id_cliente}/get_usuarios_asignados/`
  );
  return res;
};

export const getCategoriaCliente = async (id_cliente: string) => {
  const res = await axios.get(`${API_URL}${id_cliente}/categoria_cliente/`);
  return res;
};
