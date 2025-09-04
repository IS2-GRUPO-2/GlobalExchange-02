import React, { useState } from "react";
import type { CuentaBancaria } from "../types/MetodoFinanciero";

export interface CuentaBancariaFormData {
  banco: string;
  numero_cuenta: string;
  titular: string;
  cbu_cvu: string;
  metodo_financiero_detalle: number;
}

interface CuentaBancariaFormProps {
  onSubmit: (data: CuentaBancariaFormData) => void;
  initialData?: Partial<CuentaBancaria>;
  isSubmitting?: boolean;
}

const CuentaBancariaForm: React.FC<CuentaBancariaFormProps> = ({
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<CuentaBancariaFormData>({
    banco: initialData?.banco || "",
    numero_cuenta: initialData?.numero_cuenta || "",
    titular: initialData?.titular || "",
    cbu_cvu: initialData?.cbu_cvu || "",
    metodo_financiero_detalle: initialData?.metodo_financiero_detalle || 0,
  });

  const [errors, setErrors] = useState<Partial<CuentaBancariaFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CuentaBancariaFormData> = {};

    if (!formData.banco.trim()) {
      newErrors.banco = "El banco es requerido";
    }

    if (!formData.numero_cuenta.trim()) {
      newErrors.numero_cuenta = "El número de cuenta es requerido";
    }

    if (!formData.titular.trim()) {
      newErrors.titular = "El titular es requerido";
    }

    if (!formData.cbu_cvu.trim()) {
      newErrors.cbu_cvu = "El CBU/CVU es requerido";
    } else if (formData.cbu_cvu.length < 22) {
      newErrors.cbu_cvu = "El CBU/CVU debe tener 22 dígitos";
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

  const handleInputChange = (field: keyof CuentaBancariaFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="banco" className="block text-sm font-medium text-gray-700">
          Banco *
        </label>
        <input
          type="text"
          id="banco"
          value={formData.banco}
          onChange={handleInputChange('banco')}
          className={`mt-1 block w-full rounded-md border ${
            errors.banco ? 'border-red-300' : 'border-gray-300'
          } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
          placeholder="Ej: Banco Santander"
        />
        {errors.banco && <p className="mt-1 text-sm text-red-600">{errors.banco}</p>}
      </div>

      <div>
        <label htmlFor="numero_cuenta" className="block text-sm font-medium text-gray-700">
          Número de Cuenta *
        </label>
        <input
          type="text"
          id="numero_cuenta"
          value={formData.numero_cuenta}
          onChange={handleInputChange('numero_cuenta')}
          className={`mt-1 block w-full rounded-md border ${
            errors.numero_cuenta ? 'border-red-300' : 'border-gray-300'
          } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
          placeholder="Ej: 1234567890"
        />
        {errors.numero_cuenta && <p className="mt-1 text-sm text-red-600">{errors.numero_cuenta}</p>}
      </div>

      <div>
        <label htmlFor="titular" className="block text-sm font-medium text-gray-700">
          Titular *
        </label>
        <input
          type="text"
          id="titular"
          value={formData.titular}
          onChange={handleInputChange('titular')}
          className={`mt-1 block w-full rounded-md border ${
            errors.titular ? 'border-red-300' : 'border-gray-300'
          } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
          placeholder="Nombre completo del titular"
        />
        {errors.titular && <p className="mt-1 text-sm text-red-600">{errors.titular}</p>}
      </div>

      <div>
        <label htmlFor="cbu_cvu" className="block text-sm font-medium text-gray-700">
          CBU/CVU *
        </label>
        <input
          type="text"
          id="cbu_cvu"
          value={formData.cbu_cvu}
          onChange={handleInputChange('cbu_cvu')}
          maxLength={22}
          className={`mt-1 block w-full rounded-md border ${
            errors.cbu_cvu ? 'border-red-300' : 'border-gray-300'
          } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
          placeholder="22 dígitos del CBU o CVU"
        />
        {errors.cbu_cvu && <p className="mt-1 text-sm text-red-600">{errors.cbu_cvu}</p>}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Guardando..." : "Guardar Cuenta"}
        </button>
      </div>
    </form>
  );
};

export default CuentaBancariaForm;
