import type { Divisa, Denominacion } from "../../divisas/types/Divisa";
import type { Tauser } from "./Tauser";

export type MovimientoStockDetalle = {
  id: number;
  movimiento_stock: number;
  denominacion: number;
  cantidad: number;
  denominacion_detalle: Denominacion;
};

export type TipoMovimientoDetalle = {
  codigo: string;
  descripcion: string;
};

export type EstadoMovimientoDetalle = {
  codigo: string;
  descripcion: string;
};

export type MovimientoStock = {
  id: number;
  tipo_movimiento: string;
  tipo_movimiento_detalle: TipoMovimientoDetalle;
  tauser: string;
  tauser_detalle: Tauser;
  transaccion: string | null;
  fecha: string;
  monto: string;
  estado: string;
  estado_detalle: EstadoMovimientoDetalle;
  divisa: number;
  divisa_detalle: Divisa;
  detalles_info: MovimientoStockDetalle[];
};

export type MovimientoStockPayload = {
  tipo_movimiento: string;
  tauser: string;
  divisa: number;
  detalles: {
    denominacion: number;
    cantidad: number;
  }[];
};

export type PaginatedMovimientoStock = {
  count: number;
  next: string | null;
  previous: string | null;
  results: MovimientoStock[];
};

export type StockDetalle = {
  stock_id: number;
  denominacion_id: number;
  denominacion_valor: number;
  divisa_id: number;
  divisa_codigo: string;
  divisa_nombre: string;
  cantidad: number;
};

export type StockTotal = {
  divisa_id: number;
  divisa_codigo: string;
  divisa_nombre: string;
  monto: string;
};

export type StockResumen = {
  tauser_info?: Tauser;
  detalle: StockDetalle[];
  totales: StockTotal[];
};

export type StockResumenResponse = {
  tauser: StockResumen;
  casa: StockResumen;
};
