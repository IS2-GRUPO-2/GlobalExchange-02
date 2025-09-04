import axios from "axios";
import type {
  Banco,
  BilleteraDigitalCatalogo,
  MetodoFinanciero,
  MetodoFinancieroDetalle,
  CuentaBancaria,
  BilleteraDigital,
  Tarjeta,
  PaginatedBanco,
  PaginatedBilleteraDigitalCatalogo,
  PaginatedMetodoFinanciero,
  PaginatedMetodoFinancieroDetalle,
  PaginatedCuentaBancaria,
  PaginatedBilleteraDigital,
  PaginatedTarjeta,
} from "../types/MetodoFinanciero";

// Usar proxy de Vite para desarrollo
const API_URL = "/api/operaciones/";

interface GetParams {
  page?: number;
  search?: string;
}

// Crear instancia de axios con configuración base
const apiClient = axios.create();

// Configurar interceptor para incluir token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Métodos Financieros
export const getMetodosFinancieros = async (
  params: GetParams = {}
): Promise<PaginatedMetodoFinanciero> => {
  try {
    const res = await apiClient.get<PaginatedMetodoFinanciero>(`${API_URL}metodos/`, { params });
    return res.data;
  } catch (err: any) {
    console.error("Error fetching métodos financieros: ", err.response?.data || err.message);
    throw err;
  }
};

export const createMetodoFinanciero = async (metodoData: MetodoFinanciero) => {
  try {
    const res = await apiClient.post<MetodoFinanciero>(`${API_URL}metodos/`, metodoData);
    return res;
  } catch (err) {
    console.error("Error creating método financiero: ", err);
    throw err;
  }
};

export const updateMetodoFinanciero = async (metodoData: MetodoFinanciero, id: number) => {
  try {
    const res = await apiClient.put<MetodoFinanciero>(`${API_URL}metodos/${id}/`, metodoData);
    return res;
  } catch (err) {
    console.error("Error updating método financiero: ", err);
    throw err;
  }
};

export const deactivateMetodoFinanciero = async (id: number) => {
  try {
    const res = await apiClient.delete(`${API_URL}metodos/${id}/`);
    return res;
  } catch (err) {
    console.error("Error deactivating método financiero: ", err);
    throw err;
  }
};

// Detalles de Métodos Financieros
export const getDetallesMetodosFinancieros = async (
  params: GetParams = {}
): Promise<PaginatedMetodoFinancieroDetalle> => {
  try {
    const res = await apiClient.get<PaginatedMetodoFinancieroDetalle>(`${API_URL}detalles/`, { params });
    return res.data;
  } catch (err: any) {
    console.error("Error fetching detalles métodos financieros: ", err.response?.data || err.message);
    throw err;
  }
};

export const createDetalleMetodoFinanciero = async (detalleData: MetodoFinancieroDetalle) => {
  try {
    const res = await apiClient.post<MetodoFinancieroDetalle>(`${API_URL}detalles/`, detalleData);
    return res;
  } catch (err) {
    console.error("Error creating detalle método financiero: ", err);
    throw err;
  }
};

export const updateDetalleMetodoFinanciero = async (detalleData: MetodoFinancieroDetalle, id: number) => {
  try {
    const res = await apiClient.put<MetodoFinancieroDetalle>(`${API_URL}detalles/${id}/`, detalleData);
    return res;
  } catch (err) {
    console.error("Error updating detalle método financiero: ", err);
    throw err;
  }
};

export const deactivateDetalleMetodoFinanciero = async (id: number) => {
  try {
    const res = await apiClient.delete(`${API_URL}detalles/${id}/`);
    return res;
  } catch (err) {
    console.error("Error deactivating detalle método financiero: ", err);
    throw err;
  }
};

export const toggleActiveMetodoFinanciero = async (id: number) => {
  try {
    const res = await apiClient.post(`${API_URL}detalles/${id}/toggle_active/`);
    return res.data;
  } catch (err) {
    console.error("Error toggling método financiero status: ", err);
    throw err;
  }
};

// Cuentas Bancarias
export const getCuentasBancarias = async (
  params: GetParams = {}
): Promise<PaginatedCuentaBancaria> => {
  try {
    const res = await apiClient.get<PaginatedCuentaBancaria>(`${API_URL}cuentas-bancarias/`, { params });
    return res.data;
  } catch (err: any) {
    console.error("Error fetching cuentas bancarias: ", err.response?.data || err.message);
    throw err;
  }
};

export const createCuentaBancaria = async (cuentaData: CuentaBancaria) => {
  try {
    const res = await apiClient.post<CuentaBancaria>(`${API_URL}cuentas-bancarias/`, cuentaData);
    return res;
  } catch (err) {
    console.error("Error creating cuenta bancaria: ", err);
    throw err;
  }
};

export const updateCuentaBancaria = async (cuentaData: CuentaBancaria, id: number) => {
  try {
    const res = await apiClient.put<CuentaBancaria>(`${API_URL}cuentas-bancarias/${id}/`, cuentaData);
    return res;
  } catch (err) {
    console.error("Error updating cuenta bancaria: ", err);
    throw err;
  }
};

export const deactivateCuentaBancaria = async (id: number) => {
  try {
    const res = await apiClient.delete(`${API_URL}cuentas-bancarias/${id}/`);
    return res;
  } catch (err) {
    console.error("Error deactivating cuenta bancaria: ", err);
    throw err;
  }
};

// Billeteras Digitales
export const getBilleterasDigitales = async (
  params: GetParams = {}
): Promise<PaginatedBilleteraDigital> => {
  try {
    const res = await apiClient.get<PaginatedBilleteraDigital>(`${API_URL}billeteras-digitales/`, { params });
    return res.data;
  } catch (err: any) {
    console.error("Error fetching billeteras digitales: ", err.response?.data || err.message);
    throw err;
  }
};

export const createBilleteraDigital = async (billeteraData: BilleteraDigital) => {
  try {
    const res = await apiClient.post<BilleteraDigital>(`${API_URL}billeteras-digitales/`, billeteraData);
    return res;
  } catch (err) {
    console.error("Error creating billetera digital: ", err);
    throw err;
  }
};

export const updateBilleteraDigital = async (billeteraData: BilleteraDigital, id: number) => {
  try {
    const res = await apiClient.put<BilleteraDigital>(`${API_URL}billeteras-digitales/${id}/`, billeteraData);
    return res;
  } catch (err) {
    console.error("Error updating billetera digital: ", err);
    throw err;
  }
};

export const deactivateBilleteraDigital = async (id: number) => {
  try {
    const res = await apiClient.delete(`${API_URL}billeteras-digitales/${id}/`);
    return res;
  } catch (err) {
    console.error("Error deactivating billetera digital: ", err);
    throw err;
  }
};

// Tarjetas
export const getTarjetas = async (
  params: GetParams = {}
): Promise<PaginatedTarjeta> => {
  try {
    const res = await apiClient.get<PaginatedTarjeta>(`${API_URL}tarjetas/`, { params });
    return res.data;
  } catch (err: any) {
    console.error("Error fetching tarjetas: ", err.response?.data || err.message);
    throw err;
  }
};

export const createTarjeta = async (tarjetaData: Tarjeta) => {
  try {
    const res = await apiClient.post<Tarjeta>(`${API_URL}tarjetas/`, tarjetaData);
    return res;
  } catch (err) {
    console.error("Error creating tarjeta: ", err);
    throw err;
  }
};

export const updateTarjeta = async (tarjetaData: Tarjeta, id: number) => {
  try {
    const res = await apiClient.put<Tarjeta>(`${API_URL}tarjetas/${id}/`, tarjetaData);
    return res;
  } catch (err) {
    console.error("Error updating tarjeta: ", err);
    throw err;
  }
};

export const deactivateTarjeta = async (id: number) => {
  try {
    const res = await apiClient.delete(`${API_URL}tarjetas/${id}/`);
    return res;
  } catch (err) {
    console.error("Error deactivating tarjeta: ", err);
    throw err;
  }
};

// ======================== CATÁLOGOS ========================

// Bancos
export const getBancos = async (
  params: GetParams = {}
): Promise<PaginatedBanco> => {
  try {
    const res = await apiClient.get<PaginatedBanco>(`${API_URL}bancos/`, { params });
    return res.data;
  } catch (err: any) {
    console.error("Error fetching bancos: ", err.response?.data || err.message);
    throw err;
  }
};

export const createBanco = async (bancoData: Banco) => {
  try {
    const res = await apiClient.post<Banco>(`${API_URL}bancos/`, bancoData);
    return res;
  } catch (err) {
    console.error("Error creating banco: ", err);
    throw err;
  }
};

export const updateBanco = async (bancoData: Banco, id: number) => {
  try {
    const res = await apiClient.put<Banco>(`${API_URL}bancos/${id}/`, bancoData);
    return res;
  } catch (err) {
    console.error("Error updating banco: ", err);
    throw err;
  }
};

export const deactivateBanco = async (id: number) => {
  try {
    const res = await apiClient.delete(`${API_URL}bancos/${id}/`);
    return res;
  } catch (err) {
    console.error("Error deactivating banco: ", err);
    throw err;
  }
};

export const toggleActiveBanco = async (id: number) => {
  try {
    const res = await apiClient.post(`${API_URL}bancos/${id}/toggle_active/`);
    return res.data;
  } catch (err) {
    console.error("Error toggling banco status: ", err);
    throw err;
  }
};

// Billeteras Digitales Catálogo
export const getBilleterasDigitalesCatalogo = async (
  params: GetParams = {}
): Promise<PaginatedBilleteraDigitalCatalogo> => {
  try {
    const res = await apiClient.get<PaginatedBilleteraDigitalCatalogo>(`${API_URL}billeteras-catalogo/`, { params });
    return res.data;
  } catch (err: any) {
    console.error("Error fetching billeteras digitales catálogo: ", err.response?.data || err.message);
    throw err;
  }
};

export const createBilleteraDigitalCatalogo = async (billeteraData: BilleteraDigitalCatalogo) => {
  try {
    const res = await apiClient.post<BilleteraDigitalCatalogo>(`${API_URL}billeteras-catalogo/`, billeteraData);
    return res;
  } catch (err) {
    console.error("Error creating billetera digital catálogo: ", err);
    throw err;
  }
};

export const updateBilleteraDigitalCatalogo = async (billeteraData: BilleteraDigitalCatalogo, id: number) => {
  try {
    const res = await apiClient.put<BilleteraDigitalCatalogo>(`${API_URL}billeteras-catalogo/${id}/`, billeteraData);
    return res;
  } catch (err) {
    console.error("Error updating billetera digital catálogo: ", err);
    throw err;
  }
};

export const deactivateBilleteraDigitalCatalogo = async (id: number) => {
  try {
    const res = await apiClient.delete(`${API_URL}billeteras-catalogo/${id}/`);
    return res;
  } catch (err) {
    console.error("Error deactivating billetera digital catálogo: ", err);
    throw err;
  }
};

export const toggleActiveBilleteraDigitalCatalogo = async (id: number) => {
  try {
    const res = await apiClient.post(`${API_URL}billeteras-catalogo/${id}/toggle_active/`);
    return res.data;
  } catch (err) {
    console.error("Error toggling billetera digital catálogo status: ", err);
    throw err;
  }
};
