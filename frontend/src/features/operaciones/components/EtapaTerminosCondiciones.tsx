import { useState, useEffect } from "react";
import { AlertTriangle, FileText } from "lucide-react";
import type { CalcularOperacionResponse } from "../types/Operacion";
import type { Tauser } from "../../tauser/types/Tauser";
import { getTauserById } from "../../tauser/services/tauserService";


interface EtapaTerminosCondicionesProps {
  resultado: CalcularOperacionResponse;
  tauserSeleccionado: string; 
  onRetroceder: () => void;
  onPagar: () => void;
}

export default function EtapaTerminosCondiciones({
  resultado,
  tauserSeleccionado,
  onRetroceder,
  onPagar
}: EtapaTerminosCondicionesProps) {
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [tauserInfo, setTauserInfo] = useState<Tauser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTauserInfo = async () => {
      setLoading(true);
      try {   
        const res = await getTauserById(tauserSeleccionado);
        setTauserInfo(res.data);
      } catch (error) {
        console.error("Error fetching tauser info:", error);
      } finally {
        setLoading(false);
      }
    };

    if (tauserSeleccionado) {
      fetchTauserInfo();
    }
  }, [tauserSeleccionado]);

  const handleAceptar = () => {
    if (terminosAceptados) onPagar();
  };

  return (
    <div className="space-y-6 select-none">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center justify-center gap-2">
          <FileText className="w-5 h-5" />
          Términos y Condiciones
        </h3>
        {/* Si querés mostrar el ID de transacción */}
        {/* <p className="text-xs text-gray-500">Transacción #{transaccionId}</p> */}
        <p className="text-sm text-gray-600">
          Lee y acepta los términos antes de proceder con la transacción
        </p>
      </div>

      {/* Resumen rápido de la operación */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-2">Resumen de tu operación:</h4>
        <div className="text-center text-lg font-semibold text-gray-900 py-2">
          {resultado.monto_origen.toLocaleString('es-PY')} {resultado.divisa_origen}
          <span className="mx-2 text-gray-600">→</span>
          {resultado.monto_destino.toLocaleString('es-PY')} {resultado.divisa_destino}
        </div>
        {loading && <p className="text-sm text-gray-500 text-center">Cargando terminal...</p>}
        {tauserInfo && !loading && (
          <p className="text-sm text-gray-600 text-center">en {tauserInfo.nombre}</p>
        )}
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
            <h5 className="font-medium text-gray-800 mb-2">4. Variaciones en las Cotizaciones</h5>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-2">
              <p className="text-sm font-medium text-amber-800 mb-1">⚠️ Importante:</p>
              <p className="text-sm text-amber-700">
                Al momento de confirmar su transacción en el terminal, el sistema verificará si la cotización
                ha cambiado desde la creación de la transacción.
              </p>
            </div>
            <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
              <li>
                <strong>Si la cotización no cambió:</strong> Su transacción se procesará automáticamente
                con la tasa original ({resultado.tc_final.toLocaleString('es-PY', { minimumFractionDigits: 1, maximumFractionDigits: 4 })} PYG)
              </li>
              <li>
                <strong>Si la cotización cambió:</strong> Se le informará sobre la nueva tasa y deberá
                decidir si continuar con la nueva cotización o cancelar la operación
              </li>
              <li>
                <strong>No se mantendrá la cotización original</strong> si acepta continuar con la nueva tasa
              </li>
              <li>La decisión de continuar o cancelar debe tomarse en el momento de la confirmación</li>
            </ul>
          </div>

          <div>
            <h5 className="font-medium text-gray-800 mb-2">5. Política de Cancelación</h5>
            <p>
              Las operaciones pueden ser canceladas únicamente antes de su procesamiento en el terminal.
              Una vez iniciado el proceso en el terminal, la operación no podrá ser cancelada.
            </p>
          </div>

          <div>
            <h5 className="font-medium text-gray-800 mb-2">6. Protección de Datos</h5>
            <p>
              Sus datos personales y de la transacción son tratados de acuerdo a nuestra política de privacidad
              y las normativas vigentes de protección de datos personales.
            </p>
          </div>

          <div>
            <h5 className="font-medium text-gray-800 mb-2">7. Resolución de Conflictos</h5>
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
            terminosAceptados ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {terminosAceptados ? "Pagar" : "Acepta los Términos"}
        </button>
      </div>
    </div>
  );
}
