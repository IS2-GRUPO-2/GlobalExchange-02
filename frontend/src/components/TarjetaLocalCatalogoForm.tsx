import React, { useState, useEffect } from 'react';
import type { TarjetaLocalCatalogo } from '../features/financiero/types/MetodoFinanciero';

interface TarjetaLocalCatalogoFormProps {
  marca?: TarjetaLocalCatalogo;
  onSubmit: (marcaData: TarjetaLocalCatalogo) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const TarjetaLocalCatalogoForm: React.FC<TarjetaLocalCatalogoFormProps> = ({
  marca,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<TarjetaLocalCatalogo>({
    marca: '',
    comisiones: 0,
    comision_personalizada: false,
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (marca) {
      setFormData(marca);
    }
  }, [marca]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.marca.trim()) {
      newErrors.marca = 'La marca de la tarjeta es obligatoria';
    } else if (formData.marca.length < 2) {
      newErrors.marca = 'La marca debe tener al menos 2 caracteres';
    } else if (formData.marca.length > 100) {
      newErrors.marca = 'La marca no puede exceder 100 caracteres';
    }

    if (formData.comisiones < 0) {
      newErrors.comisiones = 'Las comisiones no pueden ser negativas';
    } else if (formData.comisiones > 100) {
      newErrors.comisiones = 'Las comisiones no pueden exceder 100%';
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
      console.error('Error submitting marca form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        {/* Marca de la Tarjeta */}
        <div>
          <label htmlFor="marca" className="block text-sm font-medium text-gray-700 mb-1">
            Marca de la Tarjeta Local
          </label>
          <input
            type="text"
            id="marca"
            name="marca"
            value={formData.marca}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.marca ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej: Visa, Mastercard, American Express, Cabal"
            disabled={isSubmitting}
          />
          {errors.marca && (
            <p className="mt-1 text-sm text-red-600">{errors.marca}</p>
          )}
        </div>

        {/* Comisiones */}
        <div>
          <label htmlFor="comisiones" className="block text-sm font-medium text-gray-700 mb-1">
            Comisiones (%)
          </label>
          <input
            type="number"
            id="comisiones"
            name="comisiones"
            value={formData.comisiones}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.comisiones ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej: 1.5"
            disabled={isSubmitting}
            step="0.01"
            min="0"
            max="100"
          />
          {errors.comisiones && (
            <p className="mt-1 text-sm text-red-600">{errors.comisiones}</p>
          )}
        </div>

        {/* Comisión Personalizada */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="comision_personalizada"
            name="comision_personalizada"
            checked={formData.comision_personalizada}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isSubmitting}
          />
          <label htmlFor="comision_personalizada" className="ml-2 block text-sm text-gray-700">
            Permite comisión personalizada
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
            Marca activa (disponible para uso)
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
          {isSubmitting ? 'Guardando...' : (marca ? 'Actualizar' : 'Crear')}
        </button>
      </div>
    </form>
  );
};

export default TarjetaLocalCatalogoForm;
