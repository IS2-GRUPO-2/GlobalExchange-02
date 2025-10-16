import axios from "axios";
import type {
  Banco,
  BilleteraDigitalCatalogo,
  TarjetaCatalogo,
  MetodoFinanciero,
  MetodoFinancieroDetalle,
  CuentaBancaria,
  BilleteraDigital,
  Tarjeta,
  PaginatedBanco,
  PaginatedBilleteraDigitalCatalogo,
  PaginatedTarjetaCatalogo,
  PaginatedMetodoFinanciero,
  PaginatedMetodoFinancieroDetalle,
  PaginatedCuentaBancaria,
  PaginatedBilleteraDigital,
  PaginatedTarjeta,
} from "../types/MetodoFinanciero";

// Usar proxy de Vite para desarrollo
const API_URL = "/api/metodos_financieros/";

interface GetParams {
  page?: number;
  search?: string;
  page_size?: number;
}

// ======================== CATÁLOGOS ========================

// Bancos
export const getBancos = async (
  params: GetParams = {}
): Promise<PaginatedBanco> => {
  try {
    const res = await axios.get<PaginatedBanco>(`${API_URL}bancos/`, {
      params,
    });
    return res.data;
  } catch (err: any) {
    console.error("Error fetching bancos: ", err.response?.data || err.message);
    throw err;
  }
};

export const createBanco = async (bancoData: Banco) => {
  try {
    const res = await axios.post<Banco>(`${API_URL}bancos/`, bancoData);
    return res;
  } catch (err) {
    console.error("Error creating banco: ", err);
    throw err;
  }
};

export const updateBanco = async (bancoData: Banco, id: number) => {
  try {
    const res = await axios.put<Banco>(`${API_URL}bancos/${id}/`, bancoData);
    return res;
  } catch (err) {
    console.error("Error updating banco: ", err);
    throw err;
  }
};

export const deactivateBanco = async (id: number) => {
  try {
    const res = await axios.delete(`${API_URL}bancos/${id}/`);
    return res;
  } catch (err) {
    console.error("Error deactivating banco: ", err);
    throw err;
  }
};

export const toggleActiveBanco = async (id: number) => {
  try {
    const res = await axios.post(`${API_URL}bancos/${id}/toggle_active/`);
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
    const res = await axios.get<PaginatedBilleteraDigitalCatalogo>(
      `${API_URL}billeteras-catalogo/`,
      { params }
    );
    return res.data;
  } catch (err: any) {
    console.error(
      "Error fetching billeteras digitales catálogo: ",
      err.response?.data || err.message
    );
    throw err;
  }
};

export const createBilleteraDigitalCatalogo = async (
  billeteraData: BilleteraDigitalCatalogo
) => {
  try {
    const res = await axios.post<BilleteraDigitalCatalogo>(
      `${API_URL}billeteras-catalogo/`,
      billeteraData
    );
    return res;
  } catch (err) {
    console.error("Error creating billetera digital catálogo: ", err);
    throw err;
  }
};

export const updateBilleteraDigitalCatalogo = async (
  billeteraData: BilleteraDigitalCatalogo,
  id: number
) => {
  try {
    const res = await axios.put<BilleteraDigitalCatalogo>(
      `${API_URL}billeteras-catalogo/${id}/`,
      billeteraData
    );
    return res;
  } catch (err) {
    console.error("Error updating billetera digital catálogo: ", err);
    throw err;
  }
};

export const deactivateBilleteraDigitalCatalogo = async (id: number) => {
  try {
    const res = await axios.delete(`${API_URL}billeteras-catalogo/${id}/`);
    return res;
  } catch (err) {
    console.error("Error deactivating billetera digital catálogo: ", err);
    throw err;
  }
};

export const toggleActiveBilleteraDigitalCatalogo = async (id: number) => {
  try {
    const res = await axios.post(
      `${API_URL}billeteras-catalogo/${id}/toggle_active/`
    );
    return res.data;
  } catch (err) {
    console.error("Error toggling billetera digital catálogo status: ", err);
    throw err;
  }
};

// Tarjetas Catálogo
export const getTarjetasCatalogo = async (
  params: GetParams = {}
): Promise<PaginatedTarjetaCatalogo> => {
  try {
    const res = await axios.get<PaginatedTarjetaCatalogo>(
      `${API_URL}tarjetas-catalogo/`,
      { params }
    );
    return res.data;
  } catch (err: any) {
    console.error(
      "Error fetching tarjetas catálogo: ",
      err.response?.data || err.message
    );
    throw err;
  }
};

export const createTarjetaCatalogo = async (tarjetaData: TarjetaCatalogo) => {
  try {
    const res = await axios.post<TarjetaCatalogo>(
      `${API_URL}tarjetas-catalogo/`,
      tarjetaData
    );
    return res;
  } catch (err) {
    console.error("Error creating tarjeta catálogo: ", err);
    throw err;
  }
};

export const updateTarjetaCatalogo = async (
  tarjetaData: TarjetaCatalogo,
  id: number
) => {
  try {
    const res = await axios.put<TarjetaCatalogo>(
      `${API_URL}tarjetas-catalogo/${id}/`,
      tarjetaData
    );
    return res;
  } catch (err) {
    console.error("Error updating tarjeta catálogo: ", err);
    throw err;
  }
};

export const deactivateTarjetaCatalogo = async (id: number) => {
  try {
    const res = await axios.delete(`${API_URL}tarjetas-catalogo/${id}/`);
    return res;
  } catch (err) {
    console.error("Error deactivating tarjeta catálogo: ", err);
    throw err;
  }
};

export const toggleActiveTarjetaCatalogo = async (id: number) => {
  try {
    const res = await axios.post(
      `${API_URL}tarjetas-catalogo/${id}/toggle_active/`
    );
    return res.data;
  } catch (err) {
    console.error("Error toggling tarjeta catálogo status: ", err);
    throw err;
  }
};

// ======================== MÉTODOS FINANCIEROS ========================

export const getMetodosFinancieros = async (
  params: GetParams = {}
): Promise<PaginatedMetodoFinanciero> => {
  try {
    const res = await axios.get<PaginatedMetodoFinanciero>(
      `${API_URL}metodos/`,
      { params }
    );
    return res.data;
  } catch (err: any) {
    console.error(
      "Error fetching métodos financieros: ",
      err.response?.data || err.message
    );
    throw err;
  }
};

export const getMetodosFinancierosPorOperacion = async (
  op_perspectiva_casa: "compra" | "venta"
): Promise<MetodoFinanciero[]> => {
  try {
    const res = await axios.get<MetodoFinanciero[]>(
      `${API_URL}metodos/metodos-operacion/`,
      { params: { op_perspectiva_casa: op_perspectiva_casa } }
    );
    return res.data;
  } catch (err: any) {
    console.error(
      "Error fetching métodos financieros por operación: ",
      err.response?.data || err.message
    );
    throw err;
  }
};

export const createMetodoFinanciero = async (metodoData: MetodoFinanciero) => {
  try {
    const res = await axios.post<MetodoFinanciero>(
      `${API_URL}metodos/`,
      metodoData
    );
    return res;
  } catch (err) {
    console.error("Error creating método financiero: ", err);
    throw err;
  }
};

export const updateMetodoFinanciero = async (
  metodoData: MetodoFinanciero,
  id: number
) => {
  try {
    const res = await axios.put<MetodoFinanciero>(
      `${API_URL}metodos/${id}/`,
      metodoData
    );
    return res;
  } catch (err) {
    console.error("Error updating método financiero: ", err);
    throw err;
  }
};

export const toggleActiveMetodoFinancieroDetalle = async (id: number) => {
  try {
    const res = await axios.post(`${API_URL}detalles/${id}/toggle_active/`);
    return res.data;
  } catch (err) {
    console.error("Error toggling detalle método financiero status: ", err);
    throw err;
  }
};

// ======================== DETALLES ========================

export const getMetodosFinancierosDetalles = async (
  params: GetParams = {}
): Promise<PaginatedMetodoFinancieroDetalle> => {
  try {
    const res = await axios.get<PaginatedMetodoFinancieroDetalle>(
      `${API_URL}detalles/`,
      { params }
    );
    return res.data;
  } catch (err: any) {
    console.error(
      "Error fetching detalles: ",
      err.response?.data || err.message
    );
    throw err;
  }
};

// Alias para mantener compatibilidad
export const getDetallesMetodosFinancieros = getMetodosFinancierosDetalles;

export const createDetalleMetodoFinanciero = async (
  detalleData: MetodoFinancieroDetalle
) => {
  try {
    const res = await axios.post<MetodoFinancieroDetalle>(
      `${API_URL}detalles/`,
      detalleData
    );
    return res;
  } catch (err) {
    console.error("Error creating detalle método financiero: ", err);
    throw err;
  }
};

export const deactivateMetodoFinanciero = async (id: number) => {
  try {
    const res = await axios.delete(`${API_URL}metodos/${id}/`);
    return res;
  } catch (err) {
    console.error("Error deactivating método financiero: ", err);
    throw err;
  }
};

// Detalles: nueva función para listar instancias de la casa
export const getMetodosFinancierosDetallesCasa = async (
  params: GetParams = {}
): Promise<PaginatedMetodoFinancieroDetalle> => {
  try {
    const res = await axios.get<PaginatedMetodoFinancieroDetalle>(
      `${API_URL}detalles/casa/`,
      { params }
    );
    return res.data;
  } catch (err: any) {
    console.error(
      "Error fetching detalles (casa): ",
      err.response?.data || err.message
    );
    throw err;
  }
};

export const getMetodosFinancierosDetallesCliente = async (
  params: GetParams = {}
): Promise<PaginatedMetodoFinancieroDetalle> => {
  try {
    const res = await axios.get<PaginatedMetodoFinancieroDetalle>(
      `${API_URL}detalles/cliente/`,
      { params }
    );
    return res.data;
  } catch (err: any) {
    console.error(
      "Error fetching detalles (cliente): ",
      err.response?.data || err.message
    );
    throw err;
  }
};

// ======================== INSTANCIAS ========================

// Cuentas Bancarias
export const getCuentasBancarias = async (
  params: GetParams = {}
): Promise<PaginatedCuentaBancaria> => {
  try {
    const res = await axios.get<PaginatedCuentaBancaria>(
      `${API_URL}cuentas-bancarias/`,
      { params }
    );
    return res.data;
  } catch (err: any) {
    console.error(
      "Error fetching cuentas bancarias: ",
      err.response?.data || err.message
    );
    throw err;
  }
};

export const createCuentaBancaria = async (cuentaData: CuentaBancaria) => {
  try {
    const res = await axios.post<CuentaBancaria>(
      `${API_URL}cuentas-bancarias/`,
      cuentaData
    );
    return res;
  } catch (err) {
    console.error("Error creating cuenta bancaria: ", err);
    throw err;
  }
};

export const updateCuentaBancaria = async (
  cuentaData: CuentaBancaria,
  id: number
) => {
  try {
    const res = await axios.put<CuentaBancaria>(
      `${API_URL}cuentas-bancarias/${id}/`,
      cuentaData
    );
    return res;
  } catch (err) {
    console.error("Error updating cuenta bancaria: ", err);
    throw err;
  }
};

// Billeteras Digitales
export const getBilleterasDigitales = async (
  params: GetParams = {}
): Promise<PaginatedBilleteraDigital> => {
  try {
    const res = await axios.get<PaginatedBilleteraDigital>(
      `${API_URL}billeteras-digitales/`,
      { params }
    );
    return res.data;
  } catch (err: any) {
    console.error(
      "Error fetching billeteras digitales: ",
      err.response?.data || err.message
    );
    throw err;
  }
};

export const createBilleteraDigital = async (
  billeteraData: BilleteraDigital
) => {
  try {
    const res = await axios.post<BilleteraDigital>(
      `${API_URL}billeteras-digitales/`,
      billeteraData
    );
    return res;
  } catch (err) {
    console.error("Error creating billetera digital: ", err);
    throw err;
  }
};

export const updateBilleteraDigital = async (
  billeteraData: BilleteraDigital,
  id: number
) => {
  try {
    const res = await axios.put<BilleteraDigital>(
      `${API_URL}billeteras-digitales/${id}/`,
      billeteraData
    );
    return res;
  } catch (err) {
    console.error("Error updating billetera digital: ", err);
    throw err;
  }
};

// Tarjetas
export const getTarjetas = async (
  params: GetParams = {}
): Promise<PaginatedTarjeta> => {
  try {
    const res = await axios.get<PaginatedTarjeta>(`${API_URL}tarjetas/`, {
      params,
    });
    return res.data;
  } catch (err: any) {
    console.error(
      "Error fetching tarjetas: ",
      err.response?.data || err.message
    );
    throw err;
  }
};

export const createTarjeta = async (tarjetaData: Tarjeta) => {
  try {
    const res = await axios.post<Tarjeta>(`${API_URL}tarjetas/`, tarjetaData);
    return res;
  } catch (err) {
    console.error("Error creating tarjeta: ", err);
    throw err;
  }
};

export const updateTarjeta = async (tarjetaData: Tarjeta, id: number) => {
  try {
    const res = await axios.put<Tarjeta>(
      `${API_URL}tarjetas/${id}/`,
      tarjetaData
    );
    return res;
  } catch (err) {
    console.error("Error updating tarjeta: ", err);
    throw err;
  }
};

// ======================== MÉTODOS CLIENTE ESPECÍFICOS ========================

/**
 * Obtiene las cuentas bancarias activas del cliente actual
 */
export const getMisCuentasBancarias = async (
  params: GetParams = {}
): Promise<CuentaBancaria[]> => {
  try {
    const res = await axios.get<CuentaBancaria[]>(
      `${API_URL}cuentas-bancarias/mis-cuentas/`,
      { params }
    );
    return res.data;
  } catch (err) {
    console.error("Error obteniendo mis cuentas bancarias: ", err);
    throw err;
  }
};

/**
 * Obtiene las billeteras digitales activas del cliente actual
 */
export const getMisBilleterasDigitales = async (
  params: GetParams = {}
): Promise<BilleteraDigital[]> => {
  try {
    const res = await axios.get<BilleteraDigital[]>(
      `${API_URL}billeteras-digitales/mis-billeteras/`,
      { params }
    );
    return res.data;
  } catch (err) {
    console.error("Error obteniendo mis billeteras digitales: ", err);
    throw err;
  }
};

/**
 * Obtiene las tarjetas activas del cliente actual
 */
export const getMisTarjetas = async (
  params: GetParams = {}
): Promise<Tarjeta[]> => {
  try {
    const res = await axios.get<Tarjeta[]>(`${API_URL}tarjetas/mis-tarjetas/`, {
      params,
    });
    return res.data;
  } catch (err) {
    console.error("Error obteniendo mis tarjetas: ", err);
    throw err;
  }
};

// ======================== MÉTODOS CASA DE CAMBIO ========================

/**
 * Obtiene las cuentas bancarias de la casa de cambio (solo admins)
 */
export const getCasaCuentasBancarias = async (
  params: GetParams = {}
): Promise<CuentaBancaria[]> => {
  try {
    const res = await axios.get<CuentaBancaria[]>(
      `${API_URL}cuentas-bancarias/casa-cuentas/`,
      { params }
    );
    return res.data;
  } catch (err) {
    console.error("Error obteniendo cuentas bancarias de la casa: ", err);
    throw err;
  }
};

/**
 * Obtiene las billeteras digitales de la casa de cambio (solo admins)
 */
export const getCasaBilleterasDigitales = async (
  params: GetParams = {}
): Promise<BilleteraDigital[]> => {
  try {
    const res = await axios.get<BilleteraDigital[]>(
      `${API_URL}billeteras-digitales/casa-billeteras/`,
      { params }
    );
    return res.data;
  } catch (err) {
    console.error("Error obteniendo billeteras digitales de la casa: ", err);
    throw err;
  }
};

/**
 * Obtiene las tarjetas de la casa de cambio (solo admins)
 */
export const getCasaTarjetas = async (): Promise<Tarjeta[]> => {
  try {
    const res = await axios.get<Tarjeta[]>(`${API_URL}tarjetas/casa-tarjetas/`);
    return res.data;
  } catch (err) {
    console.error("Error obteniendo tarjetas de la casa: ", err);
    throw err;
  }
};

export const getMetodoFinanciero = async (
  id: number
): Promise<MetodoFinanciero> => {
  try {
    const res = await axios.get<MetodoFinanciero>(`${API_URL}metodos/${id}/`);
    return res.data;
  } catch (err) {
    console.error("Error obteniendo tarjetas de la casa: ", err);
    throw err;
  }
};
