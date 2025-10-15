import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  getPreferenciasUsuario,
  updatePreferenciasUsuario
} from '../services/notificacionService';
import { getDivisasConTasa } from '../../divisas/services/divisaService';
import { type PreferenciaNotificacionUsuario } from '../types/Notificacion';
import { type Divisa } from '../../divisas/types/Divisa';

const NotificationSettingsUsuario = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferencias, setPreferencias] = useState<PreferenciaNotificacionUsuario | null>(null);
  const [divisasDisponibles, setDivisasDisponibles] = useState<Divisa[]>([]);
  const [divisasSeleccionadas, setDivisasSeleccionadas] = useState<number[]>([]);
  const [notificacionesActivas, setNotificacionesActivas] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar divisas paginadas
      let allDivisas: Divisa[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await getDivisasConTasa({ page });
        const divisas = response.results.filter((d) => !d.es_base); // Filtrar divisa base
        allDivisas = [...allDivisas, ...divisas];
        hasMore = !!response.next;
        page++;
      }

      setDivisasDisponibles(allDivisas);

      // Cargar preferencias
      const prefs = await getPreferenciasUsuario();
      setNotificacionesActivas(prefs.notificaciones_activas);
      setDivisasSeleccionadas(prefs.divisas_suscritas);
    } catch (error: any) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDivisa = (divisaId: number) => {
    setDivisasSeleccionadas(prev => {
      if (prev.includes(divisaId)) {
        return prev.filter(id => id !== divisaId);
      } else {
        return [...prev, divisaId];
      }
    });
  };

  const handleSelectAll = () => {
    setDivisasSeleccionadas(divisasDisponibles.map(d => d.id));
  };

  const handleDeselectAll = () => {
    setDivisasSeleccionadas([]);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updatePreferenciasUsuario({
        notificaciones_activas: notificacionesActivas,
        divisas_suscritas: divisasSeleccionadas,
      });
      toast.success("Preferencias guardadas exitosamente");
    } catch (error: any) {
      console.error("Error guardando preferencias:", error);
      toast.error("Error al guardar las preferencias");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

   return (
    <div className="space-y-6">
      {/* Toggle Principal */}
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="font-semibold text-gray-900">
              Recibir notificaciones personales
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {notificacionesActivas
                ? "Recibirás emails cuando cambien las tasas seleccionadas"
                : "No recibirás notificaciones de cambio de tasa"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotificacionesActivas(!notificacionesActivas)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notificacionesActivas ? "bg-purple-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notificacionesActivas ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>
      </div>

      {/* Selector de Divisas */}
      {notificacionesActivas && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">
              Divisas de interés ({divisasSeleccionadas.length}/
              {divisasDisponibles.length})
            </h4>
            <div className="space-x-2 text-sm">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-purple-600 hover:text-purple-800 font-medium"
              >
                Seleccionar todas
              </button>
              <span className="text-gray-400">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-purple-600 hover:text-purple-800 font-medium"
              >
                Deseleccionar todas
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {divisasDisponibles.map((divisa) => {
              const seleccionada = divisasSeleccionadas.includes(divisa.id!);

              return (
                <label
                  key={divisa.id}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    seleccionada
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={seleccionada}
                    onChange={() => handleToggleDivisa(divisa.id!)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {divisa.simbolo} {divisa.codigo}
                  </span>
                </label>
              );
            })}
          </div>

          {divisasSeleccionadas.length === 0 && (
            <p className="mt-3 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              No has seleccionado ninguna divisa. No recibirás notificaciones.
            </p>
          )}
        </div>
      )}

      {/* Botón Guardar */}
      <div className="flex justify-end pt-4 border-t">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Guardando...</span>
            </>
          ) : (
            <span>Guardar cambios</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationSettingsUsuario;