import { Building2, MapPin } from "lucide-react";
import type { OperacionCompleta } from "../types/Transaccion";

interface EtapaResultadoOperacionProps {
  resultado: OperacionCompleta;
  onRetroceder: () => void;
  onContinuar: () => void;
}

export default function EtapaResultadoOperacion({
  resultado,
  onRetroceder,
  onContinuar
}: EtapaResultadoOperacionProps) {
  return (
    <div className="space-y-6 select-none">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Resumen de tu Operación
        </h3>
        <p className="text-sm text-gray-600">
          Revisa los detalles antes de proceder
        </p>
      </div>

      {/* Resultado principal */}
      <div className="bg-gray-100 border border-gray-300 text-gray-800 rounded-lg p-4 text-center font-semibold text-lg">
        Operación: {resultado.operacion_cliente.toUpperCase()}
      </div>

      <div className="text-center text-2xl font-bold text-gray-900 py-4 bg-green-50 rounded-lg border border-green-200">
        {resultado.monto_origen.toLocaleString()} {resultado.divisa_origen} 
        <span className="mx-4 text-green-600">→</span>
        {resultado.monto_destino.toLocaleString()} {resultado.divisa_destino}
      </div>

      {/* Detalles de la operación */}
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

      {/* Información del Tauser */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 border-b border-blue-200 pb-2 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Terminal de Autoservicio
        </h4>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium text-blue-700">Nombre:</span>
            <span className="text-blue-900">{resultado.tauser_seleccionado.nombre}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-blue-700">Código:</span>
            <span className="text-blue-900">{resultado.tauser_seleccionado.codigo}</span>
          </div>
          <div className="flex items-start justify-between">
            <span className="font-medium text-blue-700 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Ubicación:
            </span>
            <div className="text-right text-blue-900 text-sm">
              <p>{resultado.tauser_seleccionado.direccion}</p>
              <p>{resultado.tauser_seleccionado.ciudad}, {resultado.tauser_seleccionado.departamento}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botones navegación */}
      <div className="flex justify-between">
        <button
          onClick={onRetroceder}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
        >
          Modificar Terminal
        </button>
        <button
          onClick={onContinuar}
          className="px-6 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-700"
        >
          Revisar Términos
        </button>
      </div>
    </div>
  );
}
