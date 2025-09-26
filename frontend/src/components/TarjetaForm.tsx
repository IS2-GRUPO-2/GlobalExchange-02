import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getTarjetasLocalesCatalogo } from "../features/financiero/services/metodoFinancieroService";
import type { Tarjeta } from "../types/MetodoFinanciero";
import type { TarjetaLocalCatalogo } from "../features/financiero/types/MetodoFinanciero";

export interface TarjetaFormData {
  tipo: 'LOCAL' | 'STRIPE';
  payment_method_id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  titular: string;
  metodo_financiero_detalle: number;
  // Campos adicionales para simulación (no se guardan)
  numero_completo: string;
  cvv: string;
  marca_local?: number; // ID de marca local cuando tipo es LOCAL
}

interface TarjetaFormErrors {
  tipo?: string;
  payment_method_id?: string;
  brand?: string;
  last4?: string;
  exp_month?: string;
  exp_year?: string;
  titular?: string;
  metodo_financiero_detalle?: string;
  numero_completo?: string;
  cvv?: string;
  marca_local?: string;
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
    tipo: initialData?.tipo || 'STRIPE',
    payment_method_id: initialData?.payment_method_id || "",
    brand: initialData?.brand || "",
    last4: initialData?.last4 || "",
    exp_month: initialData?.exp_month || new Date().getMonth() + 1,
    exp_year: initialData?.exp_year || new Date().getFullYear(),
    titular: initialData?.titular || "",
    metodo_financiero_detalle: initialData?.metodo_financiero_detalle || 0,
    // Campos adicionales para simulación
    numero_completo: "",
    cvv: "",
    marca_local: undefined,
  });

  const [errors, setErrors] = useState<TarjetaFormErrors>({});
  const [marcasLocales, setMarcasLocales] = useState<TarjetaLocalCatalogo[]>([]);

  // Cargar marcas locales disponibles
  useEffect(() => {
    const fetchMarcasLocales = async () => {
      try {
        const response = await getTarjetasLocalesCatalogo({});
        setMarcasLocales(response.results.filter(marca => marca.is_active));
      } catch (error) {
        console.error("Error loading marcas locales:", error);
      }
    };

    fetchMarcasLocales();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: TarjetaFormErrors = {};

    // Validaciones para número completo de tarjeta
    if (!formData.numero_completo.trim()) {
      newErrors.numero_completo = "El número de tarjeta es requerido";
    } else if (!/^\d{13,19}$/.test(formData.numero_completo.replace(/\s/g, ''))) {
      newErrors.numero_completo = "El número de tarjeta debe tener entre 13 y 19 dígitos";
    }

    // Validación CVV
    if (!formData.cvv.trim()) {
      newErrors.cvv = "El CVV es requerido";
    } else if (!/^\d{3,4}$/.test(formData.cvv)) {
      newErrors.cvv = "El CVV debe tener 3 o 4 dígitos";
    }

    // Validaciones específicas según el tipo
    if (formData.tipo === 'LOCAL') {
      if (!formData.marca_local) {
        newErrors.marca_local = "Debe seleccionar una marca";
      }
    }
    // Nota: Para Stripe, el payment_method_id se genera automáticamente

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
      // Procesar datos antes de enviar
      const cleanedNumber = formData.numero_completo.replace(/\s/g, '');
      const last4 = cleanedNumber.slice(-4);
      
      // Determinar la marca automáticamente basada en el número
      let brand = formData.brand;
      if (formData.tipo === 'LOCAL' && formData.marca_local) {
        const selectedMarca = marcasLocales.find(m => m.id === formData.marca_local);
        brand = selectedMarca?.marca || formData.brand;
      } else if (!brand) {
        // Auto-detectar marca según el número
        if (cleanedNumber.startsWith('4')) brand = 'Visa';
        else if (cleanedNumber.match(/^5[1-5]/)) brand = 'Mastercard';
        else if (cleanedNumber.match(/^3[47]/)) brand = 'American Express';
        else brand = 'Otra';
      }

      const submitData: TarjetaFormData = {
        ...formData,
        brand,
        last4,
        payment_method_id: formData.tipo === 'STRIPE' 
          ? formData.payment_method_id 
          : `local_${Date.now()}`, // ID simulado para tarjetas locales
      };

      // Mostrar mensaje de verificación simulada
      toast.info("Verificando la existencia de la tarjeta...");
      
      onSubmit(submitData);
    }
  };

  const handleInputChange = (field: keyof TarjetaFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    let value: any;
    
    if (field === 'exp_month' || field === 'exp_year') {
      value = parseInt(e.target.value);
    } else if (field === 'marca_local') {
      value = e.target.value ? parseInt(e.target.value) : undefined;
    } else if (field === 'numero_completo') {
      // Formatear número de tarjeta con espacios para mejor UX
      const cleanValue = e.target.value.replace(/\D/g, '');
      value = cleanValue.replace(/(\d{4})(?=\d)/g, '$1 ');
    } else if (field === 'cvv') {
      // Solo permitir dígitos para CVV
      value = e.target.value.replace(/\D/g, '');
    } else {
      value = e.target.value;
    }
      
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

    // Auto-limpiar marca local cuando se cambia el tipo
    if (field === 'tipo' && value === 'STRIPE') {
      setFormData(prev => ({
        ...prev,
        marca_local: undefined
      }));
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo de Tarjeta */}
      <div>
        <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
          Tipo de Tarjeta
        </label>
        <select
          id="tipo"
          value={formData.tipo}
          onChange={handleInputChange('tipo')}
          className={`mt-1 block w-full rounded-md border ${
            errors.tipo ? 'border-red-300' : 'border-gray-300'
          } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
        >
          <option value="STRIPE">Stripe</option>
          <option value="LOCAL">Tarjeta Local</option>
        </select>
        {errors.tipo && (
          <p className="mt-1 text-sm text-red-600">{errors.tipo}</p>
        )}
      </div>

      {/* Marca (solo para tarjetas locales) */}
      {formData.tipo === 'LOCAL' && (
        <div>
          <label htmlFor="marca_local" className="block text-sm font-medium text-gray-700">
            Marca de Tarjeta
          </label>
          <select
            id="marca_local"
            value={formData.marca_local || ''}
            onChange={handleInputChange('marca_local')}
            className={`mt-1 block w-full rounded-md border ${
              errors.marca_local ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
          >
            <option value="">Seleccionar marca...</option>
            {marcasLocales.map(marca => (
              <option key={marca.id} value={marca.id}>{marca.marca}</option>
            ))}
          </select>
          {errors.marca_local && (
            <p className="mt-1 text-sm text-red-600">{errors.marca_local}</p>
          )}
        </div>
      )}

      {/* Número completo de tarjeta */}
      <div>
        <label htmlFor="numero_completo" className="block text-sm font-medium text-gray-700">
          Número Completo de Tarjeta
        </label>
        <input
          type="text"
          id="numero_completo"
          value={formData.numero_completo}
          onChange={handleInputChange('numero_completo')}
          maxLength={23} // 19 dígitos + 4 espacios
          className={`mt-1 block w-full rounded-md border ${
            errors.numero_completo ? 'border-red-300' : 'border-gray-300'
          } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
          placeholder="1234 5678 9012 3456"
        />
        {errors.numero_completo && (
          <p className="mt-1 text-sm text-red-600">{errors.numero_completo}</p>
        )}
      </div>

      {/* Nombre del titular */}
      <div>
        <label htmlFor="titular" className="block text-sm font-medium text-gray-700">
          Nombre del Titular
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

      {/* Fecha de vencimiento */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="exp_month" className="block text-sm font-medium text-gray-700">
            Mes de vencimiento
          </label>
          <input
            type="number"
            id="exp_month"
            value={formData.exp_month}
            onChange={handleInputChange('exp_month')}
            min="1"
            max="12"
            placeholder="MM"
            className={`mt-1 block w-full rounded-md border ${
              errors.exp_month ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
          />
          {errors.exp_month && <p className="mt-1 text-sm text-red-600">{errors.exp_month}</p>}
        </div>

        <div>
          <label htmlFor="exp_year" className="block text-sm font-medium text-gray-700">
            Año de vencimiento
          </label>
          <input
            type="number"
            id="exp_year"
            value={formData.exp_year}
            onChange={handleInputChange('exp_year')}
            min={currentYear}
            max={currentYear + 20}
            placeholder="AAAA"
            className={`mt-1 block w-full rounded-md border ${
              errors.exp_year ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
          />
          {errors.exp_year && <p className="mt-1 text-sm text-red-600">{errors.exp_year}</p>}
        </div>
      </div>

      {/* CVV */}
      <div>
        <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
          CVV
        </label>
        <input
          type="password"
          id="cvv"
          value={formData.cvv}
          onChange={handleInputChange('cvv')}
          maxLength={4}
          className={`mt-1 block w-full rounded-md border ${
            errors.cvv ? 'border-red-300' : 'border-gray-300'
          } px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500`}
          placeholder="123"
        />
        {errors.cvv && <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Verificando..." : "Verificar y Guardar Tarjeta"}
        </button>
      </div>
    </form>
  );
};

export default TarjetaForm;
