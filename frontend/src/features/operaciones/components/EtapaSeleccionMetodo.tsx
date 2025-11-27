import { useState, useCallback, useEffect } from "react";
import SeleccionMetodoFinanciero from "./SeleccionMetodoFinanciero";
import SeleccionInstanciaMetodo from "./SeleccionInstanciaMetodo";
import type { MetodoFinanciero } from "../../metodos_financieros/types/MetodoFinanciero";

interface EtapaSeleccionMetodoProps {
  opPerspectivaCasa: "compra" | "venta";
  detalleMetodoSeleccionado: number | null;
  metodoGenericoSeleccionado: number | null;
  metodoSeleccionadoInfo: MetodoFinanciero | null;
  onDetalleMetodoChange: (detalleId: number | null) => void;
  onDetalleMetodoInfoChange: (instancia: any | null) => void;
  onMetodoGenericoChange: (metodoId: number | null) => void;
  onMetodoSeleccionadoChange: (metodo: MetodoFinanciero | null) => void;
  onRetroceder?: () => void;
  onContinuar?: () => void;
  onCancelar?: () => void;
  variant?: "wizard" | "inline";
  disabled?: boolean;
  onReadyChange?: (ready: boolean) => void;
}

const METODOS_GENERICOS = ["EFECTIVO", "CHEQUE", "STRIPE"];

export default function EtapaSeleccionMetodo({
  opPerspectivaCasa,
  detalleMetodoSeleccionado,
  metodoGenericoSeleccionado,
  metodoSeleccionadoInfo,
  onDetalleMetodoChange,
  onDetalleMetodoInfoChange,
  onMetodoGenericoChange,
  onMetodoSeleccionadoChange,
  onRetroceder,
  onContinuar,
  onCancelar,
  variant = "wizard",
  disabled = false,
  onReadyChange,
}: EtapaSeleccionMetodoProps) {
  const [mostrandoInstancias, setMostrandoInstancias] = useState(false);
  const isInline = variant === "inline";

  const handleRetroceder = () => {
    onRetroceder?.();
  };

  const handleContinuar = () => {
    onContinuar?.();
  };

  const handleCancelar = () => {
    onCancelar?.();
  };

  const handleMetodoChange = (metodo: MetodoFinanciero | null) => {
    onMetodoSeleccionadoChange(metodo);

    if (!metodo) {
      onDetalleMetodoChange(null);
      onDetalleMetodoInfoChange(null);
      onMetodoGenericoChange(null);
      setMostrandoInstancias(false);
      return;
    }

    if (METODOS_GENERICOS.includes(metodo.nombre)) {
      onMetodoGenericoChange(metodo.id ?? null);
      onDetalleMetodoChange(null);
      onDetalleMetodoInfoChange(null);
      setMostrandoInstancias(false);
    } else {
      onMetodoGenericoChange(null);
      onDetalleMetodoChange(null);
      onDetalleMetodoInfoChange(null);
      setMostrandoInstancias(true);
    }
  };

  useEffect(() => {
    if (!metodoSeleccionadoInfo) {
      setMostrandoInstancias(false);
      return;
    }
    const requiereInstancias = !METODOS_GENERICOS.includes(
      metodoSeleccionadoInfo.nombre
    );
    setMostrandoInstancias(requiereInstancias);
  }, [metodoSeleccionadoInfo]);

  const handleInstanciaChange = useCallback(
    (instanciaId: number | null, instancia?: any) => {
      onDetalleMetodoChange(instanciaId);
      onDetalleMetodoInfoChange(instancia ?? null);
      if (instanciaId) {
        onMetodoGenericoChange(null);
      }
    },
    [onDetalleMetodoChange, onDetalleMetodoInfoChange, onMetodoGenericoChange]
  );

  const volverASeleccionMetodos = () => {
    setMostrandoInstancias(false);
    onDetalleMetodoChange(null);
    onDetalleMetodoInfoChange(null);
    onMetodoGenericoChange(null);
    onMetodoSeleccionadoChange(null);
  };

  const getOperacionCliente = (
    opCasa: "compra" | "venta"
  ): "compra" | "venta" => {
    return opCasa === "compra" ? "venta" : "compra";
  };

  const operacionCliente = getOperacionCliente(opPerspectivaCasa);

  const getTituloMetodo = () => {
    return operacionCliente === "compra" ? "Metodo de Pago" : "Metodo de Cobro";
  };

  const getDescripcionMetodo = () => {
    return operacionCliente === "compra"
      ? "Selecciona como vas a pagar por la divisa que quieres comprar"
      : "Selecciona como quieres recibir el pago por la divisa que vas a vender";
  };

  const puedeAvanzar = () => {
    return (
      detalleMetodoSeleccionado !== null || metodoGenericoSeleccionado !== null
    );
  };

  useEffect(() => {
    onReadyChange?.(puedeAvanzar());
  }, [detalleMetodoSeleccionado, metodoGenericoSeleccionado, onReadyChange]);

  const renderInstancias = () => (
    <div
      className={`space-y-6 select-none ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
      aria-disabled={disabled}
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {getTituloMetodo()}
        </h3>
        <p className="text-sm text-gray-600 mb-4">{getDescripcionMetodo()}</p>
      </div>

      <SeleccionInstanciaMetodo
        metodoFinanciero={metodoSeleccionadoInfo!}
        instanciaSeleccionada={detalleMetodoSeleccionado}
        onInstanciaChange={handleInstanciaChange}
        onVolver={volverASeleccionMetodos}
        onCancelar={handleCancelar}
        onContinuar={handleContinuar}
        puedeAvanzar={puedeAvanzar()}
        mostrarAcciones={!isInline}
      />
    </div>
  );

  const renderSeleccionMetodo = () => (
    <div
      className={`space-y-6 select-none ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
      aria-disabled={disabled}
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {getTituloMetodo()}
        </h3>
        <p className="text-sm text-gray-600 mb-4">{getDescripcionMetodo()}</p>
      </div>

      <SeleccionMetodoFinanciero
        opPerspectivaCasa={opPerspectivaCasa}
        metodoSeleccionado={metodoSeleccionadoInfo}
        onMetodoChange={handleMetodoChange}
      />

      {/* Botones de navegaciA3n */}
      {!isInline && (
        <div className="flex justify-between items-center gap-3 pt-4">
          <button
            onClick={handleRetroceder}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            AtrA�s
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleCancelar}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleContinuar}
              disabled={!puedeAvanzar()}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                puedeAvanzar()
                  ? "bg-zinc-900 text-white hover:bg-zinc-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (mostrandoInstancias && metodoSeleccionadoInfo) {
    return renderInstancias();
  }

  return renderSeleccionMetodo();
}
