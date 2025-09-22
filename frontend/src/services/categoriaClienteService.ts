import axios from "axios";
import { type CategoriaCliente } from "../types/Cliente";

// Usamos rutas relativas para que las peticiones pasen por el proxy de Nginx
const API_URL = "/api/categorias/";

// 👇 función auxiliar para obtener headers con token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token"); // el mismo que guardas en login
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

// 👇 Interfaz para los parámetros de consulta
interface GetCategoriasParams {
  all?: boolean;
  search?: string;
}

// 👇 Función principal actualizada con parámetros opcionales
export const getCategoriaClientes = (params?: GetCategoriasParams) => {
  // Construir los query parameters
  const searchParams = new URLSearchParams();
  
  if (params?.all) {
    searchParams.append('all', 'true');
  }
  
  if (params?.search) {
    searchParams.append('search', params.search);
  }
  
  // Construir la URL final
  const url = searchParams.toString() 
    ? `${API_URL}?${searchParams.toString()}`
    : API_URL;
    
  return axios.get<CategoriaCliente[]>(url, getAuthHeaders());
};

// 👇 Funciones específicas para casos de uso comunes
export const getAllCategoriaClientes = () => 
  getCategoriaClientes({ all: true });

export const getActiveCategoriaClientes = () => 
  getCategoriaClientes(); // Por defecto trae solo las activas

export const searchCategoriaClientes = (searchTerm: string, includeInactive = false) =>
  getCategoriaClientes({ 
    search: searchTerm, 
    all: includeInactive 
  });

// 👇 Mantener las funciones existentes
export const getCategoriaCliente = (id: string) =>
  axios.get<CategoriaCliente>(`${API_URL}${id}/`, getAuthHeaders());

export const updateCategoriaCliente = (id: string, data: Partial<CategoriaCliente>) =>
  axios.patch<CategoriaCliente>(`${API_URL}${id}/`, data, getAuthHeaders());

// 👇 Funciones adicionales que podrías necesitar
export const createCategoriaCliente = (data: Omit<CategoriaCliente, 'idCategoria'>) =>
  axios.post<CategoriaCliente>(API_URL, data, getAuthHeaders());

export const deleteCategoriaCliente = (id: string) =>
  axios.delete(`${API_URL}${id}/`, getAuthHeaders());