import { useEffect, useMemo, useState } from "react";
import type { TransaccionDetalle } from "../../operaciones/types/Transaccion";
import type { Denominacion } from "../../divisas/types/Divisa";
import type { SelectedTauser } from "../store/useSelectedTauser";
import {
  cancelarTransaccionTauser,
  getTauserDenominaciones,
  recibirEfectivoTauser,
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
};

export function ProcesarCompra({ transaccion, tauser, onCancelar, onProcesada, onCancelada }: Props) {
  const [denominaciones, setDenominaciones] = useState<Denominacion[]>([]);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cambioTasa, setCambioTasa] = useState<CambioPayload | null>(null);

  const montoEsperado = Number(transaccion.monto_origen);

  useEffect(() => {
    const fetchDenominaciones = async () => {
      setLoading(true);
      try {
        const divisaId =
          !transaccion.divisa_origen_detalle?.es_base && transaccion.divisa_origen
            ? transaccion.divisa_origen
            : transaccion.divisa_destino;
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
  }, [transaccion.divisa_destino, transaccion.divisa_origen, transaccion.divisa_origen_detalle?.es_base]);

  const totalRecibido = useMemo(() => {
    return Object.entries(cantidades).reduce((acc, [denominacionId, cantidad]) => {
      const denominacion = denominaciones.find((d) => d.id === Number(denominacionId));
      if (!denominacion) return acc;
      return acc + Number(denominacion.denominacion) * Number(cantidad);
    }, 0);
  }, [cantidades, denominaciones]);

  const diferencia = totalRecibido - montoEsperado;

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

  const ejecutarRecibo = async (aceptaCambio?: boolean) => {
    if (!detallePayload.length) {
      toast.warning("Ingresa al menos una denominación.");
      return;
    }
    if (diferencia !== 0) {
      toast.warning("Las denominaciones no coinciden con el monto esperado.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        tauser: tauser.id,
        detalles: detallePayload,
        ...(aceptaCambio ? { acepta_cambio: true } : {}),
      };
      const res = await recibirEfectivoTauser(transaccion.id, payload);
      toast.success("Efectivo recibido correctamente.");
      onProcesada(res.data);
    } catch (error: any) {
      if (error?.response?.status === 409) {
        setCambioTasa(error.response.data);
        return;
      }
      console.error(error);
      toast.error("No se pudo registrar la recepción del efectivo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelarPorCambio = async () => {
    try {
      await cancelarTransaccionTauser(transaccion.id);
      toast.info("Transacción cancelada por cambio de tasa.");
      setCambioTasa(null);
      onCancelada();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cancelar la transacción.");
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

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/90 rounded-3xl shadow-xl p-8">
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Recepción de efectivo</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Ingresa las denominaciones recibidas del cliente para completar la operación.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {denominaciones.map((den) => (
          <div
            key={den.id}
            className="border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-3 bg-[var(--card)]"
          >
            <div className="text-sm text-[var(--muted-foreground)]">Denominación</div>
            <div className="text-2xl font-semibold text-[var(--foreground)]">
              {Number(den.denominacion).toLocaleString()}
            </div>
            <input
              type="number"
              min={0}
              value={cantidades[den.id] ?? 0}
              onChange={(event) =>
                setCantidades((prev) => ({
                  ...prev,
                  [den.id]: Math.max(0, Number(event.target.value)),
                }))
              }
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-center"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <SummaryCard
          title="Monto esperado"
          value={`${montoEsperado.toLocaleString()} ${transaccion.divisa_origen_detalle?.codigo ?? ""}`}
        />
        <SummaryCard
          title="Total ingresado"
          value={`${totalRecibido.toLocaleString()} ${transaccion.divisa_origen_detalle?.codigo ?? ""}`}
        />
        <SummaryCard
          title="Diferencia"
          value={`${diferencia.toLocaleString()} ${transaccion.divisa_origen_detalle?.codigo ?? ""}`}
          highlight={diferencia === 0 ? "success" : "warning"}
        />
      </div>

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
          Confirmar recepción
        </button>
      </div>

      {cambioTasa && (
        <CambioTasaModal
          payload={cambioTasa}
          onCancel={handleCancelarPorCambio}
          onAccept={() => {
            setCambioTasa(null);
            ejecutarRecibo(true);
          }}
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
      <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)] mb-1">
        {title}
      </div>
      <div className={`text-xl font-semibold ${highlightClasses}`}>{value}</div>
    </div>
  );
}

type CambioTasaModalProps = {
  payload: CambioPayload;
  onAccept: () => void;
  onCancel: () => void;
};

function CambioTasaModal({ payload, onAccept, onCancel }: CambioTasaModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <h3 className="text-xl font-semibold text-[var(--foreground)]">
          La cotización cambió
        </h3>
        <p className="text-sm text-[var(--muted-foreground)]">{payload.mensaje}</p>
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
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-2xl border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition"
          >
            Cancelar operación
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
