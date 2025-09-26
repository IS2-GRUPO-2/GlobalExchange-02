import React, { useState, useEffect } from 'react';
import type { BilleteraDigitalCatalogo } from '../types/MetodoFinanciero';

interface BilleteraDigitalCatalogoFormProps {
  billetera?: BilleteraDigitalCatalogo;
  onSubmit: (billeteraData: BilleteraDigitalCatalogo) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const BilleteraDigitalCatalogoForm: React.FC<BilleteraDigitalCatalogoFormProps> = ({
  billetera,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<BilleteraDigitalCatalogo>({
    nombre: '',
    comision_compra: 0,
    comision_venta: 0,
    comision_personalizada_compra: false,
    comision_personalizada_venta: false,
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (billetera) {
      setFormData(billetera);
    }
  }, [billetera]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre de la billetera es obligatorio';
    } else if (formData.nombre.length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    } else if (formData.nombre.length > 100) {
      newErrors.nombre = 'El nombre no puede exceder 100 caracteres';
    }

    if (formData.comision_compra < 0) {
      newErrors.comision_compra = 'La comisión de compra no puede ser negativa';
    } else if (formData.comision_compra > 100) {
      newErrors.comision_compra = 'La comisión de compra no puede exceder 100%';
    }

    if (formData.comision_venta < 0) {
      newErrors.comision_venta = 'La comisión de venta no puede ser negativa';
    } else if (formData.comision_venta > 100) {
      newErrors.comision_venta = 'La comisión de venta no puede exceder 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting billetera digital catálogo form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        {/* Nombre de la Billetera */}
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la Billetera Digital
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.nombre ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej: PayPal, MercadoPago, Binance Pay, TigoMoney"
            disabled={isSubmitting}
          />
          {errors.nombre && (
            <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
          )}
        </div>

        {/* Comisión de Compra */}
        <div>
          <label htmlFor="comision_compra" className="block text-sm font-medium text-gray-700 mb-1">
            Comisión de Compra (%)
          </label>
          <input
            type="number"
            id="comision_compra"
            name="comision_compra"
            value={formData.comision_compra}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.comision_compra ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej: 3.0"
            disabled={isSubmitting}
            step="0.01"
            min="0"
            max="100"
          />
          {errors.comision_compra && (
            <p className="mt-1 text-sm text-red-600">{errors.comision_compra}</p>
          )}
        </div>

        {/* Comisión de Venta */}
        <div>
          <label htmlFor="comision_venta" className="block text-sm font-medium text-gray-700 mb-1">
            Comisión de Venta (%)
          </label>
          <input
            type="number"
            id="comision_venta"
            name="comision_venta"
            value={formData.comision_venta}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.comision_venta ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej: 3.5"
            disabled={isSubmitting}
            step="0.01"
            min="0"
            max="100"
          />
          {errors.comision_venta && (
            <p className="mt-1 text-sm text-red-600">{errors.comision_venta}</p>
          )}
        </div>

        {/* Comisión Personalizada Compra */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="comision_personalizada_compra"
            name="comision_personalizada_compra"
            checked={formData.comision_personalizada_compra}
            onChange={handleChange}
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
            type="checkbox"
            id="comision_personalizada_venta"
            name="comision_personalizada_venta"
            checked={formData.comision_personalizada_venta}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isSubmitting}
          />
          <label htmlFor="comision_personalizada_venta" className="ml-2 block text-sm text-gray-700">
            Permite comisión personalizada para venta
          </label>
        </div>

        {/* Estado Activo */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isSubmitting}
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
            Billetera activa (disponible para uso)
          </label>
        </div>
      </div>

      {/* Botones */}
      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Guardando...' : (billetera ? 'Actualizar' : 'Crear')}
        </button>
      </div>
    </form>
  );
};

export default BilleteraDigitalCatalogoForm;
