import { type SimulacionResponse } from "../types/Simulacion";

interface EtapaResultadoProps {
  resultado: SimulacionResponse;
  onRetroceder: () => void;
  onNuevaSimulacion: () => void;
}

export default function EtapaResultado({
  resultado,
  onRetroceder,
  onNuevaSimulacion
}: EtapaResultadoProps) {
  return (
    <div className="space-y-6 select-none">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Resultado de tu Operación
        </h3>
        <p className="text-sm text-gray-600">
          Aquí tienes los detalles de tu simulación
        </p>
      </div>

      {/* Resultado principal */}
      <div className="bg-gray-100 border border-gray-300 text-gray-800 rounded-lg p-4 text-center font-semibold text-lg">
        Operación: {resultado.operacion_cliente.toUpperCase()}
      </div>

      <div className="text-center text-2xl font-bold text-gray-900 py-4 bg-green-50 rounded-lg border border-green-200">
        {resultado.monto_origen.toLocaleString('es-PY')} {resultado.divisa_origen} 
        <span className="mx-4 text-green-600">→</span>
        {resultado.monto_destino.toLocaleString('es-PY')} {resultado.divisa_destino}
      </div>

      {/* Detalles */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-gray-800 border-b pb-2">Detalles de la Operación</h4>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Categoría:</span>
            <p className="text-gray-900">{resultado.parametros.nombre_categoria || "Sin categoría"}</p>
          </div>
          
          <div>
            <span className="font-medium text-gray-700">Descuento categoría:</span>
            <p className="text-gray-900">{resultado.parametros.descuento_categoria}%</p>
          </div>

          <div>
            <span className="font-medium text-gray-700">Método:</span>
            <p className="text-gray-900">{resultado.parametros.nombre_metodo}</p>
          </div>

          <div>
            <span className="font-medium text-gray-700">Comisión método:</span>
            <p className="text-gray-900">{resultado.parametros.comision_metodo}%</p>
          </div>

          <div className="col-span-2">
            <span className="font-medium text-gray-700">Tasa final aplicada:</span>
            <p className="text-gray-900 text-lg font-semibold">{resultado.tc_final}</p>
          </div>
        </div>
      </div>

      {/* Botones navegación */}
      <div className="flex justify-between">
        <button
          onClick={onRetroceder}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
        >
          Modificar Datos
        </button>
        <button
          onClick={onNuevaSimulacion}
          className="px-6 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-700"
        >
          Nueva Simulación
        </button>
      </div>
    </div>
  );
}