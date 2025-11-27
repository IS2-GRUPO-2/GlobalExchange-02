/**
 * Line chart component for Evolución Temporal de Ganancias
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { GananciaEvolucionTemporal } from '../types/Ganancia';

interface Props {
  data: GananciaEvolucionTemporal[];
  loading?: boolean;
}

export const EvolucionTemporalChart = ({ data, loading }: Props) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No hay datos disponibles</p>
      </div>
    );
  }

  // Transform data for recharts
  const chartData = data.map((item) => ({
    periodo: item.periodo,
    ganancia: parseFloat(item.total_ganancia),
    operaciones: item.cantidad_operaciones,
    promedio: parseFloat(item.ganancia_promedio),
  }));

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">Evolución Temporal de Ganancias</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="periodo" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'operaciones') {
                return value.toFixed(0);
              }
              return new Intl.NumberFormat('es-PY', {
                style: 'currency',
                currency: 'PYG',
                minimumFractionDigits: 0,
              }).format(value);
            }}
          />
          <Legend />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="ganancia" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Ganancia Total"
            dot={{ fill: '#10b981' }}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="promedio" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Ganancia Promedio"
            dot={{ fill: '#3b82f6' }}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="operaciones" 
            stroke="#f59e0b" 
            strokeWidth={2}
            name="# Operaciones"
            dot={{ fill: '#f59e0b' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
