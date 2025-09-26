import { useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import type { LimiteDivisaFormData } from "../types/Limite";
import {
  getLimiteConfig,
  updateLimiteConfig,
} from "../../../services/divisaService";
import { useAuthZ } from "../../../context/AuthZContext";
import { LIMITES_DIVISA_CONFIG } from "../../../types/perms";
import { formatNumber, unformatNumber } from "../utils/format";

const limiteSchema = yup.object().shape({
  limite_diario: yup
    .string()
    .required()
    .matches(/^[0-9]+(\.[0-9]+)?$/, "El límite debe ser un número")
    .max(30, "El número debe tener como máximo 30 dígitos"),
  limite_mensual: yup
    .string()
    .required()
    .matches(/^[0-9]+(\.[0-9]+)?$/, "El límite debe ser un número")
    .max(30, "El número debe tener como máximo 30 dígitos"),
});

const LimiteConfigForm = () => {
  const { perms } = useAuthZ();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<LimiteDivisaFormData>({
    resolver: yupResolver(limiteSchema),
    defaultValues: {
      limite_diario: "",
      limite_mensual: "",
    },
  });

  const fetchLimites = async () => {
    if (!perms.has(LIMITES_DIVISA_CONFIG.VIEW)) return;
    try {
      const res = await getLimiteConfig();
      reset({
        limite_diario: res.limite_diario,
        limite_mensual: res.limite_mensual,
      });
    } catch (err) {
      toast.error("Error al obtener límites");
    }
  };

  const onSubmit = async (data: LimiteDivisaFormData) => {
    try {
      await updateLimiteConfig(data);
      toast.success("Límites actualizados con éxito");
      fetchLimites();
    } catch (err) {
      toast.error("Error actualizando los límites");
      console.log(err);
    }
  };

  useEffect(() => {
    fetchLimites();
  }, []);

  return (
    <div>
      <h2 className="text-l font-bold mb-4 text-gray-800">Límites</h2>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="limite_diario"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Límite diario (Guaraníes)
          </label>
          <Controller
            name="limite_diario"
            control={control}
            render={({ field }) => (
              <input
                type="text"
                id="limite_diario"
                value={formatNumber(field.value)}
                onChange={(e) => field.onChange(unformatNumber(e.target.value))}
                disabled={!perms.has(LIMITES_DIVISA_CONFIG.CHANGE)}
                className={`w-80 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.limite_diario ? "border-red-500" : "border-gray-300"
                }`}
              />
            )}
          />
          {errors.limite_diario && (
            <p className="mt-1 text-sm text-red-600">
              {errors.limite_diario.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="limite_mensual"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Límite mensual (Guaraníes)
          </label>
          <Controller
            name="limite_mensual"
            control={control}
            render={({ field }) => (
              <input
                type="text"
                id="limite_mensual"
                value={formatNumber(field.value)}
                onChange={(e) => field.onChange(unformatNumber(e.target.value))}
                disabled={!perms.has(LIMITES_DIVISA_CONFIG.CHANGE)}
                className={`w-80 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.limite_mensual ? "border-red-500" : "border-gray-300"
                }`}
              />
            )}
          />
          {errors.limite_mensual && (
            <p className="mt-1 text-sm text-red-600">
              {errors.limite_mensual.message}
            </p>
          )}
        </div>

        <div className="flex justify-end pt-4">
          {perms.has(LIMITES_DIVISA_CONFIG.CHANGE) && (
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || !isDirty}
              className="bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LimiteConfigForm;
