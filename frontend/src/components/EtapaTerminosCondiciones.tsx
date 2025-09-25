import { useState } from "react";
import { AlertTriangle, FileText } from "lucide-react";
import type { OperacionCompleta } from "../types/Transaccion";

interface EtapaTerminosCondicionesProps {
  resultado: OperacionCompleta;
  onRetroceder: () => void;
  onAceptarYCrear: () => void;
}

export default function EtapaTerminosCondiciones({
  resultado,
  onRetroceder,
  onAceptarYCrear
}: EtapaTerminosCondicionesProps) {
  const [terminosAceptados, setTerminosAceptados] = useState(false);

  const handleAceptar = () => {
    if (terminosAceptados) {
      onAceptarYCrear();
    }
  };

  return (
    <div className="space-y-6 select-none">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center justify-center gap-2">
          <FileText className="w-5 h-5" />
          Términos y Condiciones
        </h3>
        <p className="text-sm text-gray-600">
          Lee y acepta los términos antes de proceder con la transacción
        </p>
      </div>

      {/* Resumen rápido de la operación */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-2">Resumen de tu operación:</h4>
        <div className="text-center text-lg font-semibold text-gray-900 py-2">
          {resultado.monto_origen.toLocaleString()} {resultado.divisa_origen} 
          <span className="mx-2 text-gray-600">→</span>
          {resultado.monto_destino.toLocaleString()} {resultado.divisa_destino}
        </div>
        <p className="text-sm text-gray-600 text-center">
          en {resultado.tauser_seleccionado.nombre}
        </p>
      </div>

      {/* Términos y Condiciones */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-64 overflow-y-auto">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Términos y Condiciones de la Operación
        </h4>
        
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">1. Condiciones Generales</h5>
            <p>
              Al proceder con esta operación, usted acepta los términos y condiciones establecidos por GlobalExchange. 
              La tasa de cambio aplicada es la vigente al momento de la transacción y puede variar según las condiciones del mercado.
            </p>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-800 mb-2">2. Responsabilidades del Cliente</h5>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Verificar que todos los datos ingresados sean correctos</li>
              <li>Presentarse en el terminal seleccionado con documentación válida</li>
              <li>Cumplir con los horarios de operación del terminal</li>
              <li>Notificar cualquier irregularidad de inmediato</li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-800 mb-2">3. Condiciones de la Transacción</h5>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>La operación tiene una validez de 24 horas desde su creación</li>
              <li>Los métodos de pago/cobro deben estar disponibles y activos</li>
              <li>Las comisiones aplicadas son las vigentes al momento de la operación</li>
              <li>GlobalExchange se reserva el derecho de cancelar operaciones sospechosas</li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-800 mb-2">4. Política de Cancelación</h5>
            <p>
              Las operaciones pueden ser canceladas únicamente antes de su procesamiento en el terminal. 
              Una vez iniciado el proceso en el terminal, la operación no podrá ser cancelada.
            </p>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-800 mb-2">5. Protección de Datos</h5>
            <p>
              Sus datos personales y de la transacción son tratados de acuerdo a nuestra política de privacidad 
              y las normativas vigentes de protección de datos personales.
            </p>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-800 mb-2">6. Resolución de Conflictos</h5>
            <p>
              Cualquier disputa relacionada con esta operación será resuelta de acuerdo a los procedimientos 
              establecidos por GlobalExchange y la legislación vigente.
            </p>
          </div>
        </div>
      </div>

      {/* Checkbox de aceptación */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={terminosAceptados}
            onChange={(e) => setTerminosAceptados(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-zinc-600 border-gray-300 rounded focus:ring-zinc-500"
          />
          <span className="text-sm text-gray-700">
            <strong>He leído y acepto los términos y condiciones</strong> de esta operación. 
            Entiendo que al proceder, me comprometo a cumplir con todas las condiciones establecidas 
            y que la transacción será procesada según los parámetros indicados.
          </span>
        </label>
      </div>

      {/* Botones navegación */}
      <div className="flex justify-between">
        <button
          onClick={onRetroceder}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
        >
          Anterior
        </button>
        <button
          onClick={handleAceptar}
          disabled={!terminosAceptados}
          className={`px-6 py-3 rounded-lg font-medium ${
            terminosAceptados
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {terminosAceptados ? "Crear Transacción" : "Acepta los Términos"}
        </button>
      </div>
    </div>
  );
}