import axios from "axios";
import { type CategoriaCliente } from "../types/Cliente";

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
  axios.get<CategoriaCliente[]>(API_URL + `?search=${search}`, getAuthHeaders());

export const getCategoriaCliente = (id: string) =>
  axios.get<CategoriaCliente>(`${API_URL}${id}/`, getAuthHeaders());

export const updateCategoriaCliente = (id: string, data: Partial<CategoriaCliente>) =>
  axios.patch<CategoriaCliente>(`${API_URL}${id}/`, data, getAuthHeaders());