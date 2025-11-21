/**
 * Service for Ganancias API endpoints
 * 
 * Provides methods to interact with the backend profit tracking system
 */

import axios from 'axios';
import type {
  Ganancia,
  GananciasPaginatedResponse,
  ReporteGeneral,
  GananciaPorDivisa,
  GananciaPorMetodo,
  GananciaEvolucionTemporal,
  GananciaTopTransaccion,
  EstadisticasGenerales,
  ComparativaOperaciones,
  GananciaFiltros,
} from '../types/Ganancia';

// Usamos rutas relativas para que las peticiones pasen por el proxy de Nginx
const BASE_URL = '/api/ganancias';

/**
 * Builds query params from filters object
 * Filters out undefined, null and empty string values
 */
const buildQueryParams = (filtros: GananciaFiltros = {}, allowedParams?: string[]): URLSearchParams => {
  const params = new URLSearchParams();
  
  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // If allowedParams is specified, only include those parameters
      if (!allowedParams || allowedParams.includes(key)) {
        params.append(key, String(value));
      }
    }
  });
  
  return params;
};

/**
 * GET /api/ganancias/
 * Lista paginada de todas las ganancias
 */
export const getGanancias = async (
  filtros: GananciaFiltros = {},
  page: number = 1
): Promise<GananciasPaginatedResponse> => {
  const params = buildQueryParams(filtros);
  params.append('page', String(page));
  
  const response = await axios.get<GananciasPaginatedResponse>(
    `${BASE_URL}/?${params.toString()}`
  );
  
  return response.data;
};

/**
 * GET /api/ganancias/{id}/
 * Detalle de una ganancia específica
 */
export const getGananciaDetalle = async (id: number): Promise<Ganancia> => {
  const response = await axios.get<Ganancia>(`${BASE_URL}/${id}/`);
  return response.data;
};

/**
 * GET /api/ganancias/reporte_general/
 * Reporte general consolidado con resumen y agrupaciones
 */
export const getReporteGeneral = async (
  filtros: GananciaFiltros = {}
): Promise<ReporteGeneral> => {
  const params = buildQueryParams(filtros);
  
  const response = await axios.get<ReporteGeneral>(
    `${BASE_URL}/reporte_general/?${params.toString()}`
  );
  
  return response.data;
};

/**
 * GET /api/ganancias/por_divisa/
 * Ganancias agrupadas por divisa extranjera
 * 
 * Parámetros permitidos: divisa_extranjera, operacion, metodo_financiero, anio, mes, fecha_inicio, fecha_fin
 */
export const getGananciasPorDivisa = async (
  filtros: GananciaFiltros = {}
): Promise<GananciaPorDivisa[]> => {
  const allowedParams = ['divisa_extranjera', 'operacion', 'metodo_financiero', 'anio', 'mes', 'fecha_inicio', 'fecha_fin'];
  const params = buildQueryParams(filtros, allowedParams);
  
  const response = await axios.get<GananciaPorDivisa[]>(
    `${BASE_URL}/por_divisa/?${params.toString()}`
  );
  
  return response.data;
};

/**
 * GET /api/ganancias/por_metodo/
 * Ganancias agrupadas por método de pago
 * 
 * Parámetros permitidos: divisa_extranjera, operacion, metodo_financiero, anio, mes, fecha_inicio, fecha_fin
 */
export const getGananciasPorMetodo = async (
  filtros: GananciaFiltros = {}
): Promise<GananciaPorMetodo[]> => {
  const allowedParams = ['divisa_extranjera', 'operacion', 'metodo_financiero', 'anio', 'mes', 'fecha_inicio', 'fecha_fin'];
  const params = buildQueryParams(filtros, allowedParams);
  
  const response = await axios.get<GananciaPorMetodo[]>(
    `${BASE_URL}/por_metodo/?${params.toString()}`
  );
  
  return response.data;
};

/**
 * GET /api/ganancias/evolucion_temporal/
 * Evolución temporal de ganancias (por mes o día)
 * 
 * Parámetros permitidos: divisa_extranjera, operacion, metodo_financiero, anio, mes, fecha_inicio, fecha_fin, granularidad
 */
export const getEvolucionTemporal = async (
  filtros: GananciaFiltros = {}
): Promise<GananciaEvolucionTemporal[]> => {
  const allowedParams = ['divisa_extranjera', 'operacion', 'metodo_financiero', 'anio', 'mes', 'fecha_inicio', 'fecha_fin', 'granularidad'];
  const params = buildQueryParams(filtros, allowedParams);
  
  const response = await axios.get<GananciaEvolucionTemporal[]>(
    `${BASE_URL}/evolucion_temporal/?${params.toString()}`
  );
  
  return response.data;
};

/**
 * GET /api/ganancias/top_transacciones/
 * Transacciones con mayor ganancia
 * 
 * Parámetros permitidos: divisa_extranjera, operacion, metodo_financiero, anio, mes, fecha_inicio, fecha_fin, limit
 */
export const getTopTransacciones = async (
  filtros: GananciaFiltros = {}
): Promise<GananciaTopTransaccion[]> => {
  const allowedParams = ['divisa_extranjera', 'operacion', 'metodo_financiero', 'anio', 'mes', 'fecha_inicio', 'fecha_fin', 'limit'];
  const params = buildQueryParams(filtros, allowedParams);
  
  const response = await axios.get<GananciaTopTransaccion[]>(
    `${BASE_URL}/top_transacciones/?${params.toString()}`
  );
  
  return response.data;
};

/**
 * GET /api/ganancias/estadisticas/
 * Estadísticas generales completas del periodo
 * 
 * Parámetros permitidos: divisa_extranjera, operacion, metodo_financiero, anio, mes, fecha_inicio, fecha_fin
 */
export const getEstadisticas = async (
  filtros: GananciaFiltros = {}
): Promise<EstadisticasGenerales> => {
  // Solo enviar parámetros que el backend acepta
  const allowedParams = ['divisa_extranjera', 'operacion', 'metodo_financiero', 'anio', 'mes', 'fecha_inicio', 'fecha_fin'];
  const params = buildQueryParams(filtros, allowedParams);
  
  const response = await axios.get<EstadisticasGenerales>(
    `${BASE_URL}/estadisticas/?${params.toString()}`
  );
  
  return response.data;
};

/**
 * GET /api/ganancias/comparativa_operaciones/
 * Comparativa entre operaciones de compra y venta
 * 
 * Parámetros permitidos: divisa_extranjera, operacion, metodo_financiero, anio, mes, fecha_inicio, fecha_fin
 */
export const getComparativaOperaciones = async (
  filtros: GananciaFiltros = {}
): Promise<ComparativaOperaciones> => {
  const allowedParams = ['divisa_extranjera', 'operacion', 'metodo_financiero', 'anio', 'mes', 'fecha_inicio', 'fecha_fin'];
  const params = buildQueryParams(filtros, allowedParams);
  
  const response = await axios.get<ComparativaOperaciones>(
    `${BASE_URL}/comparativa_operaciones/?${params.toString()}`
  );
  
  return response.data;
};

export default {
  getGanancias,
  getGananciaDetalle,
  getReporteGeneral,
  getGananciasPorDivisa,
  getGananciasPorMetodo,
  getEvolucionTemporal,
  getTopTransacciones,
  getEstadisticas,
  getComparativaOperaciones,
};
