import axios from "axios";
import { type Categoria } from "../types/Cliente";

// Usamos rutas relativas para que las peticiones pasen por el proxy de Nginx
const API_URL = "/api/clientes/categorias/";

// 👇 función auxiliar para obtener headers con token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token"); // el mismo que guardas en login
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

export const getCategoriaClientes = (search: string) =>
  axios.get<Categoria[]>(API_URL + `?search=${search}`, getAuthHeaders());

export const getCategoriaCliente = (id: string) =>
  axios.get<Categoria>(`${API_URL}${id}/`, getAuthHeaders());

export const updateCategoriaCliente = (id: string, data: Partial<Categoria>) =>
  axios.patch<Categoria>(`${API_URL}${id}/`, data, getAuthHeaders());