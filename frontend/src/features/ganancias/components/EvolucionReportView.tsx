/**
 * Evolución Temporal Report View Component
 * Shows profit evolution over time with filters
 */

import { useState, useEffect } from 'react';
import type { FiltrosEvolucionReport, GananciaEvolucionTemporal } from '../types/Ganancia';
import { getEvolucionTemporal } from '../services/gananciaService';
import { EvolucionTemporalChart } from './EvolucionTemporalChart';

interface Props {
  divisas: Array<{ id?: number; codigo: string; nombre: string }>;
  metodos: Array<{ id?: number; nombre: string }>;
}

export const EvolucionReportView = ({ divisas, metodos }: Props) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [filtros, setFiltros] = useState<FiltrosEvolucionReport>({
    periodo_tipo: 'mes',
    anio: currentYear,
    mes: currentMonth,
  });
  const [data, setData] = useState<GananciaEvolucionTemporal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Build query params based on periodo_tipo
        const queryParams: any = {
          operacion: filtros.operacion,
          divisa_extranjera: filtros.divisa_extranjera,
          metodo_financiero: filtros.metodo_financiero,
        };

        if (filtros.periodo_tipo === 'mes') {
          // For month: show daily evolution
          queryParams.granularidad = 'dia';
          queryParams.anio = filtros.anio;
          queryParams.mes = filtros.mes;
        } else {
          // For year: show monthly evolution
          queryParams.granularidad = 'mes';
          queryParams.anio = filtros.anio;
        }

        const result = await getEvolucionTemporal(queryParams);
        setData(result);
      } catch (error) {
        console.error('Error fetching evolucion report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [JSON.stringify(filtros)]);

  const handleFilterChange = (key: keyof FiltrosEvolucionReport, value: any) => {
    setFiltros((prev) => {
      const newFiltros = {
        ...prev,
        [key]: value === '' ? undefined : value,
      };

      // If periodo_tipo changes to 'anio', clear mes
      if (key === 'periodo_tipo' && value === 'anio') {
        delete newFiltros.mes;
      }
      
      // If changing to 'mes', set current month
      if (key === 'periodo_tipo' && value === 'mes' && !newFiltros.mes) {
        newFiltros.mes = currentMonth;
      }

      return newFiltros;
    });
  };

  const handleReset = () => {
    setFiltros({
      periodo_tipo: 'mes',
      anio: currentYear,
      mes: currentMonth,
    });
  };

  // Generate year options (last 5 years)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  // Generate month options
  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

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

          {/* Period Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período
            </label>
            <select
              value={filtros.periodo_tipo}
              onChange={(e) =>
                handleFilterChange('periodo_tipo', e.target.value as 'mes' | 'anio')
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="mes">Por Día</option>
              <option value="anio">Por Mes</option>
            </select>
          </div>
        </div>

        {/* Date Selection Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Year Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Año
            </label>
            <select
              value={filtros.anio}
              onChange={(e) => handleFilterChange('anio', Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Month Selection (only when periodo_tipo is 'mes') */}
          {filtros.periodo_tipo === 'mes' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mes
              </label>
              <select
                value={filtros.mes || currentMonth}
                onChange={(e) => handleFilterChange('mes', Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow p-6">
        <EvolucionTemporalChart data={data} loading={loading} />
      </div>
    </div>
  );
};
