/**
 * Pie chart component for Comparativa Compra vs Venta
 */

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ComparativaOperaciones } from '../types/Ganancia';

interface Props {
  data: ComparativaOperaciones | null;
  loading?: boolean;
}

const COLORS = {
  compra: '#3b82f6', // blue
  venta: '#10b981',  // green
};

export const ComparativaOperacionesChart = ({ data, loading }: Props) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No hay datos disponibles</p>
      </div>
    );
  }

  // Transform data for pie chart
  const chartData = [
    {
      name: 'Compra',
      value: parseFloat(data.compra.total_ganancia),
      operaciones: data.compra.cantidad_operaciones,
      promedio: parseFloat(data.compra.ganancia_promedio),
      porcentaje: data.compra.porcentaje_total,
    },
    {
      name: 'Venta',
      value: parseFloat(data.venta.total_ganancia),
      operaciones: data.venta.cantidad_operaciones,
      promedio: parseFloat(data.venta.ganancia_promedio),
      porcentaje: data.venta.porcentaje_total,
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border border-gray-300 p-3 rounded shadow-lg">
          <p className="font-semibold mb-1">{item.name}</p>
          <p className="text-sm">
            Ganancia:{' '}
            <span className="font-semibold text-green-600">
              {new Intl.NumberFormat('es-PY', {
                style: 'currency',
                currency: 'PYG',
                minimumFractionDigits: 0,
              }).format(item.value)}
            </span>
          </p>
          <p className="text-sm">Operaciones: {item.operaciones}</p>
          <p className="text-sm">
            Promedio:{' '}
            {new Intl.NumberFormat('es-PY', {
              style: 'currency',
              currency: 'PYG',
              minimumFractionDigits: 0,
            }).format(item.promedio)}
          </p>
          <p className="text-sm font-semibold mt-1">{item.porcentaje.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">Comparativa: Compra vs Venta</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, porcentaje }) => `${name}: ${porcentaje.toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.compra : COLORS.venta} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">COMPRA</h4>
          <p className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat('es-PY', {
              style: 'currency',
              currency: 'PYG',
              minimumFractionDigits: 0,
            }).format(parseFloat(data.compra.total_ganancia))}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {data.compra.cantidad_operaciones} operaciones
          </p>
          <p className="text-sm text-gray-600">
            Promedio:{' '}
            {new Intl.NumberFormat('es-PY', {
              style: 'currency',
              currency: 'PYG',
              minimumFractionDigits: 0,
            }).format(parseFloat(data.compra.ganancia_promedio))}
          </p>
          <p className="text-lg font-semibold text-gray-700 mt-2">
            {data.compra.porcentaje_total.toFixed(1)}%
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">VENTA</h4>
          <p className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat('es-PY', {
              style: 'currency',
              currency: 'PYG',
              minimumFractionDigits: 0,
            }).format(parseFloat(data.venta.total_ganancia))}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {data.venta.cantidad_operaciones} operaciones
          </p>
          <p className="text-sm text-gray-600">
            Promedio:{' '}
            {new Intl.NumberFormat('es-PY', {
              style: 'currency',
              currency: 'PYG',
              minimumFractionDigits: 0,
            }).format(parseFloat(data.venta.ganancia_promedio))}
          </p>
          <p className="text-lg font-semibold text-gray-700 mt-2">
            {data.venta.porcentaje_total.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
};
