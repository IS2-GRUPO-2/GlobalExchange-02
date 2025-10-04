import React, { useState, useEffect } from 'react';
import type { TarjetaCatalogo } from '../types/MetodoFinanciero';

interface TarjetaCatalogoFormProps {
  marca?: TarjetaCatalogo;
  onSubmit: (marcaData: TarjetaCatalogo) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const TarjetaCatalogoForm: React.FC<TarjetaCatalogoFormProps> = ({
  marca,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<TarjetaCatalogo>({
    marca: '',
    comision_compra: 0,
    comision_venta: 0,
    comision_personalizada_compra: false,
    comision_personalizada_venta: false,
    is_active: true
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (marca) {
      setFormData(marca);
    }
  }, [marca]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: {[key: string]: string} = {};
    if (!formData.marca.trim()) {
      newErrors.marca = 'La marca es requerida';
    }
    if (formData.comision_compra < 0) {
      newErrors.comision_compra = 'La comisión de compra no puede ser negativa';
    }
    if (formData.comision_venta < 0) {
      newErrors.comision_venta = 'La comisión de venta no puede ser negativa';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      await onSubmit(formData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              name.includes('comision') ? parseFloat(value) || 0 : 
              value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        {/* Marca */}
        <div>
          <label htmlFor="marca" className="block text-sm font-medium text-gray-700 mb-1">
            Marca <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="marca"
            id="marca"
            value={formData.marca}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.marca ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej: Visa, Mastercard, American Express"
            disabled={isSubmitting}
          />
          {errors.marca && (
            <p className="mt-1 text-sm text-red-600">{errors.marca}</p>
          )}
        </div>

        {/* Comisión Compra */}
        <div>
          <label htmlFor="comision_compra" className="block text-sm font-medium text-gray-700 mb-1">
            Comisión Compra (%)
          </label>
          <input
            type="number"
            name="comision_compra"
            id="comision_compra"
            step="0.01"
            min="0"
            value={formData.comision_compra}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.comision_compra ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej: 2.5"
            disabled={isSubmitting}
          />
          {errors.comision_compra && (
            <p className="mt-1 text-sm text-red-600">{errors.comision_compra}</p>
          )}
        </div>

        {/* Comisión Venta */}
        <div>
          <label htmlFor="comision_venta" className="block text-sm font-medium text-gray-700 mb-1">
            Comisión Venta (%)
          </label>
          <input
            type="number"
            name="comision_venta"
            id="comision_venta"
            step="0.01"
            min="0"
            value={formData.comision_venta}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.comision_venta ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej: 3.0"
            disabled={isSubmitting}
          />
          {errors.comision_venta && (
            <p className="mt-1 text-sm text-red-600">{errors.comision_venta}</p>
          )}
        </div>

        {/* Comisión Personalizada Compra */}
        <div className="flex items-center">
          <input
            id="comision_personalizada_compra"
            name="comision_personalizada_compra"
            type="checkbox"
            checked={formData.comision_personalizada_compra}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isSubmitting}
          />
          <label htmlFor="comision_personalizada_compra" className="ml-2 block text-sm text-gray-700">
            Permite comisión personalizada para compra
          </label>
        </div>

        {/* Comisión Personalizada Venta */}
        <div className="flex items-center">
          <input
            id="comision_personalizada_venta"
            name="comision_personalizada_venta"
            type="checkbox"
            checked={formData.comision_personalizada_venta}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isSubmitting}
          />
          <label htmlFor="comision_personalizada_venta" className="ml-2 block text-sm text-gray-700">
            Permite comisión personalizada para venta
          </label>
        </div>

        {/* Estado */}
        <div className="flex items-center">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isSubmitting}
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
            Marca activa
          </label>
        </div>
      </div>

      {/* Botones */}
      <div className="flex space-x-3 pt-4">
        <button
          disabled={isSubmitting}
          type="submit"
          className="flex-1 btn-primary text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isSubmitting ? 'Procesando...' : marca ? 'Actualizar' : 'Crear'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default TarjetaCatalogoForm;
