import React, { useState } from "react";
import type { MetodoFinanciero, TipoMetodoFinanciero } from "../types/MetodoFinanciero";

export type MetodoFinancieroFormData = {
  nombre: TipoMetodoFinanciero;
  permite_cobro: boolean;
  permite_pago: boolean;
  comision_cobro_porcentaje: string;
  comision_pago_porcentaje: string;
};

interface MetodoFinancieroFormProps {
  onSubmit: (data: MetodoFinancieroFormData) => void;
  onCancel: () => void;
  isEditForm: boolean;
  metodo: MetodoFinanciero | null;
}

const TIPOS_METODO_OPCIONES = [
  { value: 'TRANSFERENCIA_BANCARIA', label: 'Transferencia Bancaria' },
  { value: 'BILLETERA_DIGITAL', label: 'Billetera Digital' },
  { value: 'TARJETA', label: 'Tarjeta de Crédito/Débito' },
  { value: 'METALICO', label: 'Metálico' },
  { value: 'CHEQUE', label: 'Cheque' },
];

const MetodoFinancieroForm: React.FC<MetodoFinancieroFormProps> = ({
  onSubmit,
  onCancel,
  isEditForm,
  metodo,
}) => {
  const [formData, setFormData] = useState<MetodoFinancieroFormData>({
    nombre: metodo?.nombre || 'TRANSFERENCIA_BANCARIA',
    permite_cobro: metodo?.permite_cobro || true,
    permite_pago: metodo?.permite_pago || true,
    comision_cobro_porcentaje: metodo?.comision_cobro_porcentaje || '0.00',
    comision_pago_porcentaje: metodo?.comision_pago_porcentaje || '0.00',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validar comisiones (0-100)
    const cobro = parseFloat(formData.comision_cobro_porcentaje);
    const pago = parseFloat(formData.comision_pago_porcentaje);

    if (isNaN(cobro) || cobro < 0 || cobro > 100) {
      newErrors.comision_cobro_porcentaje = 'La comisión de cobro debe estar entre 0 y 100';
    }

    if (isNaN(pago) || pago < 0 || pago > 100) {
      newErrors.comision_pago_porcentaje = 'La comisión de pago debe estar entre 0 y 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">
        {isEditForm ? 'Editar Método Financiero' : 'Crear Método Financiero'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Método
          </label>
          <select
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {TIPOS_METODO_OPCIONES.map(opcion => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="permite_cobro"
                checked={formData.permite_cobro}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Permite Cobro</span>
            </label>
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="permite_pago"
                checked={formData.permite_pago}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Permite Pago</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="comision_cobro_porcentaje" className="block text-sm font-medium text-gray-700 mb-1">
            Comisión de Cobro (%)
          </label>
          <input
            type="number"
            id="comision_cobro_porcentaje"
            name="comision_cobro_porcentaje"
            value={formData.comision_cobro_porcentaje}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {errors.comision_cobro_porcentaje && (
            <p className="text-red-500 text-xs mt-1">{errors.comision_cobro_porcentaje}</p>
          )}
        </div>

        <div>
          <label htmlFor="comision_pago_porcentaje" className="block text-sm font-medium text-gray-700 mb-1">
            Comisión de Pago (%)
          </label>
          <input
            type="number"
            id="comision_pago_porcentaje"
            name="comision_pago_porcentaje"
            value={formData.comision_pago_porcentaje}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {errors.comision_pago_porcentaje && (
            <p className="text-red-500 text-xs mt-1">{errors.comision_pago_porcentaje}</p>
          )}
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isEditForm ? 'Actualizar' : 'Crear'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default MetodoFinancieroForm;
