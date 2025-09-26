import { useState } from "react";
import { CheckCircle, AlertCircle, Loader2, ArrowRight, X, Check } from "lucide-react";
import type { TransaccionResponse } from "../types/Transaccion";

interface EtapaProcesoPagoProps {
  transaccion: TransaccionResponse;
  metodoNombre: string;
  onFinalizarExitoso: () => void;
  onFinalizarFallido: () => void;
  onCancelar: () => void;
}

export default function EtapaProcesoPago({
  transaccion,
  metodoNombre,
  onFinalizarExitoso,
  onFinalizarFallido,
  onCancelar
}: EtapaProcesoPagoProps) {
  const [estado, setEstado] = useState<"procesando" | "exitoso" | "fallido" | "seleccion">("seleccion");
  const [mensaje, setMensaje] = useState("");
  
  const aceptarPago = () => {
    setEstado("procesando");
    setTimeout(() => {
      setEstado("exitoso");
      setMensaje("¡Operación completada con éxito!");
      setTimeout(() => {
        onFinalizarExitoso();
      }, 3000);
    }, 1500);
  };
  
  const rechazarPago = () => {
    setEstado("procesando");
    setTimeout(() => {
      setEstado("fallido");
      setMensaje("Operación rechazada manualmente.");
    }, 1500);
  };

  // Ya no usamos simulación automática, ahora tenemos botones para el usuario

  // Contenido según estado
  const renderContenido = () => {
    switch (estado) {
      case "seleccion":
        return (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <CheckCircle size={36} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Simulación de Pago
            </h3>
            <p className="text-gray-700 mb-6">
              Por favor selecciona el resultado de la operación para simular la respuesta del medio de pago <strong>{metodoNombre}</strong>.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Código de operación: {transaccion.codigo}
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button 
                onClick={aceptarPago}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Aceptar Pago
              </button>
              <button 
                onClick={rechazarPago}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <X size={18} />
                Rechazar Pago
              </button>
            </div>
            <button
              onClick={onCancelar}
              className="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Volver
            </button>
          </>
        );
      
      case "procesando":
        return (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Loader2 size={36} className="text-blue-600 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Procesando tu operación
            </h3>
            <p className="text-gray-600 mb-6">
              Estamos procesando tu {transaccion.codigo} a través de {metodoNombre}. Por favor espera un momento...
            </p>
          </>
        );
      
      case "exitoso":
        return (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <CheckCircle size={36} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-700 mb-2">
              ¡Operación exitosa!
            </h3>
            <p className="text-gray-700 mb-6">
              {mensaje}
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Código de operación: {transaccion.codigo}
            </p>
            <p className="text-sm text-gray-600">
              Serás redirigido automáticamente...
            </p>
          </>
        );
      
      case "fallido":
        return (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <AlertCircle size={36} className="text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-red-700 mb-2">
              La operación ha fallado
            </h3>
            <p className="text-gray-700 mb-6">
              {mensaje}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Código de operación: {transaccion.codigo}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={onFinalizarFallido}
                className="px-6 py-2 bg-zinc-800 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-700"
              >
                <ArrowRight size={16} />
                Finalizar y volver al inicio
              </button>
              <button
                onClick={onCancelar}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Intentar con otro método
              </button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="space-y-6 select-none text-center p-4">
      {renderContenido()}
    </div>
  );
}
