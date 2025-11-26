/**
 * Top 10 Transacciones Report View Component
 * Shows top profitable transactions with filters
 */

import { useState, useEffect } from 'react';
import type { FiltrosTransaccionesReport, GananciaTransaccion } from '../types/Ganancia';
import { getListadoTransacciones } from '../services/gananciaService';

interface Props {
  divisas: Array<{ id?: number; codigo: string; nombre: string }>;
  metodos: Array<{ id?: number; nombre: string }>;
}

export const Top10ReportView = ({ divisas, metodos }: Props) => {
  const [filtros, setFiltros] = useState<FiltrosTransaccionesReport>({});
  const [data, setData] = useState<GananciaTransaccion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Note: listado_transacciones endpoint doesn't use limit parameter
        // It returns transactions in a date range (max 30 days)
        const result = await getListadoTransacciones(filtros);
        setData(result);
      } catch (error) {
        console.error('Error fetching top 10 report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [JSON.stringify(filtros)]);

  const handleFilterChange = (key: keyof FiltrosTransaccionesReport, value: any) => {
    setFiltros((prev: FiltrosTransaccionesReport) => ({
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
        </div>

        {/* Second row for Método de Pago */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
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
        <h3 className="text-lg font-semibold mb-4">Top 10 Transacciones con Mayor Ganancia</h3>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Cargando...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">No hay datos disponibles</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">#</th>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-4 py-3 text-left font-semibold">Divisa</th>
                  <th className="px-4 py-3 text-left font-semibold">Operación</th>
                  <th className="px-4 py-3 text-right font-semibold">Monto</th>
                  <th className="px-4 py-3 text-right font-semibold">Tasa</th>
                  <th className="px-4 py-3 text-left font-semibold">Método</th>
                  <th className="px-4 py-3 text-right font-semibold">Ganancia</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={item.transaccion_id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 text-gray-600">{item.transaccion_id}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(item.fecha).toLocaleDateString('es-PY')}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{item.cliente_nombre}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{item.divisa_codigo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          item.operacion === 'compra'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {item.operacion.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {parseFloat(item.monto_divisa).toLocaleString('es-PY', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {parseFloat(item.tasa_aplicada).toLocaleString('es-PY', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.metodo_nombre || 'N/A'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      {new Intl.NumberFormat('es-PY', {
                        style: 'currency',
                        currency: 'PYG',
                        minimumFractionDigits: 0,
                      }).format(parseFloat(item.ganancia_neta))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
