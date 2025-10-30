import axios from "axios";
import type {
  MovimientoStockPayload,
  PaginatedMovimientoStock,
  StockResumenResponse,
} from "../types/Stock";

const API_URL = "/api/movimiento-stock/";

export const createMovimientoStock = async (payload: MovimientoStockPayload) =>
  axios.post(API_URL, payload);

export const getMovimientosStock = async (
  params: Record<string, unknown> = {}
): Promise<PaginatedMovimientoStock> => {
  const res = await axios.get<PaginatedMovimientoStock>(API_URL, { params });
  return res.data;
};

export const getStockResumen = async (
  tauserId: string
): Promise<StockResumenResponse> => {
  const res = await axios.get<StockResumenResponse>(`${API_URL}resumen/`, {
    params: { tauser: tauserId },
  });
  return res.data;
};
