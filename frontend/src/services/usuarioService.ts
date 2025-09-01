import axios from "axios";
import { type User } from "../types/User";
import { type Cliente } from "../types/Cliente";

// Usamos rutas relativas para que las peticiones pasen por el proxy de Nginx
const API_URL = "/api/usuarios/";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token"); // el mismo que guardas en login
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

export const getUsuarios = () => axios.get<User[]>(API_URL, getAuthHeaders());

export const getUsuario = (id: string, headers = getAuthHeaders()) =>
  axios.get<User>(`${API_URL}${id}/`, headers);

// export const createUsuario = (data: Partial<User>) =>
//   axios.post<User>(API_URL, data, getAuthHeaders());

export const createUsuario = async (data: Partial<User>) => {
  try {
    
    const res = await axios.post<User>(API_URL, data, getAuthHeaders());
    return res.data;
  } catch (err: any) {
    console.error("Error al crear usuario:", err.response?.data, data);
    throw err;
  }
};

export const updateUsuario = (id: string, data: Partial<User>) =>
  axios.patch<User>(`${API_URL}${id}/`, data, getAuthHeaders());

export const deleteUsuario = (id: string) =>
  axios.delete(`${API_URL}${id}/`, getAuthHeaders());

export const asignarClientesAUsuario = (id: number, clientesIds: string[]) =>
  axios.post(
    `${API_URL}${id}/asignar_clientes/`,
    { clientes: clientesIds },
    getAuthHeaders()
  );
  
export const getUserClients = (userId: number) =>
  axios.get<Cliente[]>(
    `${API_URL}${userId}/get_clientes_asignados/`,
    getAuthHeaders()
  );

export const getUserRoles = (userId: number) =>
  axios.get<{id: number; name: string}[]>(`${API_URL}${userId}/roles/`, getAuthHeaders());

export const assignUserRoles = (userId: number, roleIds: number[]) =>
  axios.post(`${API_URL}${userId}/asignar_roles/`, { roles: roleIds }, getAuthHeaders());