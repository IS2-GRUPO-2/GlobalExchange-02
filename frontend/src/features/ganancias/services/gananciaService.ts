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
  GananciaTransaccion,
  EstadisticasGenerales,
  ComparativaOperaciones,
  GananciaFiltros,
} from '../types/Ganancia';

// Usamos rutas relativas para que las peticiones pasen por el proxy de Nginx
const BASE_URL = '/api/ganancias';

/**
 * Obtiene la URL absoluta para las peticiones
 * En desarrollo, usamos el proxy de Vite
 * En producción, usa la URL relativa
 */
const getAbsoluteUrl = (path: string): string => {
  // Si ya es una URL absoluta, retornarla
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // En desarrollo con Vite, las rutas relativas funcionan gracias al proxy
  // En producción, también funcionan porque Nginx maneja el routing
  return path;
};

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
 * GET /api/ganancias/listado_transacciones/
 * Listado de transacciones en un periodo de hasta 30 días
 * 
 * Si no se especifican fechas, usa los últimos 30 días por defecto.
 * El rango no puede exceder 30 días.
 * 
 * Parámetros permitidos: divisa_extranjera, operacion, metodo_financiero, fecha_inicio, fecha_fin
 */
export const getListadoTransacciones = async (
  filtros: GananciaFiltros = {}
): Promise<GananciaTransaccion[]> => {
  const allowedParams = ['divisa_extranjera', 'operacion', 'metodo_financiero', 'fecha_inicio', 'fecha_fin'];
  const params = buildQueryParams(filtros, allowedParams);
  
  const response = await axios.get<GananciaTransaccion[]>(
    `${BASE_URL}/listado_transacciones/?${params.toString()}`
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

/**
 * Exporta un reporte a Excel
 * Descarga el archivo directamente usando fetch con autenticación
 * 
 * @param reporte - Tipo de reporte: 'general', 'por_divisa', 'evolucion', 'transacciones'
 * @param filtros - Filtros aplicados al reporte
 */
export const exportExcel = async (reporte: string, filtros: GananciaFiltros = {}): Promise<void> => {
  try {
    // Build params separately to avoid type issues
    const params = buildQueryParams(filtros);
    params.append('reporte', reporte);
    const url = getAbsoluteUrl(`${BASE_URL}/export_excel/?${params.toString()}`);
    
    // Obtener el token de autenticación
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No se encontró token de autenticación. Por favor, inicie sesión nuevamente.');
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
      }
      throw new Error(`Error al generar el reporte: ${response.statusText}`);
    }

    // Obtener el blob y crear URL temporal
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    // Obtener el nombre del archivo desde el header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : `reporte_${reporte}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Crear enlace temporal y hacer click automático
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    throw error;
  }
};

/**
 * Exporta un reporte a PDF
 * Descarga el archivo PDF con el nombre correcto
 * 
 * @param reporte - Tipo de reporte: 'general', 'por_divisa', 'evolucion', 'transacciones'
 * @param filtros - Filtros aplicados al reporte
 */
export const exportPDF = async (reporte: string, filtros: GananciaFiltros = {}): Promise<void> => {
  try {
    // Build params separately to avoid type issues
    const params = buildQueryParams(filtros);
    params.append('reporte', reporte);
    const url = getAbsoluteUrl(`${BASE_URL}/export_pdf/?${params.toString()}`);
    
    // Obtener el token de autenticación
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No se encontró token de autenticación. Por favor, inicie sesión nuevamente.');
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
      }
      throw new Error(`Error al generar el reporte: ${response.statusText}`);
    }

    // Obtener el nombre del archivo desde el header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : `reporte_${reporte}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Obtener el blob y descargar con el nombre correcto
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error al exportar a PDF:', error);
    throw error;
  }
};

export default {
  getGanancias,
  getGananciaDetalle,
  getReporteGeneral,
  getGananciasPorDivisa,
  getGananciasPorMetodo,
  getEvolucionTemporal,
  getListadoTransacciones,
  getEstadisticas,
  getComparativaOperaciones,
  exportExcel,
  exportPDF,
};