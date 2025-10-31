import { useEffect, useMemo, useRef, useState } from "react";
import type { TransaccionDetalle } from "../../operaciones/types/Transaccion";
import type { SelectedTauser } from "../store/useSelectedTauser";
import {
  actualizarReconfirmacionTauser,
  cancelarTransaccionTauser,
  completarTransaccionTauser,
  crearChequeTauser,
  entregarMetalicoTauser,
  getTauserBancos,
  reconfirmarTasaTauser,
  type Banco,
} from "../services/tauserTerminalService";
import { Loader2, BanknoteArrowDown } from "lucide-react";
import { toast } from "react-toastify";

type Props = {
  transaccion: TransaccionDetalle;
  tauser: SelectedTauser;
  onCancelar: () => void;
  onProcesada: (transaccionActualizada: TransaccionDetalle) => void;
  onCancelada: () => void;
};

export function ProcesarVenta({ transaccion, tauser, onCancelar, onProcesada, onCancelada }: Props) {
  const metodoNombre = useMemo(
    () => transaccion.metodo_financiero_detalle?.nombre ?? null,
    [transaccion.metodo_financiero_detalle]
  );
  const requiereCheque = metodoNombre === "CHEQUE";
  const esBaseToForeign = useMemo(
    () =>
      Boolean(transaccion.divisa_origen_detalle?.es_base) &&
      !transaccion.divisa_destino_detalle?.es_base,
    [transaccion.divisa_destino_detalle?.es_base, transaccion.divisa_origen_detalle?.es_base]
  );

  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loadingBancos, setLoadingBancos] = useState(true);
  const [registrandoCheque, setRegistrandoCheque] = useState(false);
  const [procesandoEntrega, setProcesandoEntrega] = useState(false);
  const [chequeRegistrado, setChequeRegistrado] = useState(!requiereCheque);
  const [cambioTasa, setCambioTasa] = useState<Record<string, string> | null>(null);
  const [animatingEntrega, setAnimatingEntrega] = useState(false);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({
    numero: "",
    banco_emisor: "",
    titular: transaccion.cliente_detalle?.nombre ?? "",
  });

  useEffect(() => {
    setForm({
      numero: "",
      banco_emisor: "",
      titular: transaccion.cliente_detalle?.nombre ?? "",
    });
    setChequeRegistrado(!requiereCheque || transaccion.estado !== "pendiente");
  }, [transaccion.id, transaccion.cliente_detalle?.nombre, requiereCheque, transaccion.estado]);

  useEffect(() => {
    if (!requiereCheque) {
      setLoadingBancos(false);
      return;
    }

    const fetchBancos = async () => {
      try {
        const bancosData = await getTauserBancos();
        setBancos(bancosData);
      } catch (error) {
        console.error(error);
        toast.error("No se pudieron cargar los bancos.");
      } finally {
        setLoadingBancos(false);
      }
    };
    fetchBancos();
  }, [requiereCheque]);

  useEffect(() => {
    setAnimatingEntrega(false);
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
  }, [transaccion.id]);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const handleRegistrarCheque = async () => {
    if (!requiereCheque) {
      setChequeRegistrado(true);
      return;
    }

    if (!form.numero || !form.banco_emisor || !form.titular) {
      toast.warning("Completa todos los campos del cheque.");
      return;
    }

    setRegistrandoCheque(true);
    try {
      await crearChequeTauser({
        cliente: String(transaccion.cliente),
        transaccion: transaccion.id,
        banco_emisor: Number(form.banco_emisor),
        titular: form.titular,
        numero: form.numero.padStart(8, "0"),
        tipo: "NORMAL",
        monto: Number(transaccion.monto_origen),
        divisa: "PYG",
        observaciones: `Transaccion ${transaccion.id}`,
      });
      toast.success("Cheque registrado correctamente.");
      setChequeRegistrado(true);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.detail ?? "No se pudo registrar el cheque.");
    } finally {
      setRegistrandoCheque(false);
    }
  };

  const verificarCambioDeTasa = async () => {
    try {
      const res = await reconfirmarTasaTauser(transaccion.id);
      if (res.data?.cambio) {
        setCambioTasa(res.data);
        return false;
      }
      return true;
    } catch (error) {
      console.error(error);
      toast.error("No se pudo validar la cotizacion.");
      return false;
    }
  };

  const aceptarCambioTasa = async () => {
    if (!cambioTasa) return;
    try {
      await actualizarReconfirmacionTauser(transaccion.id, {
        tasa_actual: Number(cambioTasa.tasa_actual),
        monto_destino_actual: Number(cambioTasa.monto_destino_actual),
      });
      setCambioTasa(null);
      procesarEntrega();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar la cotizacion.");
    }
  };

  const cancelarPorCambio = async () => {
    try {
      await cancelarTransaccionTauser(transaccion.id);
      toast.info("Transaccion cancelada por cambio de tasa.");
      setCambioTasa(null);
      onCancelada();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cancelar la transaccion.");
    }
  };

  const procesarEntrega = async () => {
    if (procesandoEntrega || animatingEntrega) {
      return;
    }

    if (requiereCheque && !chequeRegistrado) {
      toast.warning("Registra el cheque antes de entregar metalico.");
      return;
    }

    const puedeContinuar = await verificarCambioDeTasa();
    if (!puedeContinuar) return;

    setProcesandoEntrega(true);

    let entregaData: TransaccionDetalle | null = null;

    try {
      const resEntrega = await entregarMetalicoTauser(transaccion.id, { tauser: tauser.id });
      entregaData = resEntrega.data ?? null;
    } catch (error: any) {
      console.error(error);
      const data = error?.response?.data;
      const detalle = data?.transaccion?.[0] ?? data?.detail ?? data?.error;
      const mensaje = typeof detalle === "string" ? detalle.toLowerCase() : "";

      if (mensaje.includes("movimiento de stock")) {
        entregaData = transaccion;
      } else {
        toast.error("No se pudo registrar la entrega.");
        setProcesandoEntrega(false);
        return;
      }
    }

    let transaccionFinal: TransaccionDetalle = entregaData ?? transaccion;

    try {
      const resCompletar = await completarTransaccionTauser(transaccion.id);
      if (resCompletar?.data) {
        transaccionFinal = resCompletar.data;
      }
    } catch (error) {
      console.error(error);
      toast.error("No se pudo finalizar la operacion.");
      setProcesandoEntrega(false);
      return;
    }

    toast.success("Operacion finalizada.");

    if (esBaseToForeign) {
      setProcesandoEntrega(false);
      setAnimatingEntrega(true);
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      const finalData = transaccionFinal;
      animationTimeoutRef.current = setTimeout(() => {
        setAnimatingEntrega(false);
        animationTimeoutRef.current = null;
        onProcesada(finalData);
      }, 3000);
      return;
    }

    setProcesandoEntrega(false);
    onProcesada(transaccionFinal);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white/90 rounded-3xl shadow-xl p-8 space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Proceso Retiro</h2>
      </header>

      {requiereCheque ? (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">1. Datos del cheque</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm text-[var(--muted-foreground)] mb-1">
                Banco emisor
              </label>
              <select
                value={form.banco_emisor}
                disabled={chequeRegistrado || loadingBancos}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    banco_emisor: event.target.value,
                  }))
                }
                className="w-full border border-[var(--border)] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="">Selecciona un banco</option>
                {bancos.map((banco) => (
                  <option key={banco.id} value={banco.id}>
                    {banco.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--muted-foreground)] mb-1">
                  Numero de cheque
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={form.numero}
                  disabled={chequeRegistrado}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, numero: event.target.value.replace(/\D/g, "") }))
                  }
                  className="w-full border border-[var(--border)] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted-foreground)] mb-1">
                  Titular
                </label>
                <input
                  type="text"
                  value={form.titular}
                  disabled={chequeRegistrado}
                  onChange={(event) => setForm((prev) => ({ ...prev, titular: event.target.value }))}
                  className="w-full border border-[var(--border)] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>
          </div>

          {!chequeRegistrado && (
            <button
              onClick={handleRegistrarCheque}
              disabled={registrandoCheque || !form.numero || !form.banco_emisor || !form.titular}
              className="w-full md:w-auto px-6 py-3 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registrandoCheque && <Loader2 className="w-4 h-4 animate-spin" />}
              Registrar cheque
            </button>
          )}

          {chequeRegistrado && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Cheque registrado correctamente.
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--accent)]/60 px-4 py-3 text-sm text-[var(--foreground)]">
          Esta operacion ya fue cobrada mediante {" "}
          <strong>{metodoNombre ? metodoNombre.replace(/_/g, " ").toLowerCase() : "otro metodo electronico"}</strong>.
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">2. Entrega de efectivo</h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          Monto a recibir:{" "}
          <strong>
            {Number(transaccion.monto_destino).toLocaleString()} {transaccion.divisa_destino_detalle?.codigo}
          </strong>
        </p>
        {esBaseToForeign ? (
          <div className="flex flex-col items-center gap-6 pt-4">
            <CashIllustration className="w-48 h-32 text-[var(--primary)]" />
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={procesarEntrega}
                disabled={(requiereCheque && !chequeRegistrado) || procesandoEntrega || animatingEntrega}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-xl transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Entregar efectivo"
              >
                {procesandoEntrega ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : (
                  <BanknoteArrowDown
                    className={`w-12 h-12 ${animatingEntrega ? "cash-withdrawal-icon" : ""}`}
                  />
                )}
              </button>
              <span className="text-sm text-center text-[var(--muted-foreground)]">
                {animatingEntrega ? "Entregando efectivo..." : "Toque para entregar el efectivo"}
              </span>
            </div>
            <button
              onClick={onCancelar}
              className="px-5 py-3 rounded-2xl border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition"
              disabled={animatingEntrega}
            >
              Volver
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={onCancelar}
              className="px-5 py-3 rounded-2xl border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition"
            >
              Volver
            </button>
            <button
              onClick={procesarEntrega}
              disabled={(requiereCheque && !chequeRegistrado) || procesandoEntrega}
              className="px-6 py-3 rounded-2xl bg-[var(--primary)] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {procesandoEntrega && <Loader2 className="w-4 h-4 animate-spin" />}
              Entregar efectivo
            </button>
          </div>
        )}
      </section>

      {cambioTasa && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-[var(--foreground)]">La cotizacion cambio</h3>
            <div className="rounded-2xl bg-[var(--accent)]/60 p-4 space-y-2 text-sm">
              <p>
                Tasa anterior: <strong>{cambioTasa.tasa_anterior}</strong>
              </p>
              <p>
                Nueva tasa: <strong>{cambioTasa.tasa_actual}</strong>
              </p>
              <p>
                Monto actual: <strong>{cambioTasa.monto_destino_actual}</strong>
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={cancelarPorCambio}
                className="flex-1 px-4 py-3 rounded-2xl border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition"
              >
                Cancelar
              </button>
              <button
                onClick={aceptarCambioTasa}
                className="flex-1 px-4 py-3 rounded-2xl bg-[var(--primary)] text-white font-semibold"
              >
                Aceptar nueva tasa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CashIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 140"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      <rect x="20" y="18" width="180" height="100" rx="16" fill="currentColor" fillOpacity="0.15" />
      <rect x="10" y="28" width="180" height="100" rx="16" fill="currentColor" fillOpacity="0.3" />
      <rect x="20" y="38" width="180" height="100" rx="16" fill="currentColor" fillOpacity="0.85" />
      <circle cx="110" cy="88" r="26" fill="#ffffff" fillOpacity="0.25" />
      <circle cx="110" cy="88" r="16" fill="#ffffff" fillOpacity="0.5" />
      <path
        d="M110 72L122 88L110 104L98 88Z"
        fill="#ffffff"
        fillOpacity="0.65"
      />
    </svg>
  );
}
