/**
 * Bar chart component for Ganancias por Divisa
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { GananciaPorDivisa } from '../types/Ganancia';

interface Props {
  data: GananciaPorDivisa[];
  loading?: boolean;
}

export const GananciasPorDivisaChart = ({ data, loading }: Props) => {
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
    divisa: item.divisa_codigo,
    ganancia: parseFloat(item.total_ganancia),
    operaciones: item.cantidad_operaciones,
    promedio: parseFloat(item.ganancia_promedio),
  }));

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">Ganancias por Divisa</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="divisa" />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => new Intl.NumberFormat('es-PY', {
              style: 'currency',
              currency: 'PYG',
              minimumFractionDigits: 0,
            }).format(value)}
          />
          <Legend />
          <Bar dataKey="ganancia" fill="#10b981" name="Ganancia Total" />
          <Bar dataKey="promedio" fill="#3b82f6" name="Ganancia Promedio" />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Summary table */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Divisa</th>
              <th className="px-4 py-2 text-right">Total Ganancia</th>
              <th className="px-4 py-2 text-right">Operaciones</th>
              <th className="px-4 py-2 text-right">Promedio</th>
              <th className="px-4 py-2 text-right">Total Operado</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.divisa_codigo} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{item.divisa_codigo}</td>
                <td className="px-4 py-2 text-right text-green-600 font-semibold">
                  {new Intl.NumberFormat('es-PY', {
                    style: 'currency',
                    currency: 'PYG',
                    minimumFractionDigits: 0,
                  }).format(parseFloat(item.total_ganancia))}
                </td>
                <td className="px-4 py-2 text-right">{item.cantidad_operaciones}</td>
                <td className="px-4 py-2 text-right">
                  {new Intl.NumberFormat('es-PY', {
                    style: 'currency',
                    currency: 'PYG',
                    minimumFractionDigits: 0,
                  }).format(parseFloat(item.ganancia_promedio))}
                </td>
                <td className="px-4 py-2 text-right">
                  {parseFloat(item.monto_total_operado).toLocaleString('es-PY', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
