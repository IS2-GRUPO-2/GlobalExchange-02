/**
 * Por Divisas Report View Component
 * Shows profit breakdown by currency with filters
 */

import { useState, useEffect } from 'react';
import type { FiltrosPorDivisaReport, GananciaPorDivisa } from '../types/Ganancia';
import { getGananciasPorDivisa } from '../services/gananciaService';
import { GananciasPorDivisaChart } from './GananciasPorDivisaChart';

interface Props {
  metodos: Array<{ id: number; nombre: string }>;
}

export const PorDivisasReportView = ({ metodos }: Props) => {
  const [filtros, setFiltros] = useState<FiltrosPorDivisaReport>({});
  const [data, setData] = useState<GananciaPorDivisa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getGananciasPorDivisa(filtros);
        setData(result);
      } catch (error) {
        console.error('Error fetching por divisas report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [JSON.stringify(filtros)]);

  const handleFilterChange = (key: keyof FiltrosPorDivisaReport, value: any) => {
    setFiltros((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  };

  const handleReset = () => {
    setFiltros({});
  };

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          <button
            onClick={handleReset}
            className="text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rango de Fechas
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={filtros.fecha_inicio || ''}
                onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Desde"
              />
              <input
                type="date"
                value={filtros.fecha_fin || ''}
                onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Hasta"
              />
            </div>
          </div>

          {/* Tipo de Operación Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Operación
            </label>
            <select
              value={filtros.operacion || ''}
              onChange={(e) =>
                handleFilterChange('operacion', e.target.value as 'compra' | 'venta' | undefined)
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="">Todas</option>
              <option value="compra">Compra</option>
              <option value="venta">Venta</option>
            </select>
          </div>

          {/* Metodo Financiero Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Método de Pago
            </label>
            <select
              value={filtros.metodo_financiero || ''}
              onChange={(e) =>
                handleFilterChange('metodo_financiero', e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="">Todos los métodos</option>
              {metodos.map((metodo) => (
                <option key={metodo.id} value={metodo.id}>
                  {metodo.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow p-6">
        <GananciasPorDivisaChart data={data} loading={loading} />
      </div>
    </div>
  );
};
