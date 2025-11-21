/**
 * Main Ganancias Dashboard Page
 */

import { useState, useEffect } from 'react';
import type { GananciaFiltros, ComparativaOperaciones, GananciaTopTransaccion } from '../types/Ganancia';
import { useGananciaStats, useGananciasPorDivisa, useEvolucionTemporal } from '../hooks';
import { getComparativaOperaciones, getTopTransacciones } from '../services/gananciaService';
import { getDivisas } from '../../divisas/services/divisaService';
import { getMetodosFinancieros } from '../../metodos_financieros/services/metodoFinancieroService';
import { GananciaStatsCards } from '../components/GananciaStatsCards';
import { GananciasPorDivisaChart } from '../components/GananciasPorDivisaChart';
import { EvolucionTemporalChart } from '../components/EvolucionTemporalChart';
import { ComparativaOperacionesChart } from '../components/ComparativaOperacionesChart';
import { FiltrosGanancias } from '../components/FiltrosGanancias';

interface Divisa {
  id: number;
  codigo: string;
  nombre: string;
}

interface MetodoFinanciero {
  id: number;
  nombre: string;
}

export const GananciasPage = () => {
  const [filtros, setFiltros] = useState<GananciaFiltros>({ granularidad: 'mes', limit: 10 });
  const [comparativa, setComparativa] = useState<ComparativaOperaciones | null>(null);
  const [topTransacciones, setTopTransacciones] = useState<GananciaTopTransaccion[]>([]);
  const [loadingComparativa, setLoadingComparativa] = useState(true);
  const [loadingTop, setLoadingTop] = useState(true);
  
  // State for filters data
  const [divisas, setDivisas] = useState<Divisa[]>([]);
  const [metodos, setMetodos] = useState<MetodoFinanciero[]>([]);

  // Use custom hooks
  const { stats, loading: loadingStats } = useGananciaStats(filtros);
  const { data: dataByDivisa, loading: loadingDivisa } = useGananciasPorDivisa(filtros);
  const { data: evolucion, loading: loadingEvolucion } = useEvolucionTemporal(filtros);

  // Fetch divisas and metodos for filters
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        // Fetch divisas (excluding base currency)
        const divisasResponse = await getDivisas({ es_base: false, page_size: 100 });
        setDivisas(divisasResponse.results || []);
        
        // Fetch metodos financieros
        const metodosResponse = await getMetodosFinancieros({ page_size: 100 });
        setMetodos(metodosResponse.results || []);
      } catch (error) {
        console.error('Error fetching filters data:', error);
      }
    };

    fetchFiltersData();
  }, []);

  // Fetch comparativa and top transactions when filters change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingComparativa(true);
        const comp = await getComparativaOperaciones(filtros);
        setComparativa(comp);
      } catch (error) {
        console.error('Error fetching comparativa:', error);
      } finally {
        setLoadingComparativa(false);
      }

      try {
        setLoadingTop(true);
        const top = await getTopTransacciones(filtros);
        setTopTransacciones(top);
      } catch (error) {
        console.error('Error fetching top transacciones:', error);
      } finally {
        setLoadingTop(false);
      }
    };

    fetchData();
  }, [JSON.stringify(filtros)]);

  const handleFilterChange = (newFiltros: GananciaFiltros) => {
    setFiltros({ ...newFiltros, granularidad: newFiltros.granularidad || 'mes', limit: 10 });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Reportes de Ganancias</h1>
          <p className="text-gray-600 mt-2">
            Análisis completo de ganancias generadas por operaciones de cambio
          </p>
        </div>

        {/* Filters */}
        <FiltrosGanancias 
          onFilterChange={handleFilterChange} 
          divisas={divisas} 
          metodos={metodos}
        />

        {/* Stats Cards */}
        <div className="mb-6">
          <GananciaStatsCards stats={stats} loading={loadingStats} />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Ganancias por Divisa */}
          <div className="bg-white rounded-lg shadow p-6">
            <GananciasPorDivisaChart data={dataByDivisa} loading={loadingDivisa} />
          </div>

          {/* Comparativa Compra vs Venta */}
          <div className="bg-white rounded-lg shadow p-6">
            <ComparativaOperacionesChart data={comparativa} loading={loadingComparativa} />
          </div>
        </div>

        {/* Evolución Temporal - Full Width */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <EvolucionTemporalChart data={evolucion} loading={loadingEvolucion} />
        </div>

        {/* Top Transacciones */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top 10 Transacciones con Mayor Ganancia</h3>
          {loadingTop ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500">Cargando...</p>
            </div>
          ) : topTransacciones.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500">No hay datos disponibles</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Fecha</th>
                    <th className="px-4 py-2 text-left">Cliente</th>
                    <th className="px-4 py-2 text-left">Divisa</th>
                    <th className="px-4 py-2 text-left">Operación</th>
                    <th className="px-4 py-2 text-right">Monto</th>
                    <th className="px-4 py-2 text-right">Tasa</th>
                    <th className="px-4 py-2 text-right">Ganancia</th>
                    <th className="px-4 py-2 text-left">Método</th>
                  </tr>
                </thead>
                <tbody>
                  {topTransacciones.map((item) => (
                    <tr key={item.transaccion_id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs">{item.transaccion_id}</td>
                      <td className="px-4 py-2">
                        {new Date(item.fecha).toLocaleDateString('es-PY')}
                      </td>
                      <td className="px-4 py-2">{item.cliente_nombre}</td>
                      <td className="px-4 py-2 font-semibold">{item.divisa_codigo}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            item.operacion === 'compra'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {item.operacion.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {parseFloat(item.monto_divisa).toLocaleString('es-PY', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-xs">
                        {parseFloat(item.tasa_aplicada).toLocaleString('es-PY')}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-green-600">
                        {new Intl.NumberFormat('es-PY', {
                          style: 'currency',
                          currency: 'PYG',
                          minimumFractionDigits: 0,
                        }).format(parseFloat(item.ganancia_neta))}
                      </td>
                      <td className="px-4 py-2">
                        {item.metodo_nombre || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
