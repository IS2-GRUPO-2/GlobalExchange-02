import { useState, useEffect } from "react";
import { MapPin, Building2 } from "lucide-react";
import type { Tauser } from "../../tauser/types/Tauser";
import { getTausersConStock, getTausers } from "../../tauser/services/tauserService";

interface EtapaSeleccionTauserProps {
  tauserSeleccionado: string;
  setTauserSeleccionado: (tauserId: string) => void;
  divisaDestino: string;
  opPerspectivaCasa: "compra" | "venta" | null;
  monto: number;
  onRetroceder: () => void;
  onAvanzar: () => void;
  onCancelar: () => void;
}

export default function EtapaSeleccionTauser({
  tauserSeleccionado,
  setTauserSeleccionado,
  divisaDestino,
  opPerspectivaCasa,
  monto,
  onRetroceder,
  onAvanzar,
  onCancelar
}: EtapaSeleccionTauserProps) {
  const [tausers, setTausers] = useState<Tauser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTausers = async () => {
      setLoading(true);
      try {
        // Determinar el servicio a utilizar dependiendo de la operacion
        // - COMPRA (casa compra del cliente): Se asume que siempre hay stock de guaranies, mostramos todos los tausers activos
        // - VENTA (casa vende al cliente): Tauser necesita stock de divisaDestino (para entregar al cliente), mostramos solo los que tienen stock para el monto
     
        
        if (opPerspectivaCasa === "compra") {
          const data = await getTausers({ all: true});
          const tauserActivos = Array.isArray(data) ? data.filter((t: Tauser) => t.is_active) : [];
          setTausers(tauserActivos);
        } else if (opPerspectivaCasa === "venta") {
          const data = await getTausersConStock(Number(divisaDestino), monto);
          setTausers(data);
        }
        
      } catch (err) {
        console.error("Error cargando tausers", err);
        setTausers([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTausers();
  }, [divisaDestino, opPerspectivaCasa, monto]);

  const puedeAvanzar = !!tauserSeleccionado;

  if (loading) {
    return (
      <div className="space-y-6 select-none">
        <div className="text-center">
          <div className="animate-pulse bg-gray-200 h-6 w-64 mx-auto rounded mb-2"></div>
          <div className="animate-pulse bg-gray-200 h-4 w-48 mx-auto rounded"></div>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Selecciona un Terminal de Autoservicio
        </h3>
        <p className="text-sm text-gray-600">
          Elige el terminal donde realizarás tu operación
        </p>
      </div>

      {/* Lista de tausers */}
      {tausers.length > 0 ? (
        <div className="grid gap-4 max-h-96 overflow-y-auto">
          {tausers.map((tauser) => {
            const isSelected = tauserSeleccionado === tauser.id;
            
            return (
              <div
              
                onClick={() => setTauserSeleccionado(tauser.id)}
                key={tauser.id}
                className={`
                  p-4 border rounded-lg cursor-pointer transition-all duration-200
                  ${isSelected 
                    ? 'border-zinc-500 bg-zinc-50 ring-2 ring-zinc-200' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-gray-600" />
                      <h4 className="font-medium text-gray-900">{tauser.nombre}</h4>
                      <span className="text-sm text-gray-500">({tauser.codigo})</span>
                    </div>
                    
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{tauser.direccion}</p>
                        <p>{tauser.ciudad}, {tauser.departamento}</p>
                      </div>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="flex-shrink-0 ml-4">
                      <div className="w-5 h-5 bg-zinc-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            No hay terminales de autoservicio disponibles en este momento.
          </p>
        </div>
      )}

      {/* Botones de navegación */}
      <div className="flex justify-between items-center gap-3">
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
            onClick={onAvanzar}
            disabled={!puedeAvanzar}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              puedeAvanzar
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
