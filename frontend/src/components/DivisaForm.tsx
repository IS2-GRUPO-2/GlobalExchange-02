import * as yup from "yup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { yupResolver } from "@hookform/resolvers/yup";
import type { Divisa } from "../types/Divisa";

export type DivisaFormData = {
  id?: number;
  codigo: string;
  nombre: string;
  simbolo: string;
  max_digitos: number;
  precision: number;
};

type Props = {
  onSubmit: (divisaData: DivisaFormData) => void;
  onCancel: () => void;
  isEditForm: boolean;
  divisa: Divisa | null;
};

const divisaSchema = yup.object().shape({
  codigo: yup
    .string()
    .required("Este campo es requerido")
    .length(3, "Este campo debe tener tres caracteres"),
  nombre: yup
    .string()
    .required("Este campo es requerido")
    .min(3, "Este campo debe tener como mínimo 3 caracteres")
    .max(30, "Este campo debe tener como máximo 30 caracteres"),
  simbolo: yup
    .string()
    .required("Este campo es requerido")
    .min(1, "Este campo debe como mínimo un caracter.")
    .max(3, "Este campo debe tener como máximo 3 caracteres"),
  max_digitos: yup
    .number()
    .required("Este campo es requerido")
    .typeError("El campo debe contener solamente números")
    .moreThan(2, "El número mde dígitos debe ser mayor a 2"),
  precision: yup
    .number()
    .required("Este campo es requerido")
    .typeError("El campo debe contener solamente números")
    .moreThan(2, "La precisión debe ser mayor a dos decimales"),
});

const DivisaForm = ({ onSubmit, onCancel, isEditForm, divisa }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DivisaFormData>({
    resolver: yupResolver(divisaSchema),
    defaultValues: !isEditForm
      ? {
          codigo: "",
          nombre: "",
          simbolo: "",
          max_digitos: 30,
          precision: 6,
        }
      : {
          codigo: divisa?.codigo,
          nombre: divisa?.nombre,
          simbolo: divisa?.simbolo,
          max_digitos: divisa?.max_digitos,
          precision: divisa?.precision,
        },
  });

  const onFormSubmit = async (data: DivisaFormData) => {
    try {
      onSubmit(data);
      reset();
    } catch (err) {
      isEditForm
        ? toast.error("Error al crear nueva divisa!")
        : toast.error("Error al editar divisa!");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        {isEditForm ? "Editar divisa" : "Crear nueva divisa"}
      </h2>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nombre
          </label>
          <input
            type="text"
            id="name"
            {...register("nombre")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.nombre ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Nombre"
          />
          {errors.nombre && (
            <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="codigo"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Código
          </label>
          <input
            type="text"
            id="codigo"
            {...register("codigo")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.codigo ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Código"
          />
          {errors.codigo && (
            <p className="mt-1 text-sm text-red-600">{errors.codigo.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="simbolo"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Símbolo
          </label>
          <input
            type="text"
            id="simbolo"
            {...register("simbolo")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.simbolo ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Símbolo"
          />
          {errors.simbolo && (
            <p className="mt-1 text-sm text-red-600">
              {errors.simbolo.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="max_digitos"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Máx. dígitos
          </label>
          <input
            type="text"
            id="max_digitos"
            {...register("max_digitos")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.max_digitos ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Núm. de dígitos"
          />
          {errors.max_digitos && (
            <p className="mt-1 text-sm text-red-600">
              {errors.max_digitos.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="precision"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Decimales de precisión
          </label>
          <input
            type="text"
            id="precision"
            {...register("precision")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.precision ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Precisión"
          />
          {errors.precision && (
            <p className="mt-1 text-sm text-red-600">
              {errors.precision.message}
            </p>
          )}
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={handleSubmit(onFormSubmit)}
            disabled={isSubmitting}
            className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? "Guardando..."
              : isEditForm
              ? "Editar divisa"
              : "Crear divisa"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DivisaForm;
