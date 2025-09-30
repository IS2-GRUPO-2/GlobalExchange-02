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
    
    // Validación básica
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

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {marca ? 'Editar' : 'Crear'} Marca de Tarjeta
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure los detalles de la marca de tarjeta para el catálogo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Marca */}
          <div>
            <label htmlFor="marca" className="block text-sm font-medium text-gray-700">
              Marca <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="marca"
              id="marca"
              value={formData.marca}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.marca 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
              placeholder="Ej: Visa, Mastercard, American Express"
              disabled={isSubmitting}
            />
            {errors.marca && (
              <p className="mt-1 text-sm text-red-600">{errors.marca}</p>
            )}
          </div>

          {/* Comisiones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="comision_compra" className="block text-sm font-medium text-gray-700">
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
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.comision_compra 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
                disabled={isSubmitting}
              />
              {errors.comision_compra && (
                <p className="mt-1 text-sm text-red-600">{errors.comision_compra}</p>
              )}
            </div>

            <div>
              <label htmlFor="comision_venta" className="block text-sm font-medium text-gray-700">
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
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.comision_venta 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
                disabled={isSubmitting}
              />
              {errors.comision_venta && (
                <p className="mt-1 text-sm text-red-600">{errors.comision_venta}</p>
              )}
            </div>
          </div>

          {/* Comisiones Personalizadas */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="comision_personalizada_compra"
                name="comision_personalizada_compra"
                type="checkbox"
                checked={formData.comision_personalizada_compra}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={isSubmitting}
              />
              <label htmlFor="comision_personalizada_compra" className="ml-2 block text-sm text-gray-700">
                Permite configurar comisión personalizada para compra
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="comision_personalizada_venta"
                name="comision_personalizada_venta"
                type="checkbox"
                checked={formData.comision_personalizada_venta}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={isSubmitting}
              />
              <label htmlFor="comision_personalizada_venta" className="ml-2 block text-sm text-gray-700">
                Permite configurar comisión personalizada para venta
              </label>
            </div>
          </div>

          {/* Estado */}
          <div className="flex items-center">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Marca activa
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Procesando...' : marca ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TarjetaCatalogoForm;
