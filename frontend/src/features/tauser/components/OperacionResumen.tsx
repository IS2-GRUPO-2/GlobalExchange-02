import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Printer, CheckCircle2, Loader2 } from "lucide-react";
import type { TransaccionDetalle } from "../../operaciones/types/Transaccion";
import type { SelectedTauser } from "../store/useSelectedTauser";
import { completarTransaccionTauser } from "../services/tauserTerminalService";
import { toast } from "react-toastify";
import { estadosTransaccion } from "../../../types/EstadosTransaccion";

type Props = {
  transaccion: TransaccionDetalle;
  tauser: SelectedTauser;
  onVolverClientes: () => void;
  onCerrarSesion: () => void;
  onFinalizada: () => void;
  cuentaRegresiva?: number | null;
  finalizada: boolean;
};

export function OperacionResumen({
  transaccion,
  tauser,
  onVolverClientes,
  onCerrarSesion,
  onFinalizada,
  finalizada,
  cuentaRegresiva,
}: Props) {
  const [procesando, setProcesando] = useState(false);
  const [detalle, setDetalle] = useState<TransaccionDetalle>(transaccion);

  useEffect(() => {
    setDetalle(transaccion);
  }, [transaccion]);

  const operacionFinalizada = useMemo(
    () => finalizada || detalle.estado === "completada",
    [detalle.estado, finalizada]
  );

  const estadoConfig =
    estadosTransaccion.find((item) => item.estado === detalle.estado) ?? estadosTransaccion[0];

  const handleImprimir = () => {
    window.print();
  };

  const handleFinalizar = async () => {
    if (operacionFinalizada) {
      return;
    }

    setProcesando(true);
    try {
      const res = await completarTransaccionTauser(detalle.id);
      if (res?.data) {
        setDetalle(res.data);
      }
      toast.success("Operación finalizada exitosamente.");
      onFinalizada();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo finalizar la operación.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white/95 rounded-3xl shadow-xl p-8 space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Resumen de operación</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Revisa los datos y finaliza para cerrar el proceso.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard label="ID transacción" value={`#${detalle.id}`} />
        <InfoCard
          label="Estado"
          value={
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoConfig.bgColor} ${estadoConfig.textColor}`}
            >
              {estadoConfig.read}
            </span>
          }
        />
        <InfoCard
          label="Cliente"
          value={detalle.cliente_detalle?.nombre ?? detalle.cliente_detalle?.id ?? ""}
        />
        <InfoCard label="Operación" value={detalle.operacion.toUpperCase()} />
        <InfoCard
          label="Monto origen"
          value={`${Number(detalle.monto_origen).toLocaleString()} ${detalle.divisa_origen_detalle?.codigo}`}
        />
        <InfoCard
          label="Monto destino"
          value={`${Number(detalle.monto_destino).toLocaleString()} ${detalle.divisa_destino_detalle?.codigo}`}
        />
        <InfoCard label="Tasa aplicada" value={Number(detalle.tasa_aplicada).toFixed(4)} />
        <InfoCard label="Tauser" value={`${tauser.nombre} (${tauser.codigo})`} />
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <button
          onClick={handleImprimir}
          className="flex-1 px-5 py-3 rounded-2xl border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Imprimir ticket
        </button>
        {!operacionFinalizada ? (
          <button
            onClick={handleFinalizar}
            disabled={procesando}
            className="flex-1 px-6 py-3 rounded-2xl bg-[var(--primary)] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {procesando && <Loader2 className="w-4 h-4 animate-spin" />}
            Finalizar operación
          </button>
        ) : (
          <div className="flex flex-1 items-center justify-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            Operación finalizada
          </div>
        )}
      </div>

      {operacionFinalizada && (
        <div className="rounded-3xl bg-[var(--accent)]/60 p-4 space-y-3 text-sm text-[var(--foreground)]">
          <p>
            La sesión se cerrará automáticamente en{" "}
            <strong>{cuentaRegresiva ?? 0} segundos</strong>.
          </p>
          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={onVolverClientes}
              className="flex-1 px-4 py-2 rounded-2xl border border-[var(--border)] hover:bg-white transition"
            >
              Continuar operando
            </button>
            <button
              onClick={onCerrarSesion}
              className="flex-1 px-4 py-2 rounded-2xl bg-[var(--destructive)] text-white"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type InfoCardProps = {
  label: string;
  value: ReactNode;
};

function InfoCard({ label, value }: InfoCardProps) {
  const displayValue = value ?? "No disponible";
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
      <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)] mb-1">
        {label}
      </div>
      <div className="text-lg font-semibold text-[var(--foreground)]">{displayValue}</div>
    </div>
  );
}
