import { AlertCircle } from "lucide-react";
import { type SimulacionOperacionResultado } from "../types/Transaccion";

interface DialogoCambioTasaProps {
  resultado: SimulacionOperacionResultado;
  onCancelar: () => void;
  onContinuar: () => void;
  isOpen: boolean;
}

export default function DialogoCambioTasa({
  resultado,
  onCancelar,
  onContinuar,
  isOpen
}: DialogoCambioTasaProps) {
  if (!isOpen) return null;

  const anterior = resultado.resultado_anterior!;
  const actual = resultado.resultado_actual;
  
  // Calcular diferencia porcentual
  const diferenciaPorcentual = ((actual.tc_final - anterior.tc_final) / anterior.tc_final) * 100;
  const esFavorable = actual.monto_destino >= anterior.monto_destino;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle 
            className={`flex-shrink-0 ${esFavorable ? 'text-green-500' : 'text-amber-500'}`}
            size={24} 
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              ¡La tasa de cambio ha cambiado!
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              La cotización se ha {esFavorable ? 'mejorado' : 'reducido'} desde tu última consulta.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Tasa anterior</p>
              <p className="text-lg font-semibold text-gray-800">{anterior.tc_final}</p>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Tasa actual</p>
              <p className={`text-lg font-semibold ${esFavorable ? 'text-green-600' : 'text-amber-600'}`}>
                {actual.tc_final}
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Recibirás antes</p>
              <p className="text-md font-medium text-gray-800">
                {anterior.monto_destino.toLocaleString('es-PY')} {anterior.divisa_destino}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Recibirás ahora</p>
              <p className={`text-md font-medium ${esFavorable ? 'text-green-600' : 'text-amber-600'}`}>
                {actual.monto_destino.toLocaleString('es-PY')} {actual.divisa_destino}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className={`text-center text-sm font-medium ${esFavorable ? 'text-green-600' : 'text-amber-600'}`}>
              {esFavorable ? 'Diferencia favorable' : 'Diferencia desfavorable'}: {Math.abs(diferenciaPorcentual).toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancelar}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Cancelar operación
          </button>
          <button
            onClick={onContinuar}
            className="flex-1 px-4 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-700"
          >
            Continuar con nueva tasa
          </button>
        </div>
      </div>
    </div>
  );
}
