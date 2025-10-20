/**
 * Componente para configurar preferencias de notificación del cliente actual
 */

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getNotificacionTasaCliente,
  updateNotificacionTasaCliente,
} from "../services/notificacionService";
import { getDivisasConTasa } from "../../divisas/services/divisaService";
import { type NotificacionTasaCliente } from "../types/Notificacion";
import { type Divisa } from "../../divisas/types/Divisa";
import { useClientStore } from "../../../hooks/useClientStore";

const NotificationSettingsCliente = () => {
  const [loading, setLoading] = useState(false);
  const [preferencias, setPreferencias] =
    useState<NotificacionTasaCliente | null>(null);
  const [divisasDisponibles, setDivisasDisponibles] = useState<Divisa[]>([]);
  const [divisasSeleccionadas, setDivisasSeleccionadas] = useState<number[]>(
    []
  );
  const [notificacionesActivas, setNotificacionesActivas] = useState(true);
  const [noClienteActual, setNoClienteActual] = useState(false);
  const { selectedClient } = useClientStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setNoClienteActual(false);

      // Cargar divisas paginadas
      let allDivisas: Divisa[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await getDivisasConTasa({ page });
        const divisas = response.results.filter((d) => !d.es_base);
        allDivisas = [...allDivisas, ...divisas];
        hasMore = !!response.next;
        page++;
      }

      setDivisasDisponibles(allDivisas);

      // Cargar preferencias del cliente
      const prefsData = await getNotificacionTasaCliente();
      setPreferencias(prefsData);
      setDivisasDisponibles(allDivisas);
      setNotificacionesActivas(prefsData.is_active);
      setDivisasSeleccionadas(prefsData.divisas_suscritas);
    } catch (error: any) {
      console.error("Error cargando configuración:", error);

      if (error.response?.data?.error?.includes("cliente seleccionado")) {
        setNoClienteActual(true);
      } else {
        toast.error("Error al cargar la configuración del cliente");
      }
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // Escuchar cambios del cliente desde ClientPicker
  // ===================================================
  useEffect(() => {
    if (!selectedClient) {
      setNoClienteActual(true);
      setPreferencias(null);
      setDivisasSeleccionadas([]);
      return;
    }

    loadData();
  }, [selectedClient]);

  const handleToggleDivisa = (divisaId: number) => {
    setDivisasSeleccionadas((prev) => {
      if (prev.includes(divisaId)) {
        return prev.filter((id) => id !== divisaId);
      } else {
        return [...prev, divisaId];
      }
    });
  };

  const handleSelectAll = () => {
    setDivisasSeleccionadas(divisasDisponibles.map((d) => d.id!));
  };

  const handleDeselectAll = () => {
    setDivisasSeleccionadas([]);
  };

  const handleSave = async () => {
    try {
      await updateNotificacionTasaCliente({
        is_active: notificacionesActivas,
        divisas_suscritas: divisasSeleccionadas,
      });

      toast.success("Preferencias del cliente guardadas");
    } catch (error: any) {
      console.error("Error guardando preferencias:", error);
      toast.error("Error al guardar las preferencias");
    } finally {
      await loadData(); // refrescar estado real
    }
  };

  // ===============================
  // Detectar si hubo cambios
  // ===============================
  const hasChanges =
    notificacionesActivas !== preferencias?.is_active ||
    JSON.stringify([...divisasSeleccionadas].sort()) !==
      JSON.stringify([...(preferencias?.divisas_suscritas ?? [])].sort());

  if (noClienteActual) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-yellow-800">
              No hay cliente seleccionado
            </h3>
            <p className="mt-2 text-sm text-yellow-700">
              Debes seleccionar un cliente activo para configurar las
              preferencias de notificación.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        {preferencias && (
          <p className="text-gray-600 text-sm">
            Configura las notificaciones para{" "}
            <strong>{preferencias.cliente_nombre}</strong>.
          </p>
        )}
      </div>

      {/* Toggle Principal */}
      <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Recibir notificaciones de cambio de tasa
            </p>
          </div>
          <button
            onClick={() => setNotificacionesActivas(!notificacionesActivas)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notificacionesActivas ? "bg-indigo-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notificacionesActivas ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Selección de Divisas */}
      {notificacionesActivas && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">
              Divisas de interés ({divisasSeleccionadas.length}/
              {divisasDisponibles.length})
            </h4>
            <div className="space-x-2">
              <button
                onClick={handleSelectAll}
                className="text-sm text-gray-800 hover:text-gray-900 font-medium"
              >
                Seleccionar todas
              </button>
              <span className="text-gray-400">|</span>
              <button
                onClick={handleDeselectAll}
                className="text-sm text-gray-800 hover:text-gray-900 font-medium"
              >
                Deseleccionar todas
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {divisasDisponibles.map((divisa) => (
              <label
                key={divisa.id}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  divisasSeleccionadas.includes(divisa.id!)
                    ? "border-gray-500 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={divisasSeleccionadas.includes(divisa.id!)}
                  onChange={() => handleToggleDivisa(divisa.id!)}
                  className="w-4 h-4 text-gray-600 rounded focus:ring-gray-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {divisa.simbolo} {divisa.codigo}
                </span>
              </label>
            ))}
          </div>

          {divisasSeleccionadas.length === 0 && (
            <p className="mt-3 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              No hay divisas seleccionadas para el cliente.
            </p>
          )}
        </div>
      )}

      {/* Botones de Acción */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          onClick={loadData}
          disabled={loading || !hasChanges}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={loading || !hasChanges}
          className="bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
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

export default NotificationSettingsCliente;
