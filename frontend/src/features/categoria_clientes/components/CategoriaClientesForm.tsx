import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import type { CategoriaCliente } from "../../clientes/types/Cliente";

interface FormCategoriaCliente {
  idCategoria?: string;
  nombre: string;
  descripcion: string;
  descuento: number;
  isActive?: boolean;
}

interface Props {
  onSubmit: (data: FormCategoriaCliente) => void;
  onCancel: () => void;
  isEditForm: boolean;
  categoria: CategoriaCliente | null;
}

const schema = yup.object().shape({
  nombre: yup.string().required("El nombre es obligatorio."),
  descripcion: yup.string().required("La descripción es obligatoria."),
  descuento: yup
    .number()
    .required("El descuento es obligatorio.")
    .min(0, "Debe ser mayor o igual a 0")
    .max(100, "Debe ser menor o igual a 100"),
});

const CategoriaClienteForm = ({
  onSubmit,
  onCancel,
  isEditForm,
  categoria,
}: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormCategoriaCliente>({
    resolver: yupResolver(schema),
    defaultValues: isEditForm
      ? {
          idCategoria: categoria?.idCategoria,
          nombre: categoria?.nombre,
          descripcion: categoria?.descripcion,
          descuento: categoria?.descuento,
        }
      : {
          nombre: "",
          descripcion: "",
          descuento: 0,
        },
  });

  const onFormSubmit = async (data: FormCategoriaCliente) => {
    try {
      onSubmit(data);
      reset();
    } catch {
      toast.error(
        isEditForm
          ? "Error al editar la categoría"
          : "Error al crear la categoría"
      );
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        {isEditForm ? "Editar Categoría" : "Crear Categoría"}
      </h2>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="nombre"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nombre
          </label>
          <input
            type="text"
            id="nombre"
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
            htmlFor="descripcion"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Descripción
          </label>
          <textarea
            id="descripcion"
            {...register("descripcion")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.descripcion ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Descripción de la categoría"
          />
          {errors.descripcion && (
            <p className="mt-1 text-sm text-red-600">
              {errors.descripcion.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="descuento"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Descuento (%)
          </label>
          <input
            type="number"
            id="descuento"
            {...register("descuento")}
            min="0"
            max="100"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.descuento ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Porcentaje de descuento"
          />
          {errors.descuento && (
            <p className="mt-1 text-sm text-red-600">
              {errors.descuento.message}
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
              ? "Editar Categoría"
              : "Crear Categoría"}
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

export default CategoriaClienteForm;
