import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  createMovimientoStock,
  getMovimientosStock,
  getStockResumen,
} from "../services/stockService";
import {
  getDenominacionesOfDivisa,
  getDivisas,
} from "../../divisas/services/divisaService";
import type {
  Denominacion,
  Divisa,
} from "../../divisas/types/Divisa";
import type { Tauser } from "../types/Tauser";
import type {
  MovimientoStock,
  StockResumenResponse,
} from "../types/Stock";
import Modal from "../../../components/Modal";
import { Loader2 } from "lucide-react";

type Props = {
  isOpen: boolean;
  tauser: Tauser | null;
  onClose: () => void;
  onSuccess?: () => void;
};

type MovimientoTipo = "ENTCS" | "SALCS";

const HIST_PAGE_SIZE = 8;

const MOVIMIENTO_OPCIONES: Record<
  MovimientoTipo,
  { label: string; descripcion: string }
> = {
  ENTCS: {
    label: "Recarga (Casa → Tauser)",
    descripcion:
      "Transfiere efectivo de la casa central hacia el Tauser seleccionado.",
  },
  SALCS: {
    label: "Descarga (Tauser → Casa)",
    descripcion:
      "Devuelve el efectivo disponible del Tauser a la casa central.",
  },
};

const HISTORIAL_TIPOS = [
  { value: "ALL", label: "Todos" },
  { value: "ENTCS", label: "Recargas (Casa → Tauser)" },
  { value: "SALCS", label: "Descargas (Tauser → Casa)" },
];

const formatoMoneda = (monto: string, currency: string) => {
  const value = Number(monto);
  if (Number.isNaN(value)) return monto;
  try {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

const TauserStockModal = ({
  isOpen,
  tauser,
  onClose,
  onSuccess,
}: Props) => {
  const [activeTab, setActiveTab] = useState<"operacion" | "historial">(
    "operacion"
  );
  const [divisas, setDivisas] = useState<Divisa[]>([]);
  const [selectedDivisa, setSelectedDivisa] = useState<number | null>(null);
  const [denominacionesCache, setDenominacionesCache] = useState<
    Record<number, Denominacion[]>
  >({});
  const [loadingDenominaciones, setLoadingDenominaciones] = useState(false);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [resumen, setResumen] = useState<StockResumenResponse | null>(null);
  const [movimientoTipo, setMovimientoTipo] =
    useState<MovimientoTipo>("ENTCS");
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [guardando, setGuardando] = useState(false);

  const [historial, setHistorial] = useState<MovimientoStock[]>([]);
  const [historialTotal, setHistorialTotal] = useState(0);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [histPage, setHistPage] = useState(1);
  const [histFilters, setHistFilters] = useState({
    tipo: "ALL",
    divisa: "ALL",
    fechaDesde: "",
    fechaHasta: "",
  });

  const resetState = () => {
    setActiveTab("operacion");
    setMovimientoTipo("ENTCS");
    setCantidades({});
    setSelectedDivisa(null);
    setHistPage(1);
    setHistFilters({
      tipo: "ALL",
      divisa: "ALL",
      fechaDesde: "",
      fechaHasta: "",
    });
    setResumen(null);
  };

  const closeModal = () => {
    resetState();
    onClose();
  };

  const loadDivisas = async () => {
    try {
      const res = await getDivisas({ page: 1, page_size: 100 });
      setDivisas(res.results);
      if (res.results.length > 0) {
        const firstId = res.results[0].id ?? null;
        setSelectedDivisa(firstId);
      }
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar las divisas.");
    }
  };

  const loadResumen = async () => {
    if (!tauser) return;
    setLoadingResumen(true);
    try {
      const data = await getStockResumen(tauser.id);
      setResumen(data);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo obtener el stock actual.");
    } finally {
      setLoadingResumen(false);
    }
  };

  const loadDenominaciones = async (divisaId: number) => {
    if (denominacionesCache[divisaId]) return;
    setLoadingDenominaciones(true);
    try {
      const data = await getDenominacionesOfDivisa(divisaId);
      setDenominacionesCache((prev) => ({
        ...prev,
        [divisaId]: data,
      }));
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar las denominaciones.");
    } finally {
      setLoadingDenominaciones(false);
    }
  };

  const loadHistorial = async () => {
    if (!tauser) return;
    setHistorialLoading(true);
    try {
      const params: Record<string, any> = {
        tauser: tauser.id,
        page: histPage,
        page_size: HIST_PAGE_SIZE,
        tipo_movimiento:
          histFilters.tipo === "ALL"
            ? "ENTCS,SALCS"
            : histFilters.tipo,
      };

      if (histFilters.divisa !== "ALL") {
        params.divisa = histFilters.divisa;
      }
      if (histFilters.fechaDesde) {
        params.fecha_desde = histFilters.fechaDesde;
      }
      if (histFilters.fechaHasta) {
        params.fecha_hasta = histFilters.fechaHasta;
      }

      const data = await getMovimientosStock(params);
      
      // Manejar tanto respuestas paginadas como arrays directos
      if (Array.isArray(data)) {
        setHistorial(data);
        setHistorialTotal(data.length);
      } else {
        setHistorial(data.results || []);
        setHistorialTotal(data.count || 0);
      }
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cargar el historial de movimientos.");
      setHistorial([]);
      setHistorialTotal(0);
    } finally {
      setHistorialLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !tauser) return;
    resetState();
    loadDivisas();
    loadResumen();
  }, [isOpen, tauser?.id]);

  useEffect(() => {
    if (!isOpen || !tauser || activeTab !== "historial") return;
    loadHistorial();
  }, [
    activeTab,
    histPage,
    histFilters.tipo,
    histFilters.divisa,
    histFilters.fechaDesde,
    histFilters.fechaHasta,
    isOpen,
    tauser?.id,
  ]);

  useEffect(() => {
    if (!selectedDivisa) return;
    void loadDenominaciones(selectedDivisa);
    setCantidades({});
  }, [selectedDivisa]);

  const denominacionesActuales = useMemo(() => {
    if (!selectedDivisa) return [];
    return denominacionesCache[selectedDivisa] ?? [];
  }, [denominacionesCache, selectedDivisa]);

  const detallesPayload = useMemo(
    () =>
      Object.entries(cantidades)
        .map(([denominacionId, cantidad]) => ({
          denominacion: Number(denominacionId),
          cantidad: Number(cantidad),
        }))
        .filter((detalle) => detalle.cantidad > 0),
    [cantidades]
  );

  const totalMovimiento = useMemo(() => {
    return denominacionesActuales.reduce((acc, denominacion) => {
      const denomId = denominacion.id;
      if (!denomId) return acc;
      const cantidad = cantidades[denomId] ?? 0;
      return acc + cantidad * denominacion.denominacion;
    }, 0);
  }, [cantidades, denominacionesActuales]);

  const stockTauserSeleccionado = useMemo(() => {
    if (
      !selectedDivisa ||
      !resumen ||
      !Array.isArray(resumen.tauser?.detalle)
    ) {
      return [];
    }
    return resumen.tauser.detalle.filter(
      (item) => item.divisa_id === selectedDivisa
    );
  }, [resumen, selectedDivisa]);

  const stockCasaSeleccionado = useMemo(() => {
    if (
      !selectedDivisa ||
      !resumen ||
      !Array.isArray(resumen.casa?.detalle)
    ) {
      return [];
    }
    return resumen.casa.detalle.filter(
      (item) => item.divisa_id === selectedDivisa
    );
  }, [resumen, selectedDivisa]);

  const totalFilasStock = useMemo(
    () =>
      Math.max(
        stockTauserSeleccionado.length,
        stockCasaSeleccionado.length
      ),
    [stockTauserSeleccionado, stockCasaSeleccionado]
  );

  const handleCantidadChange = (
    denominacionId: number,
    value: string
  ) => {
    const parsed = Number(value);
    setCantidades((prev) => ({
      ...prev,
      [denominacionId]: Number.isNaN(parsed) ? 0 : parsed,
    }));
  };

  const handleGuardarMovimiento = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tauser || !selectedDivisa) {
      toast.error("Seleccioná un Tauser y una divisa.");
      return;
    }
    if (detallesPayload.length === 0) {
      toast.error("Agregá al menos una denominación con cantidad mayor a 0.");
      return;
    }

    setGuardando(true);
    try {
      await createMovimientoStock({
        tipo_movimiento: movimientoTipo,
        tauser: tauser.id,
        divisa: selectedDivisa,
        detalles: detallesPayload,
      });

      toast.success(
        movimientoTipo === "ENTCS"
          ? "Recarga registrada con éxito."
          : "Descarga registrada con éxito."
      );
      setCantidades({});
      await loadResumen();
      if (activeTab === "historial") {
        await loadHistorial();
      }
      onSuccess?.();
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ??
        error?.response?.data?.non_field_errors ??
        "No se pudo registrar el movimiento.";
      toast.error(
        Array.isArray(detail) ? detail.join(", ") : detail
      );
    } finally {
      setGuardando(false);
    }
  };

  const selectedDivisaInfo = useMemo(
    () => divisas.find((div) => div.id === selectedDivisa) ?? null,
    [divisas, selectedDivisa]
  );

  const renderStockList = (
    title: string,
    items: typeof stockTauserSeleccionado,
    emptyText: string
  ) => (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        {selectedDivisaInfo && (
          <span className="text-xs uppercase tracking-wide text-gray-400">
            {selectedDivisaInfo.codigo}
          </span>
        )}
      </div>
      <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
        {items.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">{emptyText}</p>
        ) : (
          items.map((item) => (
            <div
              key={`${title}-${item.stock_id}`}
              className="flex items-center justify-between px-3 py-2 text-sm text-gray-700"
            >
              <span>
                {item.denominacion_valor.toLocaleString("es-PY")} · Stock
              </span>
              <span className="font-mono text-gray-900">{item.cantidad}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (!tauser) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={closeModal}>
      <div className="w-full max-w-5xl">
        <div className="max-h-[80vh] overflow-y-auto pr-1">
          <div className="sticky top-0 bg-white pb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Gestión de stock — {tauser.nombre} ({tauser.codigo})
            </h2>
            <p className="text-sm text-gray-500">
              Administrá las recargas y descargas del Tauser, y consultá el historial de movimientos.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === "operacion"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setActiveTab("operacion")}
                aria-pressed={activeTab === "operacion"}
              >
                Operar stock
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === "historial"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setActiveTab("historial")}
                aria-pressed={activeTab === "historial"}
              >
                Historial
              </button>
            </div>
          </div>

          <div className="space-y-6 pb-2 pt-4">
          {activeTab === "operacion" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form
              className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm space-y-4"
              onSubmit={handleGuardarMovimiento}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de movimiento
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {(
                    Object.keys(
                      MOVIMIENTO_OPCIONES
                    ) as MovimientoTipo[]
                  ).map((tipo) => (
                    <label
                      key={tipo}
                      className={`border rounded-md p-3 cursor-pointer ${
                        movimientoTipo === tipo
                          ? "border-gray-900 bg-white"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        className="mr-2"
                        checked={movimientoTipo === tipo}
                        onChange={() => setMovimientoTipo(tipo)}
                      />
                      <span className="font-semibold">
                        {MOVIMIENTO_OPCIONES[tipo].label}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        {MOVIMIENTO_OPCIONES[tipo].descripcion}
                      </p>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Divisa
                  </label>
                  <select
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                    value={selectedDivisa ?? ""}
                    onChange={(e) =>
                      setSelectedDivisa(Number(e.target.value))
                    }
                  >
                    {divisas.map((divisa) => (
                      <option key={divisa.id} value={divisa.id}>
                        {divisa.codigo} · {divisa.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Denominaciones
                  </label>
                  {loadingDenominaciones && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Loader2 className="animate-spin" size={14} /> Cargando...
                    </span>
                  )}
                </div>
                <div className="mt-2 max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white/80 p-2">
                  {denominacionesActuales.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500">
                      No hay denominaciones configuradas para esta divisa.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {denominacionesActuales.map((denom) => (
                        <div
                          key={`${denom.id}-${denom.denominacion}`}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
                        >
                          <span className="font-medium text-gray-700">
                            {denom.denominacion.toLocaleString("es-PY")}{" "}
                            {divisas.find(
                              (d) => d.id === denom.divisa_id
                            )?.codigo ?? ""}
                          </span>
                          <input
                            type="number"
                            min={0}
                            className="w-20 rounded-md border border-gray-300 bg-gray-50 px-2 py-1 text-right text-sm focus:border-gray-500 focus:outline-none"
                            value={cantidades[denom.id ?? 0] ?? ""}
                            onChange={(e) =>
                              handleCantidadChange(
                                denom.id ?? 0,
                                e.target.value
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-inner">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Total operación estimado
                  </p>
                  <p className="text-xl font-semibold text-gray-900">
                    {selectedDivisa
                      ? formatoMoneda(
                          totalMovimiento.toString(),
                          divisas.find((d) => d.id === selectedDivisa)?.codigo ??
                            "PYG"
                        )
                      : "—"}
                  </p>
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60"
                  disabled={guardando}
                >
                  {guardando ? "Procesando..." : "Registrar movimiento"}
                </button>
              </div>
            </form>

            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Stock actual
                    </h3>
                    <p className="text-sm text-gray-500">
                      Comparativo entre la casa central y el Tauser.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900"
                    onClick={() => loadResumen()}
                  >
                    Actualizar
                  </button>
                </div>

                {loadingResumen ? (
                  <div className="flex items-center justify-center py-10 text-gray-500">
                    <Loader2 className="mr-2 animate-spin" /> Actualizando stock...
                  </div>
                ) : (
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-gray-500">
                      <span>Divisa seleccionada</span>
                      <span>{selectedDivisaInfo?.codigo ?? "—"}</span>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-gray-100">
                      <div className="grid grid-cols-2 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
                        <div className="px-3 py-2">Tauser</div>
                        <div className="px-3 py-2 text-right">Casa central</div>
                      </div>
                      <div className="max-h-56 overflow-y-auto bg-white">
                        {stockTauserSeleccionado.length === 0 &&
                        stockCasaSeleccionado.length === 0 ? (
                          <p className="p-4 text-sm text-gray-500">
                            Sin registros para la divisa seleccionada.
                          </p>
                        ) : (
                          <div className="divide-y divide-gray-50 text-sm">
                            {Array.from({ length: totalFilasStock }, (_, idx) => (
                              <div
                                key={`stock-row-${idx}`}
                                className="grid grid-cols-2"
                              >
                                <div className="border-r border-gray-50 px-3 py-2">
                                  {stockTauserSeleccionado[idx] ? (
                                    <span className="flex items-center justify-between">
                                      <span className="text-gray-500">
                                        {stockTauserSeleccionado[
                                          idx
                                        ].denominacion_valor.toLocaleString(
                                          "es-PY"
                                        )}
                                        &nbsp;· Stock
                                      </span>
                                      <span className="font-mono text-gray-900">
                                        {stockTauserSeleccionado[idx].cantidad}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-300">—</span>
                                  )}
                                </div>
                                <div className="px-3 py-2 text-right">
                                  {stockCasaSeleccionado[idx] ? (
                                    <span className="flex items-center justify-between text-right">
                                      <span className="text-gray-500">
                                        {stockCasaSeleccionado[
                                          idx
                                        ].denominacion_valor.toLocaleString(
                                          "es-PY"
                                        )}
                                        &nbsp;· Stock
                                      </span>
                                      <span className="font-mono text-gray-900">
                                        {stockCasaSeleccionado[idx].cantidad}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-300">—</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 text-right">
                      Vista simplificada por divisa seleccionada.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {activeTab === "historial" && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-600">Tipo</label>
                <select
                  className="mt-1 w-full border rounded-md px-2 py-1"
                  value={histFilters.tipo}
                  onChange={(e) => {
                    setHistFilters((prev) => ({
                      ...prev,
                      tipo: e.target.value,
                    }));
                    setHistPage(1);
                  }}
                >
                  {HISTORIAL_TIPOS.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Divisa</label>
                <select
                  className="mt-1 w-full border rounded-md px-2 py-1"
                  value={histFilters.divisa}
                  onChange={(e) => {
                    setHistFilters((prev) => ({
                      ...prev,
                      divisa: e.target.value,
                    }));
                    setHistPage(1);
                  }}
                >
                  <option value="ALL">Todas</option>
                  {divisas.map((divisa) => (
                    <option key={divisa.id} value={divisa.id}>
                      {divisa.codigo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Desde</label>
                <input
                  type="date"
                  className="mt-1 w-full border rounded-md px-2 py-1"
                  value={histFilters.fechaDesde}
                  onChange={(e) => {
                    setHistFilters((prev) => ({
                      ...prev,
                      fechaDesde: e.target.value,
                    }));
                    setHistPage(1);
                  }}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Hasta</label>
                <input
                  type="date"
                  className="mt-1 w-full border rounded-md px-2 py-1"
                  value={histFilters.fechaHasta}
                  onChange={(e) => {
                    setHistFilters((prev) => ({
                      ...prev,
                      fechaHasta: e.target.value,
                    }));
                    setHistPage(1);
                  }}
                />
              </div>
            </div>

            {historialLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-500">
                <Loader2 className="animate-spin mr-2" /> Cargando historial...
              </div>
            ) : historial.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                No se encontraron movimientos con los filtros seleccionados.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Divisa
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Detalles
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historial.map((mov) => (
                      <tr key={mov.id}>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {new Date(mov.fecha).toLocaleString("es-PY")}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              mov.tipo_movimiento === "ENTCS"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {mov.tipo_movimiento_detalle.descripcion}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {mov.divisa_detalle?.codigo}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {formatoMoneda(
                            mov.monto,
                            mov.divisa_detalle?.codigo ?? "PYG"
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {!mov.detalles_info || mov.detalles_info.length === 0 ? (
                            <span className="text-xs text-gray-400">
                              Sin detalle registrado
                            </span>
                          ) : (
                            <ul className="text-xs text-gray-600 space-y-1">
                              {mov.detalles_info.map((detalle) => (
                                <li key={detalle.id}>
                                  {detalle.denominacion_detalle?.denominacion?.toLocaleString(
                                    "es-PY"
                                  )}{" "}
                                  · Cant: {detalle.cantidad}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {historial.length > 0 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-gray-600">
                  Página {histPage} de{" "}
                  {Math.max(
                    1,
                    Math.ceil(historialTotal / HIST_PAGE_SIZE)
                  )}
                </p>
                <div className="space-x-2">
                  <button
                    className="px-3 py-1 border rounded-md text-sm"
                    disabled={histPage === 1}
                    onClick={() => setHistPage((prev) => Math.max(1, prev - 1))}
                  >
                    Anterior
                  </button>
                  <button
                    className="px-3 py-1 border rounded-md text-sm"
                    disabled={
                      histPage >=
                      Math.ceil(historialTotal / HIST_PAGE_SIZE)
                    }
                    onClick={() =>
                      setHistPage((prev) => prev + 1)
                    }
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
          )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TauserStockModal;
