/**
 * Filters component for Ganancias dashboard
 */

import { useState } from 'react';
import type { GananciaFiltros } from '../types/Ganancia';

interface Props {
  onFilterChange: (filtros: GananciaFiltros) => void;
  divisas?: Array<{ id: number; codigo: string; nombre: string }>;
  metodos?: Array<{ id: number; nombre: string }>;
}

export const FiltrosGanancias = ({ onFilterChange, divisas = [], metodos = [] }: Props) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const [filtros, setFiltros] = useState<GananciaFiltros>({});

  const handleChange = (key: keyof GananciaFiltros, value: any) => {
    const newFiltros = {
      ...filtros,
      [key]: value === '' ? undefined : value,
    };
    setFiltros(newFiltros);
    onFilterChange(newFiltros);
  };

  const handleReset = () => {
    setFiltros({});
    onFilterChange({});
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Filtros</h3>
        <button
          onClick={handleReset}
          className="text-sm text-gray-700 hover:text-gray-900 font-medium"
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
            onChange={(e) => handleChange('divisa_extranjera', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las divisas</option>
            {divisas.map((divisa) => (
              <option key={divisa.id} value={divisa.id}>
                {divisa.codigo} - {divisa.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Operacion Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Operación
          </label>
          <select
            value={filtros.operacion || ''}
            onChange={(e) => handleChange('operacion', e.target.value as 'compra' | 'venta' | undefined)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            onChange={(e) => handleChange('metodo_financiero', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los métodos</option>
            {metodos.map((metodo) => (
              <option key={metodo.id} value={metodo.id}>
                {metodo.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Año Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Año
          </label>
          <select
            value={filtros.anio || ''}
            onChange={(e) => handleChange('anio', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Mes Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mes
          </label>
          <select
            value={filtros.mes || ''}
            onChange={(e) => handleChange('mes', e.target.value ? Number(e.target.value) : undefined)}
            className={`w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              !filtros.anio ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
            }`}
            disabled={!filtros.anio}
          >
            <option value="">Todos</option>
            <option value="1">Enero</option>
            <option value="2">Febrero</option>
            <option value="3">Marzo</option>
            <option value="4">Abril</option>
            <option value="5">Mayo</option>
            <option value="6">Junio</option>
            <option value="7">Julio</option>
            <option value="8">Agosto</option>
            <option value="9">Septiembre</option>
            <option value="10">Octubre</option>
            <option value="11">Noviembre</option>
            <option value="12">Diciembre</option>
          </select>
        </div>

        {/* Granularidad (for temporal evolution) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Granularidad
          </label>
          <select
            value={filtros.granularidad || 'mes'}
            onChange={(e) => handleChange('granularidad', e.target.value as 'mes' | 'dia')}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="mes">Por Mes</option>
            <option value="dia">Por Día</option>
          </select>
        </div>
      </div>
    </div>
  );
};
