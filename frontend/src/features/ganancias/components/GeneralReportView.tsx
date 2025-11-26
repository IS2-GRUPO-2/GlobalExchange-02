/**
 * General Report View Component
 * Shows Compra vs Venta comparison with filters
 */

import { useState, useEffect } from 'react';
import type { FiltrosGeneralReport, ComparativaOperaciones } from '../types/Ganancia';
import { getComparativaOperaciones } from '../services/gananciaService';
import { ComparativaOperacionesChart } from './ComparativaOperacionesChart';
import { ExportButtons } from './ExportButtons';

interface Props {
  divisas: Array<{ id?: number; codigo: string; nombre: string }>;
  metodos: Array<{ id?: number; nombre: string }>;
}

export const GeneralReportView = ({ divisas, metodos }: Props) => {
  const [filtros, setFiltros] = useState<FiltrosGeneralReport>({});
  const [data, setData] = useState<ComparativaOperaciones | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getComparativaOperaciones(filtros);
        setData(result);
      } catch (error) {
        console.error('Error fetching general report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [JSON.stringify(filtros)]);

  const handleFilterChange = (key: keyof FiltrosGeneralReport, value: any) => {
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
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Limpiar filtros
            </button>
            <ExportButtons reportType="general" filtros={filtros} />
          </div>
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

          {/* Divisa Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Divisa
            </label>
            <select
              value={filtros.divisa_extranjera || ''}
              onChange={(e) =>
                handleFilterChange('divisa_extranjera', e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="">Todas las divisas</option>
              {divisas.map((divisa) => (
                <option key={divisa.id} value={divisa.id}>
                  {divisa.codigo} - {divisa.nombre}
                </option>
              ))}
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
        <ComparativaOperacionesChart data={data} loading={loading} />
      </div>
    </div>
  );
};
