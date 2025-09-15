import React, { useState, useEffect } from 'react';
import type { Banco } from '../types/MetodoFinanciero';

interface BancoFormProps {
  banco?: Banco;
  onSubmit: (bancoData: Banco) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const BancoForm: React.FC<BancoFormProps> = ({
  banco,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<Banco>({
    nombre: '',
    cvu: '',
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (banco) {
      setFormData(banco);
    }
  }, [banco]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del banco es obligatorio';
    } else if (formData.nombre.length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    } else if (formData.nombre.length > 100) {
      newErrors.nombre = 'El nombre no puede exceder 100 caracteres';
    }

    if (!formData.cvu.trim()) {
      newErrors.cvu = 'El CVU del banco es obligatorio';
    } else if (formData.cvu.length !== 22) {
      newErrors.cvu = 'El CVU debe tener exactamente 22 dígitos';
    } else if (!/^\d+$/.test(formData.cvu)) {
      newErrors.cvu = 'El CVU solo puede contener números';
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
      console.error('Error submitting banco form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        {/* Nombre del Banco */}
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Banco
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
            placeholder="Ej: Santander, Itaú, BBVA"
            disabled={isSubmitting}
          />
          {errors.nombre && (
            <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
          )}
        </div>

        {/* CVU del Banco */}
        <div>
          <label htmlFor="cvu" className="block text-sm font-medium text-gray-700 mb-1">
            CVU del Banco
          </label>
          <input
            type="text"
            id="cvu"
            name="cvu"
            value={formData.cvu}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.cvu ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="22 dígitos del CVU del banco"
            disabled={isSubmitting}
            maxLength={22}
          />
          {errors.cvu && (
            <p className="mt-1 text-sm text-red-600">{errors.cvu}</p>
          )}
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
            Banco activo (disponible para uso)
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
          {isSubmitting ? 'Guardando...' : (banco ? 'Actualizar' : 'Crear')}
        </button>
      </div>
    </form>
  );
};

export default BancoForm;
