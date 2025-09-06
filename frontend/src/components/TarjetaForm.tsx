import React, { useState } from "react";
import type { Tarjeta } from "../types/MetodoFinanciero";

export interface TarjetaFormData {
  stripe_payment_method_id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  titular: string;
  metodo_financiero_detalle: number;
}

interface TarjetaFormProps {
  onSubmit: (data: TarjetaFormData) => void;
  initialData?: Partial<Tarjeta>;
  isSubmitting?: boolean;
}

const TarjetaForm: React.FC<TarjetaFormProps> = ({
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<TarjetaFormData>({
    stripe_payment_method_id: initialData?.stripe_payment_method_id || "",
    brand: initialData?.brand || "",
    last4: initialData?.last4 || "",
    exp_month: initialData?.exp_month || new Date().getMonth() + 1,
    exp_year: initialData?.exp_year || new Date().getFullYear(),
    titular: initialData?.titular || "",
    metodo_financiero_detalle: initialData?.metodo_financiero_detalle || 0,
  });

  const [errors, setErrors] = useState<Partial<TarjetaFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<TarjetaFormData> = {};

    if (!formData.stripe_payment_method_id.trim()) {
      newErrors.stripe_payment_method_id = "El ID de método de pago es requerido";
    }

    if (!formData.brand.trim()) {
      newErrors.brand = "La marca de la tarjeta es requerida";
    }

    if (!formData.last4.trim()) {
      newErrors.last4 = "Los últimos 4 dígitos son requeridos";
    } else if (!/^\d{4}$/.test(formData.last4)) {
      newErrors.last4 = "Deben ser exactamente 4 dígitos";
    }

    if (!formData.titular.trim()) {
      newErrors.titular = "El titular es requerido";
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (formData.exp_year < currentYear || 
        (formData.exp_year === currentYear && formData.exp_month < currentMonth)) {
      newErrors.exp_month = "La tarjeta está vencida";
    }

    if (formData.exp_month < 1 || formData.exp_month > 12) {
      newErrors.exp_month = "Mes inválido";
    }

    if (formData.exp_year < currentYear || formData.exp_year > currentYear + 20) {
      newErrors.exp_year = "Año inválido";
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

  const handleInputChange = (field: keyof TarjetaFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = field === 'exp_month' || field === 'exp_year' 
      ? parseInt(e.target.value) 
      : e.target.value;
      
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const brandOptions = [
    'Visa',
    'Mastercard',
    'American Express',
    'Diners Club',
    'Discover',
    'JCB',
    'Union Pay',
    'Otra'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="stripe_payment_method_id" className="block text-sm font-medium text-gray-700">
          ID Método de Pago
        </label>
        <input
          type="text"
          id="stripe_payment_method_id"
          value={formData.stripe_payment_method_id}
          onChange={handleInputChange('stripe_payment_method_id')}
          className={`mt-1 block w-full rounded-md border ${
            errors.stripe_payment_method_id ? 'border-red-300' : 'border-gray-300'
          } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
          placeholder="stripe"
        />
        {errors.stripe_payment_method_id && (
          <p className="mt-1 text-sm text-red-600">{errors.stripe_payment_method_id}</p>
        )}
      </div>

      <div>
        <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
          Marca
        </label>
        <select
          id="brand"
          value={formData.brand}
          onChange={handleInputChange('brand')}
          className={`mt-1 block w-full rounded-md border ${
            errors.brand ? 'border-red-300' : 'border-gray-300'
          } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
        >
          <option value="">Seleccionar marca...</option>
          {brandOptions.map(brand => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
        {errors.brand && <p className="mt-1 text-sm text-red-600">{errors.brand}</p>}
      </div>

      <div>
        <label htmlFor="last4" className="block text-sm font-medium text-gray-700">
          Últimos 4 dígitos
        </label>
        <input
          type="text"
          id="last4"
          value={formData.last4}
          onChange={handleInputChange('last4')}
          maxLength={4}
          className={`mt-1 block w-full rounded-md border ${
            errors.last4 ? 'border-red-300' : 'border-gray-300'
          } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
          placeholder="1234"
        />
        {errors.last4 && <p className="mt-1 text-sm text-red-600">{errors.last4}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="exp_month" className="block text-sm font-medium text-gray-700">
            Mes de vencimiento
          </label>
          <select
            id="exp_month"
            value={formData.exp_month}
            onChange={handleInputChange('exp_month')}
            className={`mt-1 block w-full rounded-md border ${
              errors.exp_month ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
          >
            {months.map(month => (
              <option key={month} value={month}>
                {month.toString().padStart(2, '0')}
              </option>
            ))}
          </select>
          {errors.exp_month && <p className="mt-1 text-sm text-red-600">{errors.exp_month}</p>}
        </div>

        <div>
          <label htmlFor="exp_year" className="block text-sm font-medium text-gray-700">
            Año de vencimiento
          </label>
          <select
            id="exp_year"
            value={formData.exp_year}
            onChange={handleInputChange('exp_year')}
            className={`mt-1 block w-full rounded-md border ${
              errors.exp_year ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {errors.exp_year && <p className="mt-1 text-sm text-red-600">{errors.exp_year}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="titular" className="block text-sm font-medium text-gray-700">
          Titular
        </label>
        <input
          type="text"
          id="titular"
          value={formData.titular}
          onChange={handleInputChange('titular')}
          className={`mt-1 block w-full rounded-md border ${
            errors.titular ? 'border-red-300' : 'border-gray-300'
          } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
          placeholder="Nombre como aparece en la tarjeta"
        />
        {errors.titular && <p className="mt-1 text-sm text-red-600">{errors.titular}</p>}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Guardando..." : "Guardar Tarjeta"}
        </button>
      </div>
    </form>
  );
};

export default TarjetaForm;
