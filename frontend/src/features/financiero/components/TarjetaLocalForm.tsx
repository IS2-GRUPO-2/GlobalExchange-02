import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { getTarjetasLocalesCatalogo } from "../services/metodoFinancieroService";
import type { TarjetaLocal, TarjetaLocalCatalogo } from "../types/MetodoFinanciero";

interface TarjetaLocalFormProps {
  onSubmit: (data: any) => void;
  initialData?: TarjetaLocal;
  isSubmitting: boolean;
  onCancel?: () => void;
}

// Obtener marcas disponibles del backend
const getMarcasDisponibles = async (): Promise<TarjetaLocalCatalogo[]> => {
  try {
    const response = await getTarjetasLocalesCatalogo({});
    return response.results.filter(marca => marca.is_active);
  } catch (error) {
    console.error("Error al obtener marcas:", error);
    throw error;
  }
};

const TarjetaLocalForm: React.FC<TarjetaLocalFormProps> = ({
  onSubmit,
  initialData,
  isSubmitting,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    marca: "",
    pan: "", // Número completo (solo para captura, no se guarda)
    titular: "",
    exp_month: "",
    exp_year: "",
    cvv: "", // Solo para captura, no se guarda
    alias: "",
  });

  const [marcasDisponibles, setMarcasDisponibles] = useState<TarjetaLocalCatalogo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMarcas = async () => {
      try {
        const marcas = await getMarcasDisponibles();
        setMarcasDisponibles(marcas);
      } catch (error) {
        toast.error("Error al cargar las marcas de tarjetas");
      } finally {
        setLoading(false);
      }
    };

    loadMarcas();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        marca: initialData.marca?.toString() || "",
        pan: "", // No mostramos el PAN completo por seguridad
        titular: initialData.titular || "",
        exp_month: initialData.exp_month?.toString() || "",
        exp_year: initialData.exp_year?.toString() || "",
        cvv: "",
        alias: "", // Esto vendría del detalle del método financiero
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (formData.pan.length < 13 || formData.pan.length > 19) {
      toast.error("El número de tarjeta debe tener entre 13 y 19 dígitos");
      return;
    }

    if (formData.cvv.length < 3 || formData.cvv.length > 4) {
      toast.error("El CVV debe tener 3 o 4 dígitos");
      return;
    }

    const currentYear = new Date().getFullYear();
    const expYear = parseInt(formData.exp_year);
    const expMonth = parseInt(formData.exp_month);

    if (expYear < currentYear || (expYear === currentYear && expMonth < new Date().getMonth() + 1)) {
      toast.error("La fecha de vencimiento no puede ser anterior a la fecha actual");
      return;
    }

    // Preparar datos para enviar
    const submitData = {
      // Datos del detalle del método financiero
      alias: formData.alias,
      es_cuenta_casa: true, // Asumimos que es de la casa
      
      // Datos específicos de la tarjeta local
      marca: parseInt(formData.marca),
      last4: formData.pan.slice(-4), // Solo los últimos 4 dígitos
      titular: formData.titular,
      exp_month: parseInt(formData.exp_month),
      exp_year: parseInt(formData.exp_year),
    };

    onSubmit(submitData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Validación especial para PAN (solo números)
    if (name === "pan") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 19) {
        setFormData((prev) => ({ ...prev, [name]: numericValue }));
      }
      return;
    }

    // Validación especial para CVV (solo números, máximo 4)
    if (name === "cvv") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 4) {
        setFormData((prev) => ({ ...prev, [name]: numericValue }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <div className="flex justify-center p-4">Cargando marcas...</div>;
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">
          {initialData ? "Editar " : "Crear"}
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="alias" className="block text-sm font-medium text-gray-700 mb-1">
            Alias <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="alias"
            name="alias"
            value={formData.alias}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: Tarjeta principal, Tarjeta corporativa"
            required
          />
        </div>

        <div>
          <label htmlFor="marca" className="block text-sm font-medium text-gray-700 mb-1">
            Marca <span className="text-red-500">*</span>
          </label>
          <select
            id="marca"
            name="marca"
            value={formData.marca}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Seleccionar marca</option>
            {marcasDisponibles.map((marca) => (
              <option key={marca.id} value={marca.id}>
                {marca.marca}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="pan" className="block text-sm font-medium text-gray-700 mb-1">
            Número de Tarjeta (PAN) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="pan"
            name="pan"
            value={formData.pan}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="1234567890123456"
            maxLength={19}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Solo se guardarán los últimos 4 dígitos por seguridad
          </p>
        </div>

        <div>
          <label htmlFor="titular" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Titular <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="titular"
            name="titular"
            value={formData.titular}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nombre como aparece en la tarjeta"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="exp_month" className="block text-sm font-medium text-gray-700 mb-1">
              Mes Vencimiento <span className="text-red-500">*</span>
            </label>
            <select
              id="exp_month"
              name="exp_month"
              value={formData.exp_month}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Mes</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {month.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="exp_year" className="block text-sm font-medium text-gray-700 mb-1">
              Año Vencimiento <span className="text-red-500">*</span>
            </label>
            <select
              id="exp_year"
              name="exp_year"
              value={formData.exp_year}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Año</option>
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
            CVV <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="cvv"
            name="cvv"
            value={formData.cvv}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="123"
            maxLength={4}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Código de seguridad (3 o 4 dígitos). Este dato no se guarda por seguridad.
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : initialData ? "Actualizar" : "Crear"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TarjetaLocalForm;
