import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, XCircle, CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";
import { formatNumber } from "../utils/formatNumber";
import {
  simularTransferenciaBancaria,
  type SimuladorTransferenciaComprobante,
} from "../services/simuladorTransferenciaService";

type SimuladorVista =
  | { step: "form" }
  | { step: "rechazo_monto"; mensaje: string; montoCorrecto?: string | null }
  | { step: "rechazo_tasa"; mensaje: string }
  | { step: "comprobante"; comprobante: SimuladorTransferenciaComprobante }
  | { step: "error"; mensaje: string };

const MESSAGE_CHANNEL = "simulador-transferencia-bancaria";

const closeAndNotify = (status: "success" | "cancel" | "rate-change", payload?: unknown) => {
  try {
    window.opener?.postMessage({ kind: MESSAGE_CHANNEL, status, payload }, window.location.origin);
  } finally {
    window.close();
  }
};

export default function SimuladorTransaccionBancariaPage() {
  const [searchParams] = useSearchParams();
  const [vista, setVista] = useState<SimuladorVista>({ step: "form" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const payload = useMemo(() => {
    const transaccionId = searchParams.get("transaccionId") ?? "";
    const clienteNombre = searchParams.get("cliente") ?? "";
    const montoParam = searchParams.get("monto");
    const divisaOrigen = searchParams.get("divisa") ?? "";

    const monto = montoParam ? Number(montoParam) : NaN;

    return {
      transaccionId,
      clienteNombre,
      monto,
      divisaOrigen,
    };
  }, [searchParams]);

  const datosValidos =
    payload.transaccionId.length > 0 &&
    payload.clienteNombre.length > 0 &&
    Number.isFinite(payload.monto) &&
    payload.monto > 0;

  const [montoInput, setMontoInput] = useState(() =>
    Number.isFinite(payload.monto) ? payload.monto.toFixed(2) : "",
  );

  useEffect(() => {
    document.title = "Simulador Transferencia Bancaria";
  }, []);

  if (!datosValidos) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white px-6">
        <div className="w-full max-w-sm bg-slate-950/70 backdrop-blur rounded-3xl shadow-xl border border-slate-800">
          <div className="p-8 space-y-4 text-center">
            <XCircle className="w-12 h-12 mx-auto text-red-400" />
            <h1 className="text-2xl font-semibold">Simulador no disponible</h1>
            <p className="text-sm text-slate-300">
              No se recibieron los datos necesarios para simular la transferencia bancaria.
              Cierra esta ventana e intenta nuevamente desde la operacion.
            </p>
            <button
              onClick={() => closeAndNotify("cancel")}
              className="w-full mt-4 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </main>
    );
  }

  const handleCancelar = () => {
    closeAndNotify("cancel");
  };

  const handleTransferir = async () => {
    if (submitting) return;

    const montoNumerico = Number(montoInput);
    if (!Number.isFinite(montoNumerico) || montoNumerico <= 0) {
      setFormError("Ingresa un monto válido para simular la transferencia.");
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const resultado = await simularTransferenciaBancaria({
        transaccionId: payload.transaccionId,
        monto: montoNumerico,
        destinoNombre: payload.clienteNombre,
      });

      if (resultado.kind === "aprobada") {
        setVista({ step: "comprobante", comprobante: resultado.comprobante });
        return;
      }

      if (resultado.motivo === "MONTO_INCORRECTO") {
        const montoCorrecto = (resultado.detalles.monto_correcto as string | undefined) ?? null;
        if (montoCorrecto) {
          setMontoInput(montoCorrecto);
        }
        setVista({
          step: "rechazo_monto",
          mensaje: resultado.mensaje,
          montoCorrecto,
        });
        return;
      }

      if (resultado.motivo === "TASA_VARIADA") {
        setVista({
          step: "rechazo_tasa",
          mensaje: resultado.mensaje,
        });
        return;
      }

      setVista({
        step: "error",
        mensaje: resultado.mensaje,
      });
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "No se pudo completar la transferencia.";
      setVista({ step: "error", mensaje });
    } finally {
      setSubmitting(false);
    }
  };

  const renderContenido = () => {
    switch (vista.step) {
      case "form":
        return (
          <>
            <header className="px-6 pt-8 pb-6 text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs uppercase tracking-wider text-slate-300">
                <Building2 className="w-3.5 h-3.5" />
                Cuenta Bancaria
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Transferir</h1>
              <p className="text-sm text-slate-300">
                Simula la transferencia hacia GlobalExchange
              </p>
            </header>

            <section className="px-6 py-5 space-y-4 bg-slate-950/60">
              <div className="flex flex-col gap-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs uppercase tracking-wide text-slate-400">Cuenta Origen</span>
                <p className="text-lg font-semibold text-white break-words">{payload.clienteNombre}</p>
              </div>

              <div className="flex flex-col gap-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  Cuenta Destino
                </span>
                <p className="text-lg font-semibold text-emerald-300">GlobalExchange</p>
              </div>

              <div className="flex flex-col gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  Monto a transferir
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={montoInput}
                    onChange={(event) => setMontoInput(event.target.value)}
                    className="flex-1 bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <span className="text-lg font-semibold text-slate-200">
                    {payload.divisaOrigen}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Monto esperado:{" "}
                  <span className="font-medium text-slate-200">
                    {formatNumber(payload.monto, 2)} {payload.divisaOrigen}
                  </span>
                </p>
                {formError && (
                  <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-900/30 border border-rose-700/60 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{formError}</span>
                  </div>
                )}
              </div>
            </section>

            <footer className="px-6 py-6 bg-slate-900/60 flex flex-col gap-3">
              <button
                onClick={handleTransferir}
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-semibold text-sm uppercase tracking-wide shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Transferir
                  </>
                )}
              </button>

              <button
                onClick={handleCancelar}
                className="px-4 py-3 rounded-2xl border border-slate-700 text-sm uppercase tracking-wide text-slate-300 hover:bg-slate-800/70 transition-colors"
              >
                Cancelar
              </button>
            </footer>
          </>
        );

      case "rechazo_monto":
        return (
          <div className="flex flex-col items-center text-center px-6 py-10 space-y-4">
            <ShieldAlert className="w-12 h-12 text-amber-400" />
            <h2 className="text-2xl font-semibold text-white">Transacción rechazada</h2>
            <p className="text-sm text-slate-300">{vista.mensaje}</p>
            {vista.montoCorrecto && (
              <div className="bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200">
                Monto esperado:{" "}
                <span className="font-semibold text-white">
                  {formatNumber(Number(vista.montoCorrecto), 2)} {payload.divisaOrigen}
                </span>
              </div>
            )}
            <button
              onClick={() => setVista({ step: "form" })}
              className="mt-4 px-5 py-2 rounded-xl bg-slate-800 text-slate-100 hover:bg-slate-700 transition-colors"
            >
              OK
            </button>
          </div>
        );

      case "rechazo_tasa":
        return (
          <div className="flex flex-col items-center text-center px-6 py-10 space-y-4">
            <ShieldAlert className="w-12 h-12 text-red-400" />
            <h2 className="text-2xl font-semibold text-white">Transacción rechazada</h2>
            <p className="text-sm text-slate-300">{vista.mensaje}</p>
            <button
              onClick={() => closeAndNotify("rate-change")}
              className="mt-4 px-5 py-2 rounded-xl bg-red-500 text-white hover:bg-red-400 transition-colors"
            >
              OK
            </button>
          </div>
        );

      case "comprobante":
        return (
          <div className="flex flex-col gap-5 px-6 py-8 text-slate-100">
            <div className="text-center space-y-1">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h2 className="text-2xl font-semibold">Transferencia exitosa</h2>
              <p className="text-sm text-slate-300">Comprobante de simulación</p>
            </div>

            <div className="space-y-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Transacción</span>
                <span className="font-semibold">{vista.comprobante.transaccion_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fecha</span>
                <span className="font-semibold">
                  {new Date(vista.comprobante.fecha).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cuenta origen</span>
                <span className="font-semibold">{vista.comprobante.cuenta_origen}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cuenta destino</span>
                <span className="font-semibold">{vista.comprobante.cuenta_destino}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monto enviado</span>
                <span className="font-semibold">
                  {vista.comprobante.monto_enviado} {vista.comprobante.divisa ?? payload.divisaOrigen}
                </span>
              </div>
              {vista.comprobante.tasa_utilizada && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Tasa aplicada</span>
                  <span className="font-semibold">{vista.comprobante.tasa_utilizada}</span>
                </div>
              )}
              {vista.comprobante.monto_destino_estimado && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Monto destino estimado</span>
                  <span className="font-semibold">{vista.comprobante.monto_destino_estimado}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Referencia</span>
                <span className="font-semibold">{vista.comprobante.referencia}</span>
              </div>
            </div>

            <button
              onClick={() => closeAndNotify("success", { comprobante: vista.comprobante })}
              className="px-5 py-3 rounded-2xl bg-emerald-500 text-slate-900 font-semibold uppercase tracking-wide hover:bg-emerald-400 transition-colors"
            >
              OK
            </button>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center text-center px-6 py-10 space-y-4">
            <XCircle className="w-12 h-12 text-rose-400" />
            <h2 className="text-2xl font-semibold text-white">No se pudo completar</h2>
            <p className="text-sm text-slate-300">{vista.mensaje}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setVista({ step: "form" })}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-100 hover:bg-slate-700 transition-colors"
              >
                Reintentar
              </button>
              <button
                onClick={() => closeAndNotify("cancel")}
                className="px-5 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const showCancelar = vista.step === "form";

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="shadow-2xl rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
          {renderContenido()}
          {!showCancelar && vista.step !== "comprobante" && vista.step !== "rechazo_tasa" && (
            <div className="px-6 pb-6">
              <button
                onClick={() => setVista({ step: "form" })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-700 text-sm uppercase tracking-wide text-slate-300 hover:bg-slate-800/70 transition-colors"
              >
                Volver
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
