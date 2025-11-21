/**
 * Types for Ganancias (Profit Tracking) feature
 * 
 * Matches backend models and serializers from apps/ganancias/
 */

export interface DivisaDetalle {
  id: number;
  codigo: string;
  nombre: string;
  simbolo: string;
}

export interface MetodoFinancieroDetalle {
  id: number;
  nombre: string;
}

export interface Ganancia {
  id: number;
  transaccion: number;
  ganancia_neta: string; // Decimal as string
  divisa_extranjera: number;
  divisa_extranjera_detalle: DivisaDetalle;
  fecha: string; // ISO date string
  anio: number;
  mes: number;
  operacion: 'compra' | 'venta';
  metodo_financiero: number | null;
  metodo_financiero_detalle: MetodoFinancieroDetalle | null;
  tasa_mercado: string; // Decimal as string
  tasa_aplicada: string; // Decimal as string
  monto_divisa: string; // Decimal as string
  created_at: string; // ISO datetime string
  porcentaje_margen: number; // Calculated property
  ganancia_por_unidad: number; // Calculated property
}

export interface GananciaPorDivisa {
  divisa_codigo: string;
  divisa_nombre: string;
  total_ganancia: string;
  cantidad_operaciones: number;
  ganancia_promedio: string;
  monto_total_operado: string;
}

export interface GananciaPorMetodo {
  metodo_nombre: string | null;
  metodo_display: string;
  total_ganancia: string;
  cantidad_operaciones: number;
  ganancia_promedio: string;
}

export interface GananciaEvolucionTemporal {
  periodo: string; // "2024-01" or "2024-01-15"
  anio: number;
  mes: number;
  total_ganancia: string;
  cantidad_operaciones: number;
  ganancia_promedio: string;
}

export interface GananciaTopTransaccion {
  transaccion_id: number;
  fecha: string;
  divisa_codigo: string;
  operacion: 'compra' | 'venta';
  ganancia_neta: string;
  monto_divisa: string;
  tasa_aplicada: string;
  cliente_nombre: string;
  metodo_nombre: string | null;
}

export interface EstadisticasGenerales {
  total_ganancia: string;
  total_operaciones: number;
  ganancia_promedio_operacion: string;
  ganancia_maxima: string;
  ganancia_minima: string;
  operaciones_compra: number;
  operaciones_venta: number;
  ganancia_compra: string;
  ganancia_venta: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

export interface ComparativaOperaciones {
  compra: {
    total_ganancia: string;
    cantidad_operaciones: number;
    ganancia_promedio: string;
    porcentaje_total: number;
  };
  venta: {
    total_ganancia: string;
    cantidad_operaciones: number;
    ganancia_promedio: string;
    porcentaje_total: number;
  };
}

export interface ReporteGeneral {
  resumen: {
    total_ganancia: string;
    total_operaciones: number;
    ganancia_promedio: string;
  };
  por_divisa: GananciaPorDivisa[];
  por_metodo: GananciaPorMetodo[];
  por_operacion: {
    compra: {
      total_ganancia: string;
      cantidad: number;
    };
    venta: {
      total_ganancia: string;
      cantidad: number;
    };
  };
}

export interface GananciaFiltros {
  divisa_extranjera?: number;
  operacion?: 'compra' | 'venta';
  metodo_financiero?: number;
  anio?: number;
  mes?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  granularidad?: 'mes' | 'dia'; // Para evolucion_temporal
  limit?: number; // Para top_transacciones
}

export interface GananciasPaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Ganancia[];
}
