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
  { label: string; icon: string }
> = {
  ENTCS: {
    label: "Recarga",
    icon: "↓",
  },
  SALCS: {
    label: "Descarga",
    icon: "↑",
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
      // Filtrar para excluir la divisa base (PYG)
      const divisasDisponibles = res.results.filter(
        (divisa) => divisa.codigo !== "PYG"
      );
      setDivisas(divisasDisponibles);
      if (divisasDisponibles.length > 0) {
        const firstId = divisasDisponibles[0].id ?? null;
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

  if (!tauser) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={closeModal}>
      <div className="w-full max-w-6xl">
        <div className="max-h-[85vh] overflow-y-auto">
          {/* Header compacto */}
          <div className="sticky top-0 bg-white z-10 border-b pb-3 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Stock · {tauser.nombre}
                </h2>
                <p className="text-xs text-gray-500">{tauser.codigo}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                    activeTab === "operacion"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveTab("operacion")}
                >
                  Operar
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                    activeTab === "historial"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveTab("historial")}
                >
                  Historial
                </button>
              </div>
            </div>
          </div>

          {/* Contenido */}
          {activeTab === "operacion" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-1">
            {/* Formulario - más compacto */}
            <form
              className="lg:col-span-2 space-y-4"
              onSubmit={handleGuardarMovimiento}
            >
              {/* Tipo y Divisa en una fila */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Tipo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(MOVIMIENTO_OPCIONES) as MovimientoTipo[]).map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setMovimientoTipo(tipo)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition ${
                          movimientoTipo === tipo
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        <span className="text-lg">{MOVIMIENTO_OPCIONES[tipo].icon}</span>
                        <span>{MOVIMIENTO_OPCIONES[tipo].label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Divisa
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    value={selectedDivisa ?? ""}
                    onChange={(e) => setSelectedDivisa(Number(e.target.value))}
                  >
                    {divisas.map((divisa) => (
                      <option key={divisa.id} value={divisa.id}>
                        {divisa.codigo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Denominaciones */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-700">
                    Denominaciones
                  </label>
                  {loadingDenominaciones && (
                    <Loader2 className="animate-spin text-gray-400" size={14} />
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2">
                  {denominacionesActuales.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 text-center">
                      Sin denominaciones
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {denominacionesActuales.map((denom) => (
                        <div
                          key={denom.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-200"
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {denom.denominacion.toLocaleString("es-PY")}
                          </span>
                          <input
                            type="number"
                            min={0}
                            placeholder="0"
                            className="w-16 rounded-md border border-gray-300 px-2 py-1 text-right text-sm focus:ring-1 focus:ring-gray-900 focus:border-transparent"
                            value={cantidades[denom.id ?? 0] ?? ""}
                            onChange={(e) =>
                              handleCantidadChange(denom.id ?? 0, e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Total y botón */}
              <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg px-4 py-3 border border-gray-200">
                <div>
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedDivisa
                      ? formatoMoneda(
                          totalMovimiento.toString(),
                          divisas.find((d) => d.id === selectedDivisa)?.codigo ?? "PYG"
                        )
                      : "—"}
                  </p>
                </div>
                <button
                  type="submit"
                  className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                  disabled={guardando || detallesPayload.length === 0}
                >
                  {guardando ? "Procesando..." : "Registrar"}
                </button>
              </div>
            </form>

            {/* Stock actual - más compacto */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Stock Actual
                  </h3>
                  <button
                    type="button"
                    className="text-xs text-gray-600 hover:text-gray-900 font-medium"
                    onClick={() => loadResumen()}
                  >
                    ↻ Actualizar
                  </button>
                </div>

                {loadingResumen ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <Loader2 className="animate-spin" size={20} />
                  </div>
                ) : (
                  <div>
                    <div className="text-xs text-gray-500 mb-2">
                      {selectedDivisaInfo?.codigo ?? "—"}
                    </div>
                    <div className="space-y-2">
                      <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-1">Tauser</p>
                        {stockTauserSeleccionado.length === 0 ? (
                          <p className="text-xs text-gray-400">Sin stock</p>
                        ) : (
                          <div className="space-y-1">
                            {stockTauserSeleccionado.map((item) => (
                              <div key={item.stock_id} className="flex justify-between text-xs">
                                <span className="text-gray-600">
                                  {item.denominacion_valor.toLocaleString("es-PY")}
                                </span>
                                <span className="font-mono font-medium">{item.cantidad}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-1">Casa</p>
                        {stockCasaSeleccionado.length === 0 ? (
                          <p className="text-xs text-gray-400">Sin stock</p>
                        ) : (
                          <div className="space-y-1">
                            {stockCasaSeleccionado.map((item) => (
                              <div key={item.stock_id} className="flex justify-between text-xs">
                                <span className="text-gray-600">
                                  {item.denominacion_valor.toLocaleString("es-PY")}
                                </span>
                                <span className="font-mono font-medium">{item.cantidad}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {activeTab === "historial" && (
          <div className="px-1">
            {/* Filtros compactos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <select
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                value={histFilters.tipo}
                onChange={(e) => {
                  setHistFilters((prev) => ({ ...prev, tipo: e.target.value }));
                  setHistPage(1);
                }}
              >
                {HISTORIAL_TIPOS.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
              
              <select
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                value={histFilters.divisa}
                onChange={(e) => {
                  setHistFilters((prev) => ({ ...prev, divisa: e.target.value }));
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
              
              <input
                type="date"
                placeholder="Desde"
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                value={histFilters.fechaDesde}
                onChange={(e) => {
                  setHistFilters((prev) => ({ ...prev, fechaDesde: e.target.value }));
                  setHistPage(1);
                }}
              />
              
              <input
                type="date"
                placeholder="Hasta"
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                value={histFilters.fechaHasta}
                onChange={(e) => {
                  setHistFilters((prev) => ({ ...prev, fechaHasta: e.target.value }));
                  setHistPage(1);
                }}
              />
            </div>

            {historialLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <Loader2 className="animate-spin mr-2" size={20} />
                <span className="text-sm">Cargando...</span>
              </div>
            ) : historial.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">Sin movimientos</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                          Fecha
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                          Tipo
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                          Monto
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                          Detalles
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {historial.map((mov) => (
                        <tr key={mov.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">
                            {new Date(mov.fecha).toLocaleDateString("es-PY", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                mov.tipo_movimiento === "ENTCS"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              <span>{mov.tipo_movimiento === "ENTCS" ? "↓" : "↑"}</span>
                              <span>{mov.tipo_movimiento === "ENTCS" ? "Recarga" : "Descarga"}</span>
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs">
                            <div className="font-medium text-gray-900">
                              {formatoMoneda(mov.monto, mov.divisa_detalle?.codigo ?? "PYG")}
                            </div>
                            <div className="text-gray-500">{mov.divisa_detalle?.codigo}</div>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600">
                            {!mov.detalles_info || mov.detalles_info.length === 0 ? (
                              <span className="text-gray-400">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {mov.detalles_info.map((detalle) => (
                                  <span
                                    key={detalle.id}
                                    className="inline-flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded"
                                  >
                                    <span className="font-medium">
                                      {detalle.denominacion_detalle?.denominacion?.toLocaleString("es-PY")}
                                    </span>
                                    <span className="text-gray-500">×{detalle.cantidad}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación compacta */}
                {historialTotal > HIST_PAGE_SIZE && (
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-600">
                      Pág. {histPage} de {Math.ceil(historialTotal / HIST_PAGE_SIZE)}
                    </p>
                    <div className="flex gap-1">
                      <button
                        className="px-3 py-1 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={histPage === 1}
                        onClick={() => setHistPage((prev) => Math.max(1, prev - 1))}
                      >
                        ← Ant
                      </button>
                      <button
                        className="px-3 py-1 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={histPage >= Math.ceil(historialTotal / HIST_PAGE_SIZE)}
                        onClick={() => setHistPage((prev) => prev + 1)}
                      >
                        Sig →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </Modal>
  );
};

export default TauserStockModal;
