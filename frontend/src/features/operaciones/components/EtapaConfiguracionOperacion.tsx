import { useState } from "react";
import EtapaSeleccionDivisas from "./EtapaSeleccionDivisas";
import EtapaSeleccionMetodo from "./EtapaSeleccionMetodo";
import EtapaSeleccionTauser from "./EtapaSeleccionTauser";
import type { Cliente } from "../../clientes/types/Cliente";
import type {
  MetodoFinanciero,
  CuentaBancaria,
  BilleteraDigital,
  Tarjeta,
} from "../../metodos_financieros/types/MetodoFinanciero";

interface EtapaConfiguracionOperacionProps {
  divisaOrigen: string;
  setDivisaOrigen: (value: string) => void;
  divisaDestino: string;
  setDivisaDestino: (value: string) => void;
  monto: number;
  setMonto: (value: number) => void;
  clienteActual: Cliente | null;
  opPerspectivaCasa: "compra" | "venta" | null;
  setOpPerspectivaCasa: (value: "compra" | "venta" | null) => void;
  detalleMetodoSeleccionado: number | null;
  setDetalleMetodoSeleccionado: (value: number | null) => void;
  detalleMetodoSeleccionadoInfo: CuentaBancaria | BilleteraDigital | Tarjeta | null;
  setDetalleMetodoSeleccionadoInfo: (
    value: CuentaBancaria | BilleteraDigital | Tarjeta | null
  ) => void;
  metodoGenericoSeleccionado: number | null;
  setMetodoGenericoSeleccionado: (value: number | null) => void;
  metodoSeleccionadoInfo: MetodoFinanciero | null;
  setMetodoSeleccionadoInfo: (value: MetodoFinanciero | null) => void;
  tauserSeleccionado: string;
  setTauserSeleccionado: (value: string) => void;
  onCancelar: () => void;
  onContinuar: () => void;
}

const SectionWrapper = ({
  title,
  subtitle,
  active,
  children,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  children: React.ReactNode;
}) => (
  <div
    className={`rounded-xl border bg-white shadow-sm p-6 transition-opacity ${
      active ? "opacity-100" : "opacity-60 pointer-events-none"
    }`}
    aria-disabled={!active}
  >
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{subtitle}</p>
    </div>
    {children}
    {!active && (
      <p className="mt-4 text-sm text-gray-500">
        Completa la sección anterior para continuar.
      </p>
    )}
  </div>
);

export default function EtapaConfiguracionOperacion({
  divisaOrigen,
  setDivisaOrigen,
  divisaDestino,
  setDivisaDestino,
  monto,
  setMonto,
  clienteActual,
  opPerspectivaCasa,
  setOpPerspectivaCasa,
  detalleMetodoSeleccionado,
  setDetalleMetodoSeleccionado,
  detalleMetodoSeleccionadoInfo,
  setDetalleMetodoSeleccionadoInfo,
  metodoGenericoSeleccionado,
  setMetodoGenericoSeleccionado,
  metodoSeleccionadoInfo,
  setMetodoSeleccionadoInfo,
  tauserSeleccionado,
  setTauserSeleccionado,
  onCancelar,
  onContinuar,
}: EtapaConfiguracionOperacionProps) {
  const [divisasListas, setDivisasListas] = useState(false);
  const [metodoListo, setMetodoListo] = useState(false);
  const seccionMetodoActiva = divisasListas && !!opPerspectivaCasa;
  const seccionTauserActiva = metodoListo;
  const puedeContinuar = seccionTauserActiva && !!tauserSeleccionado;

  return (
    <div className="space-y-8 select-none">
      <SectionWrapper
        title="Selecciona las divisas y el monto"
        subtitle="Define la operación para tu cliente."
        active={true}
      >
        <EtapaSeleccionDivisas
          divisaOrigen={divisaOrigen}
          setDivisaOrigen={setDivisaOrigen}
          divisaDestino={divisaDestino}
          setDivisaDestino={setDivisaDestino}
          opPerspectivaCasa={opPerspectivaCasa}
          setOpPerspectivaCasa={setOpPerspectivaCasa}
          monto={monto}
          setMonto={setMonto}
          clienteActual={clienteActual}
          variant="inline"
          onReadyChange={setDivisasListas}
        />
      </SectionWrapper>

      <SectionWrapper
        title="Selecciona el método de pago/cobro"
        subtitle="Escoge cómo se realizará la operación."
        active={seccionMetodoActiva}
      >
        <EtapaSeleccionMetodo
          opPerspectivaCasa={opPerspectivaCasa ?? "compra"}
          detalleMetodoSeleccionado={detalleMetodoSeleccionado}
          metodoGenericoSeleccionado={metodoGenericoSeleccionado}
          metodoSeleccionadoInfo={metodoSeleccionadoInfo}
          onDetalleMetodoChange={setDetalleMetodoSeleccionado}
          onDetalleMetodoInfoChange={setDetalleMetodoSeleccionadoInfo}
          onMetodoGenericoChange={setMetodoGenericoSeleccionado}
          onMetodoSeleccionadoChange={setMetodoSeleccionadoInfo}
          variant="inline"
          disabled={!seccionMetodoActiva}
          onReadyChange={setMetodoListo}
        />
      </SectionWrapper>

      <SectionWrapper
        title="Selecciona el terminal de autoservicio"
        subtitle="Asigna dónde se completará la operación."
        active={seccionTauserActiva}
      >
        <EtapaSeleccionTauser
          tauserSeleccionado={tauserSeleccionado}
          setTauserSeleccionado={setTauserSeleccionado}
          divisaDestino={divisaDestino}
          opPerspectivaCasa={opPerspectivaCasa}
          monto={monto}
          variant="inline"
          disabled={!seccionTauserActiva}
        />
      </SectionWrapper>

      <div className="flex justify-end gap-3">
        <button
          onClick={onCancelar}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onContinuar}
          disabled={!puedeContinuar}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            puedeContinuar
              ? "bg-zinc-900 text-white hover:bg-zinc-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
