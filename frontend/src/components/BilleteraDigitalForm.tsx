import React, { useState } from "react";
import type { BilleteraDigital } from "../types/MetodoFinanciero";

export interface BilleteraDigitalFormData {
  plataforma: string;
  usuario_id: string;
  email: string;
  telefono?: string;
  metodo_financiero_detalle: number;
}

interface BilleteraDigitalFormProps {
  onSubmit: (data: BilleteraDigitalFormData) => void;
  initialData?: Partial<BilleteraDigital>;
  isSubmitting?: boolean;
}

const BilleteraDigitalForm: React.FC<BilleteraDigitalFormProps> = ({
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<BilleteraDigitalFormData>({
    plataforma: initialData?.plataforma || "",
    usuario_id: initialData?.usuario_id || "",
    email: initialData?.email || "",
    telefono: initialData?.telefono || "",
    metodo_financiero_detalle: initialData?.metodo_financiero_detalle || 0,
  });

  const [errors, setErrors] = useState<Partial<BilleteraDigitalFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<BilleteraDigitalFormData> = {};

    if (!formData.plataforma.trim()) {
      newErrors.plataforma = "La plataforma es requerida";
    }

    if (!formData.usuario_id.trim()) {
      newErrors.usuario_id = "El ID de usuario es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
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

  const handleInputChange = (field: keyof BilleteraDigitalFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const plataformasPopulares = [
    'MercadoPago',
    'PayPal',
    'Ualá',
    'Brubank',
    'Naranja X',
    'Personal Pay',
    'Todo Pago',
    'Otra'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="plataforma" className="block text-sm font-medium text-gray-700">
          Plataforma *
        </label>
        <select
          id="plataforma"
          value={formData.plataforma}
          onChange={handleInputChange('plataforma')}
          className={`mt-1 block w-full rounded-md border ${
            errors.plataforma ? 'border-red-300' : 'border-gray-300'
          } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
        >
          <option value="">Seleccionar plataforma...</option>
          {plataformasPopulares.map(plataforma => (
            <option key={plataforma} value={plataforma}>{plataforma}</option>
          ))}
        </select>
        {errors.plataforma && <p className="mt-1 text-sm text-red-600">{errors.plataforma}</p>}
      </div>

      <div>
        <label htmlFor="usuario_id" className="block text-sm font-medium text-gray-700">
          ID de Usuario *
        </label>
        <input
          type="text"
          id="usuario_id"
          value={formData.usuario_id}
          onChange={handleInputChange('usuario_id')}
          className={`mt-1 block w-full rounded-md border ${
            errors.usuario_id ? 'border-red-300' : 'border-gray-300'
          } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
          placeholder="Ej: usuario123, @usuario, etc."
        />
        {errors.usuario_id && <p className="mt-1 text-sm text-red-600">{errors.usuario_id}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email *
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={handleInputChange('email')}
          className={`mt-1 block w-full rounded-md border ${
            errors.email ? 'border-red-300' : 'border-gray-300'
          } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
          placeholder="usuario@ejemplo.com"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
          Teléfono (opcional)
        </label>
        <input
          type="tel"
          id="telefono"
          value={formData.telefono}
          onChange={handleInputChange('telefono')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          placeholder="+54 11 1234-5678"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Guardando..." : "Guardar Billetera"}
        </button>
      </div>
    </form>
  );
};

export default BilleteraDigitalForm;
