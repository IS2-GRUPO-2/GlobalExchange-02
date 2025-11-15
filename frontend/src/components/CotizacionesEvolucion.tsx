import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { getDivisasConTasa } from "../features/divisas/services/divisaService";
import type { Divisa, PaginatedDivisas } from "../features/divisas/types/Divisa";
import { useCotizacionesHistory } from "../features/cotizaciones/hooks/useCotizacionesHistory";

const formatDateInput = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const loadDivisas = async (): Promise<Divisa[]> => {
  let page = 1;
  const aggregated: Divisa[] = [];
  while (true) {
    const res: PaginatedDivisas = await getDivisasConTasa({ page, search: "" });
    aggregated.push(...(res.results ?? []));
    if (!res.next || (res.results ?? []).length === 0) break;
    page += 1;
  }
  // Filtrar la divisa base (es_base=true) para que no aparezca en el selector
  return aggregated.filter((d) => !d.es_base);
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { rawDate, compraFormatted, ventaFormatted } = payload[0].payload;
  const fecha = new Date(rawDate).toLocaleString("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return (
    <div className="rounded-md border bg-white px-3 py-2 text-sm shadow">
      <p className="text-xs text-gray-500">{fecha}</p>
      <p className="font-semibold text-emerald-600">Compra: {compraFormatted}</p>
      <p className="font-semibold text-orange-500">Venta: {ventaFormatted}</p>
    </div>
  );
};

export default function CotizacionesEvolucion() {
  const today = useMemo(() => new Date(), []);
  const [divisas, setDivisas] = useState<Divisa[]>([]);
  const [selectedDivisa, setSelectedDivisa] = useState<string>("");

  const [startDate, setStartDate] = useState(() => {
    // Establecer fecha inicial al primer día del mes actual
    const initial = new Date(today.getFullYear(), today.getMonth(), 1);
    return formatDateInput(initial);
  });
  const [endDate, setEndDate] = useState(() => formatDateInput(today));
  const [loadingDivisas, setLoadingDivisas] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingDivisas(true);
        const catalog = await loadDivisas();
        setDivisas(catalog);
        if (!selectedDivisa && catalog.length) {
          // Seleccionar la primera divisa disponible (ya no incluye la base)
          setSelectedDivisa(catalog[0].codigo);
        }
      } catch (error) {
        toast.error("No pudimos cargar las divisas disponibles");
        console.error(error);
      } finally {
        setLoadingDivisas(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isRangeValid = useMemo(() => {
    if (!startDate || !endDate) return false;
    return new Date(startDate) <= new Date(endDate);
  }, [startDate, endDate]);

  const {
    data,
    loading: loadingHistory,
    error: historyError,
    baseSymbol,
    divisaLabel,
    hasSourcePoints,
  } = useCotizacionesHistory({
    divisa: selectedDivisa,
    start: startDate,
    end: endDate,
    enabled: Boolean(selectedDivisa) && isRangeValid,
  });

  const formattedData = useMemo(() => {
    return data.map((point) => {
      const compraFormatted = `${baseSymbol} ${point.compra.toLocaleString("es-PY", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
      })}`;
      const ventaFormatted = `${baseSymbol} ${point.venta.toLocaleString("es-PY", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
      })}`;
      return {
        ...point,
        compraFormatted,
        ventaFormatted,
      };
    });
  }, [data, baseSymbol]);

  return (
    <section className="mt-6">
      <div className="w-full rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Evolución de cotizaciones</h3>
            <p className="text-sm text-gray-500">
              Visualiza cómo varió la tasa frente a la divisa base en el rango seleccionado.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                Divisa
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                value={selectedDivisa}
                onChange={(e) => setSelectedDivisa(e.target.value)}
                disabled={loadingDivisas || !divisas.length}
              >
                {loadingDivisas && <option value="">Cargando…</option>}
                {!loadingDivisas && !divisas.length && <option value="">Sin opciones</option>}
                {divisas.map((divisa) => (
                  <option key={divisa.codigo} value={divisa.codigo}>
                    {divisa.codigo} — {divisa.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                  Desde
                </label>
                <input
                  type="date"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                  value={startDate}
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                  Hasta
                </label>
                <input
                  type="date"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                  value={endDate}
                  min={startDate}
                  max={formatDateInput(today)}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {!isRangeValid && (
          <p className="mt-4 text-sm text-red-600">Selecciona un rango válido para visualizar el gráfico.</p>
        )}
        {historyError && isRangeValid && (
          <p className="mt-4 text-sm text-red-600">{historyError}</p>
        )}

        {loadingHistory && (
          <div className="py-12 text-center text-sm text-gray-500">Cargando historial…</div>
        )}

        {!loadingHistory && isRangeValid && !historyError && !hasSourcePoints && (
          <div className="py-12 text-center text-sm text-gray-500">
            No hay datos registrados para esta divisa en el rango seleccionado.
          </div>
        )}

        {!loadingHistory && isRangeValid && hasSourcePoints && (
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) =>
                    `${baseSymbol} ${Number(value).toLocaleString("es-PY", {
                      maximumFractionDigits: 0,
                    })}`
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="compra" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="venta" stroke="#fb923c" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-2 text-center text-xs text-gray-500">{divisaLabel}</p>
          </div>
        )}
      </div>
    </section>
  );
}
