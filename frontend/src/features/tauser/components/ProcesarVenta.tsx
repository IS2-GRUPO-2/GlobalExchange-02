import { useEffect, useMemo, useState } from "react";
import type { TransaccionDetalle } from "../../operaciones/types/Transaccion";
import type { SelectedTauser } from "../store/useSelectedTauser";
import {
  actualizarReconfirmacionTauser,
  cancelarTransaccionTauser,
  crearChequeTauser,
  entregarMetalicoTauser,
  getTauserBancos,
  reconfirmarTasaTauser,
  type Banco,
} from "../services/tauserTerminalService";
import { Loader2 } from "lucide-react";
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

  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loadingBancos, setLoadingBancos] = useState(true);
  const [registrandoCheque, setRegistrandoCheque] = useState(false);
  const [procesandoEntrega, setProcesandoEntrega] = useState(false);
  const [chequeRegistrado, setChequeRegistrado] = useState(!requiereCheque);
  const [cambioTasa, setCambioTasa] = useState<Record<string, string> | null>(null);

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
    setChequeRegistrado(!requiereCheque);
  }, [transaccion.id, transaccion.cliente_detalle?.nombre, requiereCheque]);

  useEffect(() => {
    if (!requiereCheque) {
      setLoadingBancos(false);
      return;
    }

    const fetchBancos = async () => {
      try {
        const res = await getTauserBancos();
        setBancos(res.data ?? []);
      } catch (error) {
        console.error(error);
        toast.error("No se pudieron cargar los bancos.");
      } finally {
        setLoadingBancos(false);
      }
    };
    fetchBancos();
  }, [requiereCheque]);

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
    if (requiereCheque && !chequeRegistrado) {
      toast.warning("Registra el cheque antes de entregar metalico.");
      return;
    }

    const puedeContinuar = await verificarCambioDeTasa();
    if (!puedeContinuar) return;

    setProcesandoEntrega(true);
    try {
      const res = await entregarMetalicoTauser(transaccion.id, { tauser: tauser.id });
      toast.success("Entrega de metalico registrada.");
      onProcesada(res.data);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo completar la entrega.");
    } finally {
      setProcesandoEntrega(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white/90 rounded-3xl shadow-xl p-8 space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Proceso de venta</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Primero registra los datos del cheque recibido y luego entrega el metalico al cliente.
        </p>
        {metodoNombre && (
          <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-[0.2em]">
            Metodo de pago: {metodoNombre.replace(/_/g, " ")}
          </p>
        )}
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
          Solo debes entregar el metalico al cliente.
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">2. Entrega de metalico</h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          Monto a entregar:{" "}
          <strong>
            {Number(transaccion.monto_destino).toLocaleString()} {transaccion.divisa_destino_detalle?.codigo}
          </strong>
        </p>
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
            Entregar metalico
          </button>
        </div>
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
