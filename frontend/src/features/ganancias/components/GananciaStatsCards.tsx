/**
 * Stats cards component to display key metrics
 */

import type { EstadisticasGenerales } from '../types/Ganancia';

interface Props {
  stats: EstadisticasGenerales | null;
  loading?: boolean;
}

export const GananciaStatsCards = ({ stats, loading }: Props) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatCurrency = (value: string) =>
    new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
    }).format(parseFloat(value));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Ganancia */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <p className="text-sm font-medium text-gray-600">Ganancia Total</p>
        <p className="text-3xl font-bold mt-2 text-gray-900">{formatCurrency(stats.total_ganancia)}</p>
        <p className="text-xs text-gray-500 mt-2">
          {stats.total_operaciones} operaciones
        </p>
      </div>

      {/* Ganancia Promedio */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <p className="text-sm font-medium text-gray-600">Ganancia Promedio</p>
        <p className="text-3xl font-bold mt-2 text-gray-900">
          {formatCurrency(stats.ganancia_promedio_operacion)}
        </p>
        <p className="text-xs text-gray-500 mt-2">Por operación</p>
      </div>

      {/* Ganancia Máxima */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <p className="text-sm font-medium text-gray-600">Ganancia Máxima</p>
        <p className="text-3xl font-bold mt-2 text-gray-900">{formatCurrency(stats.ganancia_maxima)}</p>
        <p className="text-xs text-gray-500 mt-2">Mejor transacción</p>
      </div>

      {/* Operaciones */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <p className="text-sm font-medium text-gray-600">Total Operaciones</p>
        <p className="text-3xl font-bold mt-2 text-gray-900">{stats.total_operaciones}</p>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Compra: {stats.operaciones_compra}</span>
          <span>Venta: {stats.operaciones_venta}</span>
        </div>
      </div>
    </div>
  );
};
