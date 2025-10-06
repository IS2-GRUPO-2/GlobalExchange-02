import { useState, useEffect } from "react";
import { Building2, MapPin } from "lucide-react";
import { type CalcularOperacionResponse } from "../types/Operacion";
import type { Tauser } from "../../tauser/types/Tauser";
import { getTauserById } from "../../tauser/services/tauserService";
import { formatNumber } from "../utils/formatNumber"; 
interface EtapaResultadoProps {
  resultado: CalcularOperacionResponse;
  tauserSeleccionado?: string; // ID del tauser seleccionado, si existe
  onRetroceder: () => void;
  onAvanzar: () => void;
  onCancelar?: () => void;
  mostrarBotonCancelar?: boolean;
}

export default function EtapaResultado({
  resultado,
  tauserSeleccionado,
  onRetroceder,
  onAvanzar,
  onCancelar,
  mostrarBotonCancelar = false
}: EtapaResultadoProps) {
  const [tauserInfo, setTauserInfo] = useState<Tauser | null>(null);
  const [loadingTauser, setLoadingTauser] = useState(false);

  // Determinar si hay tauser seleccionado (operación real) o no (simulación)
  const esOperacionReal = !!tauserSeleccionado;

  // Función para inferir operación desde perspectiva del cliente
  const getOperacionCliente = (opCasa: "compra" | "venta"): "compra" | "venta" => {
    return opCasa === "compra" ? "venta" : "compra";
  };

  // Obtener información del tauser cuando se selecciona
  useEffect(() => {
    const fetchTauserInfo = async () => {
      if (!tauserSeleccionado) {
        setTauserInfo(null);
        return;
      }

      setLoadingTauser(true);
      try {
        const tauser = await getTauserById(tauserSeleccionado);
        setTauserInfo(tauser.data);
      } catch (error: any) {
        console.error("Error al obtener información del terminal:", error);
        setTauserInfo(null);
      } finally {
        setLoadingTauser(false);
      }
    };

    fetchTauserInfo();
  }, [tauserSeleccionado]);
  
  const getTitulo = () => {
    if (esOperacionReal) return "Detalle de Operación";
    return "Resultado de Operación";
  };

  const getBotonSecundario = () => {
    if (esOperacionReal) return "Modificar Terminal";
    return "Modificar Datos";
  };

  const getBotonPrimario = () => {
    if (esOperacionReal) return "Revisar Términos";
    return "Continuar";
  };

  return (
    <div className="space-y-6 select-none">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {getTitulo()}
        </h2>
      </div>

      {/* Tipo de operación */}
      <div className="bg-gray-100 border border-gray-300 text-gray-800 rounded-lg p-4 text-center font-semibold text-lg">
        Operación: {getOperacionCliente(resultado.op_perspectiva_casa).toUpperCase()}
      </div>

      <div className="text-center text-2xl font-bold text-gray-900 py-4 bg-green-50 rounded-lg border border-green-200">
        {formatNumber(resultado.monto_origen)} {resultado.divisa_origen} 
        <span className="mx-4 text-green-600">→</span>
        {formatNumber(resultado.monto_destino)} {resultado.divisa_destino}
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
            <p className="text-gray-900">{formatNumber(resultado.parametros.descuento_categoria ?? 0, 2)}%</p>
          </div>

          <div>
            <span className="font-medium text-gray-700">Método:</span>
            <p className="text-gray-900">{resultado.parametros.nombre_metodo}</p>
          </div>

          <div>
            <span className="font-medium text-gray-700">Comisión método:</span>
            <p className="text-gray-900">{formatNumber(resultado.parametros.comision_metodo ?? 0, 2)}%</p>
          </div>

          <div className="col-span-2">
            <span className="font-medium text-gray-700">Tasa final aplicada:</span>
            <p className="text-gray-900 text-lg font-semibold">{formatNumber(resultado.tc_final, 4)}</p>
          </div>
        </div>
      </div>

      {/* Información del Terminal - Solo para operaciones reales */}
      {loadingTauser && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-blue-600 text-sm">Cargando información del terminal...</p>
        </div>
      )}
      
      {tauserInfo && !loadingTauser && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 border-b border-blue-200 pb-2 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Terminal de Autoservicio
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-blue-700">Nombre:</span>
              <span className="text-blue-900">{tauserInfo.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-blue-700">Código:</span>
              <span className="text-blue-900">{tauserInfo.codigo}</span>
            </div>
            <div className="flex items-start justify-between">
              <span className="font-medium text-blue-700 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Ubicación:
              </span>
              <div className="text-right text-blue-900 text-sm">
                <p>{tauserInfo.direccion}</p>
                <p>{tauserInfo.ciudad}, {tauserInfo.departamento}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botones navegación */}
      <div className="flex justify-between items-center">
        <button
          onClick={onRetroceder}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
        >
          {getBotonSecundario()}
        </button>
        
        <div className="flex gap-3">
          {mostrarBotonCancelar && onCancelar && (
            <button
              onClick={onCancelar}
              className="px-6 py-2 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50"
            >
              Cancelar
            </button>
          )}
          
          <button
            onClick={onAvanzar}
            className="px-6 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-700"
          >
            {getBotonPrimario()}
          </button>
        </div>
      </div>
    </div>
  );
}