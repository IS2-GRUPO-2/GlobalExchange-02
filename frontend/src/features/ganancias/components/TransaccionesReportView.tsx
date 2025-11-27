/**
 * Transacciones Report View Component
 * Shows transactions within a 30-day period with filters
 */

import { useState, useEffect } from 'react';
import type { FiltrosTransaccionesReport, GananciaTransaccion } from '../types/Ganancia';
import { getListadoTransacciones } from '../services/gananciaService';
import { ExportButtons } from './ExportButtons';

interface Props {
  divisas: Array<{ id?: number; codigo: string; nombre: string }>;
  metodos: Array<{ id?: number; nombre: string }>;
}

export const TransaccionesReportView = ({ divisas, metodos }: Props) => {
  // Calcular últimos 30 días por defecto
  const getDefaultDates = () => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30);
    
    return {
      fecha_inicio: inicio.toISOString().split('T')[0],
      fecha_fin: fin.toISOString().split('T')[0],
    };
  };

  const [filtros, setFiltros] = useState<FiltrosTransaccionesReport>(getDefaultDates());
  const [data, setData] = useState<GananciaTransaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Validar rango de fechas
        if (filtros.fecha_inicio && filtros.fecha_fin) {
          const inicio = new Date(filtros.fecha_inicio);
          const fin = new Date(filtros.fecha_fin);
          const diffDays = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays > 30) {
            setError('El rango de fechas no puede exceder 30 días');
            setLoading(false);
            return;
          }
          
          if (diffDays < 0) {
            setError('La fecha de inicio debe ser anterior a la fecha de fin');
            setLoading(false);
            return;
          }
        }
        
        const result = await getListadoTransacciones(filtros);
        setData(result);
      } catch (err: any) {
        console.error('Error fetching transacciones report:', err);
        setError(err.response?.data?.error || 'Error al cargar las transacciones');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [JSON.stringify(filtros)]);

  const handleFilterChange = (key: keyof FiltrosTransaccionesReport, value: any) => {
    setFiltros((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  };

  const handleReset = () => {
    setFiltros(getDefaultDates());
    setError(null);
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
            <ExportButtons reportType="transacciones" filtros={filtros} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rango de Fechas <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-2">(Máximo 30 días)</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={filtros.fecha_inicio || ''}
                onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Desde"
                required
              />
              <input
                type="date"
                value={filtros.fecha_fin || ''}
                onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Hasta"
                required
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm mt-1">{error}</p>
            )}
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Listado de Transacciones del Periodo
          </h3>
          {!loading && !error && (
            <span className="text-sm text-gray-600">
              {data.length} {data.length === 1 ? 'transacción' : 'transacciones'} encontradas
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
              <p className="text-gray-500">Cargando...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={handleReset}
                className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Restablecer filtros
              </button>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">No hay transacciones en el periodo seleccionado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
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
                {data.map((item) => (
                  <tr key={item.transaccion_id} className="border-b hover:bg-gray-50">
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
