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
  onMetodoGenericoChange: (metodoId: number | null) => void;
  onMetodoSeleccionadoChange: (metodo: MetodoFinanciero | null) => void;
  onRetroceder: () => void;
  onContinuar: () => void;
}

export default function EtapaSeleccionMetodo({
  opPerspectivaCasa,
  detalleMetodoSeleccionado,
  metodoGenericoSeleccionado,
  metodoSeleccionadoInfo,
  onDetalleMetodoChange,
  onMetodoGenericoChange,
  onMetodoSeleccionadoChange,
  onRetroceder,
  onContinuar,
}: EtapaSeleccionMetodoProps) {
  const [mostrandoInstancias, setMostrandoInstancias] = useState(false);

  const handleMetodoChange = (metodo: MetodoFinanciero | null) => {
    onMetodoSeleccionadoChange(metodo);

    if (!metodo) {
      onDetalleMetodoChange(null);
      onMetodoGenericoChange(null);
      setMostrandoInstancias(false);
      return;
    }

    if (metodo.nombre === "EFECTIVO" || metodo.nombre === "CHEQUE") {
      onMetodoGenericoChange(metodo.id ?? null);
      onDetalleMetodoChange(null);
      setMostrandoInstancias(false);
    } else {
      onMetodoGenericoChange(null);
      onDetalleMetodoChange(null);
      setMostrandoInstancias(true);
    }
  };

  useEffect(() => {
    if (!metodoSeleccionadoInfo) {
      setMostrandoInstancias(false);
      return;
    }
    const requiereInstancias = !["EFECTIVO", "CHEQUE"].includes(metodoSeleccionadoInfo.nombre);
    setMostrandoInstancias(requiereInstancias);
  }, [metodoSeleccionadoInfo]);

  const handleInstanciaChange = useCallback(
    (instanciaId: number | null) => {
      onDetalleMetodoChange(instanciaId);
      if (instanciaId) {
        onMetodoGenericoChange(null);
      }
    },
    [onDetalleMetodoChange, onMetodoGenericoChange],
  );

  const volverASeleccionMetodos = () => {
    setMostrandoInstancias(false);
    onDetalleMetodoChange(null);
    onMetodoGenericoChange(null);
    onMetodoSeleccionadoChange(null);
  };

  const getOperacionCliente = (opCasa: "compra" | "venta"): "compra" | "venta" => {
    return opCasa === "compra" ? "venta" : "compra";
  };

  const operacionCliente = getOperacionCliente(opPerspectivaCasa);

  const getTituloMetodo = () => {
    return operacionCliente === "compra" ? "Método de Pago" : "Método de Cobro";
  };

  const getDescripcionMetodo = () => {
    return operacionCliente === "compra"
      ? "Selecciona cómo vas a pagar por la divisa que quieres comprar"
      : "Selecciona cómo quieres recibir el pago por la divisa que vas a vender";
  };

  const puedeAvanzar = () => {
    return detalleMetodoSeleccionado !== null || metodoGenericoSeleccionado !== null;
  };

  if (mostrandoInstancias && metodoSeleccionadoInfo) {
    return (
      <div className="space-y-6 select-none">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{getTituloMetodo()}</h3>
          <p className="text-sm text-gray-600 mb-4">{getDescripcionMetodo()}</p>
        </div>

        <SeleccionInstanciaMetodo
          metodoFinanciero={metodoSeleccionadoInfo}
          instanciaSeleccionada={detalleMetodoSeleccionado}
          onInstanciaChange={handleInstanciaChange}
          onVolver={volverASeleccionMetodos}
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={onRetroceder}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Atrás
          </button>
          <button
            onClick={onContinuar}
            disabled={!puedeAvanzar()}
            className={`flex-1 px-4 py-2 rounded-md transition-colors ${
              puedeAvanzar() ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{getTituloMetodo()}</h3>
        <p className="text-sm text-gray-600 mb-4">{getDescripcionMetodo()}</p>
      </div>

      <SeleccionMetodoFinanciero
        opPerspectivaCasa={opPerspectivaCasa}
        metodoSeleccionado={metodoSeleccionadoInfo}
        onMetodoChange={handleMetodoChange}
      />

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={onRetroceder}
          className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Atrás
        </button>
        <button
          onClick={onContinuar}
          disabled={!puedeAvanzar()}
          className={`flex-1 px-4 py-2 rounded-md transition-colors ${
            puedeAvanzar() ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
