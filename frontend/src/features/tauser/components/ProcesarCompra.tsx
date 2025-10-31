import { useEffect, useMemo, useState } from "react";
import type { TransaccionDetalle } from "../../operaciones/types/Transaccion";
import type { Denominacion } from "../../divisas/types/Divisa";
import type { SelectedTauser } from "../store/useSelectedTauser";
import {
  actualizarReconfirmacionTauser,
  cancelarTransaccionTauser,
  getTauserDenominaciones,
  recibirEfectivoTauser,
  reconfirmarTasaTauser,
} from "../services/tauserTerminalService";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

type Props = {
  transaccion: TransaccionDetalle;
  tauser: SelectedTauser;
  onCancelar: () => void;
  onProcesada: (transaccionActualizada: TransaccionDetalle) => void;
  onCancelada: () => void;
};

type CambioPayload = {
  mensaje?: string;
  tasa_anterior: string;
  tasa_actual: string;
  monto_destino_anterior: string;
  monto_destino_actual: string;
  delta_tc?: string;
  delta_pct?: string;
};

type CambioState = {
  fuente: "reconfirmacion" | "recepcion";
  payload: CambioPayload;
};

export function ProcesarCompra({ transaccion, tauser, onCancelar, onProcesada, onCancelada }: Props) {
  const [transaccionDetalle, setTransaccionDetalle] = useState<TransaccionDetalle>(transaccion);
  const [denominaciones, setDenominaciones] = useState<Denominacion[]>([]);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cambioTasa, setCambioTasa] = useState<CambioState | null>(null);

  useEffect(() => {
    setTransaccionDetalle(transaccion);
  }, [transaccion]);

  const requiereRecepcion = transaccionDetalle.estado === "pendiente";

  useEffect(() => {
    if (!requiereRecepcion) {
      setDenominaciones([]);
      setLoading(false);
      return;
    }

    const fetchDenominaciones = async () => {
      setLoading(true);
      try {
        const divisaId =
          !transaccionDetalle.divisa_origen_detalle?.es_base && transaccionDetalle.divisa_origen
            ? transaccionDetalle.divisa_origen
            : transaccionDetalle.divisa_destino;
        const res = await getTauserDenominaciones(divisaId);
        setDenominaciones(
          (res.data ?? []).sort((a, b) => Number(b.denominacion) - Number(a.denominacion))
        );
      } catch (error) {
        console.error(error);
        toast.error("No se pudieron cargar las denominaciones.");
      } finally {
        setLoading(false);
      }
    };

    fetchDenominaciones();
  }, [
    requiereRecepcion,
    transaccionDetalle.divisa_destino,
    transaccionDetalle.divisa_origen,
    transaccionDetalle.divisa_origen_detalle?.es_base,
  ]);

  useEffect(() => {
    setCantidades({});
    setCambioTasa(null);
  }, [transaccionDetalle.id, requiereRecepcion]);

  const montoEsperado = Number(transaccionDetalle.monto_origen);
  const montoBaseEntregado = Number(transaccionDetalle.monto_destino);
  const divisaExtranjeraDetalle = useMemo(
    () =>
      !transaccionDetalle.divisa_origen_detalle?.es_base
        ? transaccionDetalle.divisa_origen_detalle
        : transaccionDetalle.divisa_destino_detalle,
    [transaccionDetalle.divisa_destino_detalle, transaccionDetalle.divisa_origen_detalle]
  );
  const divisaExtranjeraCodigo = divisaExtranjeraDetalle?.codigo ?? "";
  const divisaBaseCodigo =
    transaccionDetalle.divisa_destino_detalle?.codigo ??
    transaccionDetalle.divisa_origen_detalle?.codigo ??
    "";
  const metodoFinancieroNombre = transaccionDetalle.metodo_financiero_detalle?.nombre ?? "";
  const metodoFinancieroLegible = metodoFinancieroNombre
    ? metodoFinancieroNombre.replace(/_/g, " ").toLowerCase()
    : "metodo financiero asignado";

  const totalRecibido = useMemo(() => {
    return Object.entries(cantidades).reduce((acc, [denominacionId, cantidad]) => {
      const denominacion = denominaciones.find((d) => d.id === Number(denominacionId));
      if (!denominacion) {
        return acc;
      }
      return acc + Number(denominacion.denominacion) * Number(cantidad);
    }, 0);
  }, [cantidades, denominaciones]);

  const diferencia = totalRecibido - montoEsperado;

  const denominacionesConId = useMemo(
    () =>
      denominaciones.filter(
        (den): den is Denominacion & { id: number } => typeof den.id === "number"
      ),
    [denominaciones]
  );

  const detallePayload = useMemo(
    () =>
      Object.entries(cantidades)
        .filter(([, cantidad]) => Number(cantidad) > 0)
        .map(([denominacion, cantidad]) => ({
          denominacion: Number(denominacion),
          cantidad: Number(cantidad),
        })),
    [cantidades]
  );

  const buildCambioPayload = (
    data: Partial<CambioPayload> & { mensaje?: string }
  ): CambioPayload => ({
    mensaje: data.mensaje,
    tasa_anterior: data.tasa_anterior ?? String(transaccionDetalle.tasa_aplicada),
    tasa_actual: data.tasa_actual ?? String(transaccionDetalle.tasa_aplicada),
    monto_destino_anterior:
      data.monto_destino_anterior ?? String(transaccionDetalle.monto_destino),
    monto_destino_actual:
      data.monto_destino_actual ?? String(transaccionDetalle.monto_destino),
    delta_tc: data.delta_tc,
    delta_pct: data.delta_pct,
  });

  const verificarCambioDeTasa = async () => {
    if (!requiereRecepcion) {
      return true;
    }

    try {
      const res = await reconfirmarTasaTauser(transaccionDetalle.id);
      const data = res.data ?? res;
      if (data?.cambio) {
        const payload = buildCambioPayload({
          ...data,
          mensaje:
            data.mensaje ??
            "La cotizacion cambiA3 desde la ultima consulta. Acepta para actualizar los montos.",
        });
        setCambioTasa({ fuente: "reconfirmacion", payload });
        return false;
      }
      return true;
    } catch (error) {
      console.error(error);
      toast.error("No se pudo validar la cotizacion.");
      return false;
    }
  };

  const ejecutarRecibo = async ({
    aceptaCambio = false,
    omitirReconfirmacion = false,
  }: { aceptaCambio?: boolean; omitirReconfirmacion?: boolean } = {}) => {
    if (!detallePayload.length) {
      toast.warning("Ingresa al menos una denominacion.");
      return;
    }
    if (diferencia !== 0) {
      toast.warning("Las denominaciones no coinciden con el monto esperado.");
      return;
    }

    if (!omitirReconfirmacion) {
      const puedeContinuar = await verificarCambioDeTasa();
      if (!puedeContinuar) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        tauser: tauser.id,
        detalles: detallePayload,
        ...(aceptaCambio ? { acepta_cambio: true } : {}),
      };
      const res = await recibirEfectivoTauser(transaccionDetalle.id, payload);
      const data = res.data ?? res;
      toast.success("Efectivo recibido correctamente.");
      onProcesada(data);
    } catch (error: any) {
      if (error?.response?.status === 409) {
        const data = error.response.data ?? {};
        const payload = buildCambioPayload({
          ...data,
          mensaje:
            data.mensaje ??
            "La cotizacion cambiA3 antes de confirmar la recepcion. Debes aceptar la nueva tasa para continuar.",
        });
        setCambioTasa({ fuente: "recepcion", payload });
        return;
      }
      console.error(error);
      toast.error("No se pudo registrar la recepcion del efectivo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAceptarCambio = async () => {
    if (!cambioTasa) return;

    if (cambioTasa.fuente === "reconfirmacion") {
      try {
        const res = await actualizarReconfirmacionTauser(transaccionDetalle.id, {
          tasa_actual: Number(cambioTasa.payload.tasa_actual),
          monto_destino_actual: Number(cambioTasa.payload.monto_destino_actual),
        });
        const data = res.data ?? res;
        setTransaccionDetalle(data);
        setCambioTasa(null);
        toast.info("Se actualizo la cotizacion. Revisa los montos antes de confirmar.");
      } catch (error) {
        console.error(error);
        toast.error("No se pudo actualizar la cotizacion.");
      }
      return;
    }

    setCambioTasa(null);
    ejecutarRecibo({ aceptaCambio: true, omitirReconfirmacion: true });
  };

  const handleCancelarPorCambio = async () => {
    try {
      await cancelarTransaccionTauser(transaccionDetalle.id);
      toast.info("Transaccion cancelada por cambio de tasa.");
      setCambioTasa(null);
      onCancelada();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cancelar la transaccion.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
        <p className="text-sm text-[var(--muted-foreground)]">Cargando denominaciones...</p>
      </div>
    );
  }

  if (!requiereRecepcion) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-white/90 rounded-3xl shadow-xl p-8 space-y-6">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">Pago en proceso</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            El efectivo en divisa extranjera ya fue registrado para esta operacion. ConfirmA! que la
            casa transfirio{" "}
            <strong>
              {montoBaseEntregado.toLocaleString()} {divisaBaseCodigo}
            </strong>{" "}
            mediante el {metodoFinancieroLegible}.
          </p>
        </header>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--accent)]/60 p-4 space-y-2 text-sm text-[var(--foreground)]">
          <p>
            Cliente entrego:{" "}
            <strong>
              {montoEsperado.toLocaleString()} {divisaExtranjeraCodigo}
            </strong>
          </p>
          <p>
            Pago pendiente al cliente:{" "}
            <strong>
              {montoBaseEntregado.toLocaleString()} {divisaBaseCodigo}
            </strong>
          </p>
          <p>
            Metodo seleccionado: <strong>{metodoFinancieroLegible}</strong>
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4">
          <button
            onClick={onCancelar}
            className="px-5 py-3 rounded-2xl border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition"
          >
            Volver
          </button>
          <button
            onClick={() => onProcesada(transaccionDetalle)}
            className="px-6 py-3 rounded-2xl bg-[var(--primary)] text-white font-semibold flex items-center justify-center gap-2"
          >
            Continuar con la confirmacion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/90 rounded-3xl shadow-xl p-8 space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Proceso Pago</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          El cliente entrega{" "}
          <strong>
            {montoEsperado.toLocaleString()} {divisaExtranjeraCodigo}
          </strong>{" "}
          en divisa extranjera. Al confirmar se registrara el movimiento ENTCLT y la casa enviara{" "}
          <strong>
            {montoBaseEntregado.toLocaleString()} {divisaBaseCodigo}
          </strong>{" "}
          mediante el {metodoFinancieroLegible}.
        </p>
      </header>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">1. Divisa extranjera recibida</h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          Completa las cantidades por denominacion hasta alcanzar{" "}
          <strong>
            {montoEsperado.toLocaleString()} {divisaExtranjeraCodigo}
          </strong>
          .
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {denominacionesConId.map((den) => {
            const denId = den.id!;
            return (
              <div
                key={denId}
                className="border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-3 bg-[var(--card)]"
              >
                <div className="text-sm text-[var(--muted-foreground)]">Denominacion</div>
                <div className="text-2xl font-semibold text-[var(--foreground)]">
                  {Number(den.denominacion).toLocaleString()}
                </div>
                <input
                  type="number"
                  min={0}
                  value={cantidades[denId] ?? 0}
                  onChange={(event) =>
                    setCantidades((prev) => ({
                      ...prev,
                      [denId]: Math.max(0, Number(event.target.value)),
                    }))
                  }
                  className="w-full border border-[var(--border)] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-center"
                />
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">2. Validacion del conteo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard title="Monto esperado" value={`${montoEsperado.toLocaleString()} ${divisaExtranjeraCodigo}`} />
          <SummaryCard title="Total ingresado" value={`${totalRecibido.toLocaleString()} ${divisaExtranjeraCodigo}`} />
          <SummaryCard
            title="Diferencia"
            value={`${diferencia.toLocaleString()} ${divisaExtranjeraCodigo}`}
            highlight={diferencia === 0 ? "success" : "warning"}
          />
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          La diferencia debe ser cero para generar el movimiento de stock y continuar con el pago al cliente.
        </p>
      </section>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <button
          onClick={onCancelar}
          className="px-5 py-3 rounded-2xl border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition"
        >
          Volver
        </button>
        <button
          onClick={() => ejecutarRecibo()}
          disabled={submitting || detallePayload.length === 0 || diferencia !== 0}
          className="px-6 py-3 rounded-2xl bg-[var(--primary)] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Confirmar recepcion
        </button>
      </div>

      {cambioTasa && (
        <CambioTasaModal
          cambio={cambioTasa}
          onCancel={handleCancelarPorCambio}
          onAccept={handleAceptarCambio}
        />
      )}
    </div>
  );
}

type SummaryCardProps = {
  title: string;
  value: string;
  highlight?: "success" | "warning";
};

function SummaryCard({ title, value, highlight }: SummaryCardProps) {
  const highlightClasses =
    highlight === "success"
      ? "text-green-600"
      : highlight === "warning"
        ? "text-amber-600"
        : "text-[var(--foreground)]";
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
      <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)] mb-1">{title}</div>
      <div className={`text-xl font-semibold ${highlightClasses}`}>{value}</div>
    </div>
  );
}

type CambioTasaModalProps = {
  cambio: CambioState;
  onAccept: () => void;
  onCancel: () => void;
};

function CambioTasaModal({ cambio, onAccept, onCancel }: CambioTasaModalProps) {
  const { payload, fuente } = cambio;
  const mensaje =
    payload.mensaje ??
    (fuente === "reconfirmacion"
      ? "La cotizacion cambiA3 desde la ultima consulta."
      : "La cotizacion cambiA3 al confirmar la recepcion.");
  const deltaPctValue =
    payload.delta_pct !== undefined && payload.delta_pct !== null
      ? Number(payload.delta_pct)
      : null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <h3 className="text-xl font-semibold text-[var(--foreground)]">La cotizacion cambio</h3>
        <p className="text-sm text-[var(--muted-foreground)]">{mensaje}</p>
        <div className="rounded-2xl bg-[var(--accent)]/60 p-4 space-y-2 text-sm">
          <p>
            Tasa anterior: <strong>{payload.tasa_anterior}</strong>
          </p>
          <p>
            Nueva tasa: <strong>{payload.tasa_actual}</strong>
          </p>
          <p>
            Monto destino previo: <strong>{payload.monto_destino_anterior}</strong>
          </p>
          <p>
            Nuevo monto destino: <strong>{payload.monto_destino_actual}</strong>
          </p>
          {deltaPctValue !== null && Number.isFinite(deltaPctValue) && (
            <p>
              Variacion: <strong>{deltaPctValue.toFixed(4)}%</strong>
            </p>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-2xl border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition"
          >
            Cancelar operacion
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-4 py-3 rounded-2xl bg-[var(--primary)] text-white font-semibold"
          >
            Aceptar nueva tasa
          </button>
        </div>
      </div>
    </div>
  );
}
