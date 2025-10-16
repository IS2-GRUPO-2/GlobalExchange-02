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
  onCancelar: () => void;
}

export default function EtapaSeleccionMetodo({
  opPerspectivaCasa,
  detalleMetodoSeleccionado,
  metodoGenericoSeleccionado,
  onDetalleMetodoChange,
  onMetodoGenericoChange,
  onRetroceder,
  onContinuar,
  onCancelar
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
          onCancelar={onCancelar}
          onContinuar={onContinuar}
          puedeAvanzar={puedeAvanzar()}
        />
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

      {/* Botones de navegación */}
      <div className="flex justify-between items-center gap-3 pt-4">
        <button
          onClick={onRetroceder}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Atrás
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={onCancelar}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onContinuar}
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
    </div>
  );
}
