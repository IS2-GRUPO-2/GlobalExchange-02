import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPublicHistory,
  type PublicHistoryPoint,
} from "../services/tasaService";

export type HistoryChartPoint = {
  label: string;
  timestamp: number;
  compra: number;
  venta: number;
  rawDate: string;
};

const normalizePoints = (points: PublicHistoryPoint[]): HistoryChartPoint[] => {
  const mapped = points
    .map((point) => {
      const dateObj = new Date(point.fecha);
      return {
        label: dateObj.toLocaleDateString("es-PY", {
          day: "2-digit",
          month: "short",
        }),
        timestamp: dateObj.getTime(),
        compra: Number(point.tasaCompra),
        venta: Number(point.tasaVenta),
        rawDate: point.fecha,
      } as HistoryChartPoint;
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  if (mapped.length === 1) {
    const clone = { ...mapped[0], timestamp: mapped[0].timestamp + 1, label: `${mapped[0].label}*` };
    return [...mapped, clone];
  }

  return mapped;
};

interface UseHistoryParams {
  divisa?: string;
  start?: string;
  end?: string;
  enabled?: boolean;
}

export const useCotizacionesHistory = ({ divisa, start, end, enabled = true }: UseHistoryParams) => {
  const [rawPoints, setRawPoints] = useState<PublicHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseSymbol, setBaseSymbol] = useState("₲");
  const [divisaLabel, setDivisaLabel] = useState("");

  const fetchData = useCallback(async () => {
    if (!divisa || !enabled) {
      setRawPoints([]);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const response = await getPublicHistory({ divisa, start, end });
      setRawPoints(response.points ?? []);
      setBaseSymbol(response?.base?.simbolo ?? "₲");
      setDivisaLabel(`${response.divisa.codigo} — ${response.divisa.nombre}`);
      setError(null);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || err.message || "Error al cargar el historial");
      setRawPoints([]);
    } finally {
      setLoading(false);
    }
  }, [divisa, end, enabled, start]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const data = useMemo(() => normalizePoints(rawPoints), [rawPoints]);

  return {
    data,
    loading,
    error,
    baseSymbol,
    divisaLabel,
    hasSourcePoints: rawPoints.length > 0,
    refetch: fetchData,
  };
};
