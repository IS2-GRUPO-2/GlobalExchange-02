import { useState, useCallback } from "react";
import SeleccionMetodoFinanciero from "./SeleccionMetodoFinanciero";
import SeleccionInstanciaMetodo from "./SeleccionInstanciaMetodo";
import type { MetodoFinanciero } from "../../metodos_financieros/types/MetodoFinanciero";

interface EtapaSeleccionMetodoProps {
  opPerspectivaCasa: "compra" | "venta";
  detalleMetodoSeleccionado: number | null;
  metodoGenericoSeleccionado: number | null;
  onDetalleMetodoChange: (detalleId: number | null) => void;
  onMetodoGenericoChange: (metodoId: number | null) => void;
  onRetroceder: () => void;
  onContinuar: () => void;
}

export default function EtapaSeleccionMetodo({
  opPerspectivaCasa,
  detalleMetodoSeleccionado,
  metodoGenericoSeleccionado,
  onDetalleMetodoChange,
  onMetodoGenericoChange,
  onRetroceder,
  onContinuar
}: EtapaSeleccionMetodoProps) {
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<MetodoFinanciero | null>(null);
  const [mostrandoInstancias, setMostrandoInstancias] = useState(false);

  // Manejar selección de método financiero
  const handleMetodoChange = (metodo: MetodoFinanciero | null) => {
    setMetodoSeleccionado(metodo);
    
    if (!metodo) {
      // Si se deselecciona el método, limpiar todo
      onDetalleMetodoChange(null);
      onMetodoGenericoChange(null);
      setMostrandoInstancias(false);
      return;
    }

    // Si es efectivo o cheque, seleccionar directamente el método genérico
    if (metodo.nombre === "EFECTIVO" || metodo.nombre === "CHEQUE") {
      onMetodoGenericoChange(metodo.id!);
      onDetalleMetodoChange(null);
      setMostrandoInstancias(false);
    } else {
      // Para otros métodos, mostrar instancias específicas
      onMetodoGenericoChange(null);
      onDetalleMetodoChange(null);
      setMostrandoInstancias(true);
    }
  };

  // Manejar selección de instancia específica
  const handleInstanciaChange = useCallback(
    (instanciaId: number | null) => {
      onDetalleMetodoChange(instanciaId);
      if (instanciaId) {
        onMetodoGenericoChange(null); // Limpiar método genérico si hay instancia específica
      }
    },
    [onDetalleMetodoChange, onMetodoGenericoChange]
  );

  // Volver a selección de métodos
  const volverASeleccionMetodos = () => {
    setMostrandoInstancias(false);
    onDetalleMetodoChange(null);
    onMetodoGenericoChange(null);
  };

  // Función para inferir operación desde perspectiva del cliente
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

  // Si estamos mostrando instancias específicas
  if (mostrandoInstancias && metodoSeleccionado) {
    return (
      <div className="space-y-6 select-none">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {getTituloMetodo()}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {getDescripcionMetodo()}
          </p>
        </div>

        <SeleccionInstanciaMetodo
          metodoFinanciero={metodoSeleccionado}
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
              puedeAvanzar()
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  // Vista principal de selección de métodos
  return (
    <div className="space-y-6 select-none">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {getTituloMetodo()}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {getDescripcionMetodo()}
        </p>
      </div>

      <SeleccionMetodoFinanciero
        opPerspectivaCasa={opPerspectivaCasa}
        metodoSeleccionado={metodoSeleccionado}
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
            puedeAvanzar()
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
