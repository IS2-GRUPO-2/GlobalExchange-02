import { useState, useEffect } from "react";
import { Building2, MapPin, AlertTriangle, X } from "lucide-react";
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
  botonAvanzarLabel?: string;
}

export default function EtapaResultado({
  resultado,
  tauserSeleccionado,
  onRetroceder,
  onAvanzar,
  onCancelar,
  mostrarBotonCancelar = false,
  botonAvanzarLabel,
}: EtapaResultadoProps) {
  const [tauserInfo, setTauserInfo] = useState<Tauser | null>(null);
  const [loadingTauser, setLoadingTauser] = useState(false);
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [modalTerminosOpen, setModalTerminosOpen] = useState(false);

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

  return (
    <div className="space-y-6 select-none">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-zinc-900">
          {getTitulo()}
        </h2>
      </div>

      {/* Conversión principal con etiquetas */}
      <div className="relative overflow-hidden rounded-lg border-2 border-zinc-300 bg-gradient-to-br from-zinc-50 to-white p-6">
        <div className="flex items-center justify-center gap-8">
          {/* Monto Origen */}
          <div className="text-center flex-1">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              {getOperacionCliente(resultado.op_perspectiva_casa) === "compra" ? "Entrega" : "Entrega"}
            </div>
            <div className="text-4xl font-bold text-zinc-900">
              {formatNumber(resultado.monto_origen, 2)}
            </div>
            <div className="text-base font-semibold text-zinc-600 mt-2">
              {resultado.divisa_origen}
            </div>
          </div>
          
          {/* Flecha separadora */}
          <div className="flex flex-col items-center">
            <div className="text-4xl text-zinc-400">→</div>
          </div>
          
          {/* Monto Destino */}
          <div className="text-center flex-1">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              {getOperacionCliente(resultado.op_perspectiva_casa) === "compra" ? "Recibe" : "Recibe"}
            </div>
            <div className="text-4xl font-bold text-zinc-900">
              {formatNumber(resultado.monto_destino, 2)}
            </div>
            <div className="text-base font-semibold text-zinc-600 mt-2">
              {resultado.divisa_destino}
            </div>
          </div>
        </div>
      </div>

      {/* Detalles de la operación */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
        <h4 className="font-semibold text-zinc-900 border-b border-zinc-200 pb-2">
          Detalles de la Operación
        </h4>
        
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <span className="text-sm font-medium text-zinc-500 block mb-1">Categoría:</span>
            <p className="text-zinc-900 font-medium">
              {resultado.parametros.nombre_categoria || "Sin categoría"}
            </p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-zinc-500 block mb-1">Descuento categoría:</span>
            <p className="text-zinc-900 font-medium">
              {formatNumber(resultado.parametros.descuento_categoria ?? 0, 2)}%
            </p>
          </div>

          <div>
            <span className="text-sm font-medium text-zinc-500 block mb-1">Método:</span>
            <p className="text-zinc-900 font-medium">
              {resultado.parametros.nombre_metodo}
            </p>
          </div>

          <div>
            <span className="text-sm font-medium text-zinc-500 block mb-1">Comisión método:</span>
            <p className="text-zinc-900 font-medium">
              {formatNumber(resultado.parametros.comision_metodo ?? 0, 2)}%
            </p>
          </div>

          <div className="col-span-2 pt-2 border-t border-zinc-200">
            <span className="text-sm font-medium text-zinc-500 block mb-1">Tasa final aplicada:</span>
            <p className="text-zinc-900 text-xl font-bold">
              {resultado.tc_final}
            </p>
          </div>
        </div>
      </div>

      {/* Información del Terminal - Solo para operaciones reales */}
      {loadingTauser && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900 mx-auto mb-2"></div>
          <p className="text-zinc-600 text-sm">Cargando información del terminal...</p>
        </div>
      )}
      
      {tauserInfo && !loadingTauser && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-5">
          <h4 className="font-semibold text-zinc-900 border-b border-zinc-200 pb-2 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-zinc-700" />
            Terminal de Autoservicio
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-zinc-500">Nombre:</span>
              <span className="text-zinc-900 font-medium text-right">{tauserInfo.nombre}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-zinc-500">Código:</span>
              <span className="text-zinc-900 font-medium">{tauserInfo.codigo}</span>
            </div>
            <div className="flex justify-between items-start pt-2 border-t border-zinc-200">
              <span className="text-sm font-medium text-zinc-500 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Ubicación:
              </span>
              <div className="text-right text-zinc-900 text-sm max-w-[60%]">
                <p className="font-medium">{tauserInfo.direccion}</p>
                <p className="text-zinc-600">{tauserInfo.ciudad}, {tauserInfo.departamento}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Términos y Condiciones - Solo para operación real */}
      {esOperacionReal && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={terminosAceptados}
              onChange={(e) => setTerminosAceptados(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-zinc-900 border-zinc-300 rounded focus:ring-zinc-500"
            />
            <span className="text-sm text-zinc-700">
              <strong>He leído y acepto los </strong>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setModalTerminosOpen(true);
                }}
                className="text-zinc-900 underline hover:text-zinc-700 font-semibold"
              >
                Términos y Condiciones
              </button>
              <strong> de esta operación.</strong>
            </span>
          </label>
        </div>
      )}

      {/* Botones navegación */}
      <div className="flex justify-between items-center gap-3">
        <button
          onClick={onRetroceder}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Atrás
        </button>
        
        <div className="flex gap-3">
          {mostrarBotonCancelar && onCancelar && (
            <button
              onClick={onCancelar}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          )}
          
          <button
            onClick={onAvanzar}
            disabled={esOperacionReal && !terminosAceptados}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              esOperacionReal && !terminosAceptados
                ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                : "bg-zinc-900 text-white hover:bg-zinc-700"
            }`}
          >
            {esOperacionReal ? (botonAvanzarLabel ?? "Confirmar y Pagar") : "Continuar"}
          </button>
        </div>
      </div>

      {/* Modal de Términos y Condiciones */}
      {modalTerminosOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200">
              <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Términos y Condiciones de la Operación
              </h3>
              <button
                onClick={() => setModalTerminosOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6 text-sm text-zinc-700 leading-relaxed">
                <div>
                  <h5 className="font-semibold text-zinc-900 mb-2">1. Condiciones Generales</h5>
                  <p>
                    Al proceder con esta operación, usted acepta los términos y condiciones establecidos por GlobalExchange.
                    La tasa de cambio aplicada es la vigente al momento de la transacción y puede variar según las condiciones del mercado.
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold text-zinc-900 mb-2">2. Responsabilidades del Cliente</h5>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Verificar que todos los datos ingresados sean correctos</li>
                    <li>Presentarse en el terminal seleccionado con documentación válida</li>
                    <li>Cumplir con los horarios de operación del terminal</li>
                    <li>Notificar cualquier irregularidad de inmediato</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-zinc-900 mb-2">3. Condiciones de la Transacción</h5>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>La operación tiene una validez de 24 horas desde su creación</li>
                    <li>Los métodos de pago/cobro deben estar disponibles y activos</li>
                    <li>Las comisiones aplicadas son las vigentes al momento de la operación</li>
                    <li>GlobalExchange se reserva el derecho de cancelar operaciones sospechosas</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-zinc-900 mb-2">4. Variaciones en las Cotizaciones</h5>
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-2">
                    <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Importante:</p>
                    <p className="text-sm text-amber-700">
                      Al momento de confirmar su transacción en el terminal, el sistema verificará si la cotización
                      ha cambiado desde la creación de la transacción.
                    </p>
                  </div>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>
                      <strong>Si la cotización no cambió:</strong> Su transacción se procesará automáticamente
                      con la tasa original ({formatNumber(resultado.tc_final, 4)})
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
                  <h5 className="font-semibold text-zinc-900 mb-2">5. Política de Cancelación</h5>
                  <p>
                    Las operaciones pueden ser canceladas únicamente antes de su procesamiento en el terminal.
                    Una vez iniciado el proceso en el terminal, la operación no podrá ser cancelada.
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold text-zinc-900 mb-2">6. Protección de Datos</h5>
                  <p>
                    Sus datos personales y de la transacción son tratados de acuerdo a nuestra política de privacidad
                    y las normativas vigentes de protección de datos personales.
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold text-zinc-900 mb-2">7. Resolución de Conflictos</h5>
                  <p>
                    Cualquier disputa relacionada con esta operación será resuelta de acuerdo a los procedimientos
                    establecidos por GlobalExchange y la legislación vigente.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-200 flex justify-end gap-3">
              <button
                onClick={() => setModalTerminosOpen(false)}
                className="px-6 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

