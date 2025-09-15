import React, { useState, useEffect } from "react";
import type { CuentaBancaria, Banco } from "../types/MetodoFinanciero";
import { getBancos } from "../services/metodoFinancieroService";

export interface CuentaBancariaFormData {
  banco: number;
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
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loadingBancos, setLoadingBancos] = useState(true);
  
  const [formData, setFormData] = useState<CuentaBancariaFormData>({
    banco: initialData?.banco || 0,
    numero_cuenta: initialData?.numero_cuenta || "",
    titular: initialData?.titular || "",
    cbu_cvu: initialData?.cbu_cvu || "",
    metodo_financiero_detalle: initialData?.metodo_financiero_detalle || 0,
  });

  // ✅ usar string para mensajes de error
  const [errors, setErrors] = useState<Partial<Record<keyof CuentaBancariaFormData, string>>>({});

  const getSelectedBanco = () => {
    return bancos.find(b => b.id === formData.banco);
  };

  useEffect(() => {
    const fetchBancos = async () => {
      try {
        const response = await getBancos();
        setBancos(response.results.filter(banco => banco.is_active));
      } catch (error) {
        console.error('Error loading bancos:', error);
      } finally {
        setLoadingBancos(false);
      }
    };

    fetchBancos();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CuentaBancariaFormData, string>> = {};

    if (!formData.banco) {
      newErrors.banco = "Debe seleccionar un banco";
    }

    if (!formData.numero_cuenta.trim()) {
      newErrors.numero_cuenta = "El número de cuenta es requerido";
    }

    if (!formData.titular.trim()) {
      newErrors.titular = "El titular es requerido";
    }

    const selectedBanco = getSelectedBanco();
    const isAutoFilledCVU = selectedBanco && selectedBanco.cvu;
    
    if (!formData.cbu_cvu.trim()) {
      newErrors.cbu_cvu = "El CBU/CVU es requerido";
    } else if (!isAutoFilledCVU && formData.cbu_cvu.length !== 22) {
      newErrors.cbu_cvu = "El CBU/CVU debe tener exactamente 22 dígitos";
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = field === 'banco' ? parseInt(e.target.value) : e.target.value;
    
    let updatedFormData = {
      ...formData,
      [field]: value
    };

    if (field === 'banco' && value) {
      const selectedBanco = bancos.find(b => b.id === parseInt(e.target.value));
      if (selectedBanco && selectedBanco.cvu) {
        updatedFormData.cbu_cvu = selectedBanco.cvu;
      }
    }

    setFormData(updatedFormData);
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Banco */}
      <div>
        <label htmlFor="banco" className="block text-sm font-medium text-gray-700">
          Banco
        </label>
        {loadingBancos ? (
          <div className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50">
            Cargando bancos...
          </div>
        ) : (
          <select
            id="banco"
            value={formData.banco}
            onChange={handleInputChange('banco')}
            className={`mt-1 block w-full rounded-md border ${
              errors.banco ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            disabled={isSubmitting}
          >
            <option value={0}>Seleccione un banco</option>
            {bancos.map((banco) => (
              <option key={banco.id} value={banco.id}>
                {banco.nombre}
              </option>
            ))}
          </select>
        )}
        {errors.banco && <p className="mt-1 text-sm text-red-600">{errors.banco}</p>}
        {bancos.length === 0 && !loadingBancos && (
          <p className="mt-1 text-sm text-amber-600">
            No hay bancos disponibles
          </p>
        )}
      </div>

      {/* Número de cuenta */}
      <div>
        <label htmlFor="numero_cuenta" className="block text-sm font-medium text-gray-700">
          Número de Cuenta
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

      {/* Titular */}
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
          placeholder="Nombre completo del titular"
        />
        {errors.titular && <p className="mt-1 text-sm text-red-600">{errors.titular}</p>}
      </div>

      {/* CBU/CVU */}
      <div>
        <label htmlFor="cbu_cvu" className="block text-sm font-medium text-gray-700">
          CBU/CVU
        </label>
        <input
          type="text"
          id="cbu_cvu"
          value={formData.cbu_cvu}
          onChange={handleInputChange('cbu_cvu')}
          maxLength={22}
          readOnly={!!(formData.banco && getSelectedBanco()?.cvu)} // ✅ forzado a boolean
          className={`mt-1 block w-full rounded-md border ${
            errors.cbu_cvu ? 'border-red-300' : 'border-gray-300'
          } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 ${
            !!(formData.banco && getSelectedBanco()?.cvu) ? 'bg-gray-100' : ''
          }`}
          placeholder={
            !!(formData.banco && getSelectedBanco()?.cvu) 
              ? "CVU del banco seleccionado" 
              : "22 dígitos del CBU o CVU"
          }
        />
        {!!(formData.banco && getSelectedBanco()?.cvu) && (
          <p className="mt-1 text-xs text-blue-600">
            ℹ️ CVU del banco seleccionado (llenado automáticamente)
          </p>
        )}
        {errors.cbu_cvu && <p className="mt-1 text-sm text-red-600">{errors.cbu_cvu}</p>}
      </div>

      {/* Botón */}
      <div className="flex justify-end space-x-3 pt-4">
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
