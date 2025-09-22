import type { CategoriaCliente, Cliente } from "../../../types/Cliente";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { getActiveCategoriaClientes } from "../../../services/categoriaClienteService";

export type ClientFormData = {
  id?: number;
  nombre: string;
  isPersonaFisica: boolean;
  idCategoria: string;
  documento: string;
  correo: string;
  telefono: string;
  direccion: string;
};

type Props = {
  onSubmit: (clientData: ClientFormData) => void;
  onCancel: () => void;
  isEditForm: boolean;
  cliente: Cliente | null;
  readOnly: boolean;
};

const clientSchema = yup.object().shape({
  nombre: yup
    .string()
    .required("Este campo es requerido.")
    .min(2, "El nombre debe tener al menos dos caracteres"),
  correo: yup
    .string()
    .required("Este campo es requerido")
    .email("Ingrese una dirección de correo válida"),
  isPersonaFisica: yup.boolean().required("Este campo es requerido."),
  idCategoria: yup.string().required("Este campo es requerido."),
  documento: yup
    .string()
    .required("Este campo es requerido.")
    .matches(
      /^\d+-?\d*$/,
      "Este campo debe contener solo números y un guión en caso de ser RUC."
    ),
  telefono: yup
    .string()
    .required("Este campo es requerido.")
    .matches(/^\+?\d+$/, "Este campo debe contener solo números."),
  direccion: yup
    .string()
    .required("Este campo es requerido.")
    .min(2, "Debe tener al menos 2 caracteres."),
});

const ClientForm = ({
  onSubmit,
  onCancel,
  isEditForm,
  cliente,
  readOnly,
}: Props) => {
  const [categorias, setCategorias] = useState<CategoriaCliente[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<ClientFormData>({
    resolver: yupResolver(clientSchema),
    defaultValues:
      isEditForm || readOnly
        ? {
            nombre: cliente?.nombre,
            idCategoria: cliente?.idCategoria,
            documento: cliente?.isPersonaFisica
              ? cliente?.cedula
              : cliente?.ruc,
            isPersonaFisica: cliente?.isPersonaFisica,
            direccion: cliente?.direccion,
            telefono: cliente?.telefono,
            correo: cliente?.correo,
          }
        : {
            nombre: "",
            idCategoria: "",
            documento: "",
            isPersonaFisica: false,
            direccion: "",
            telefono: "",
            correo: "",
          },
  });
  // Cargar categorías al montar el componente
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await getActiveCategoriaClientes();
        setCategorias(response.data);

        if ((isEditForm || readOnly) && cliente?.idCategoria) {
          setValue("idCategoria", cliente.idCategoria);
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
        toast.error("Error al cargar las categorías");
      } finally {
        setLoadingCategorias(false);
      }
    };

    fetchCategorias();
  }, []);

  const onFormSubmit = async (data: ClientFormData) => {
    try {
      onSubmit(data);
      reset();
    } catch (err) {
      if (isEditForm) {
        toast.error("Error al registrar cliente!: ");
      } else {
        toast.error("Error al editar cliente!");
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        {isEditForm ? "Editar cliente" : "Registrar cliente"}
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
            readOnly={readOnly}
          />
          {errors.nombre && (
            <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            {...register("correo")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.correo ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Correo electrónico"
            readOnly={readOnly}
          />
          {errors.correo && (
            <p className="mt-1 text-sm text-red-600">{errors.correo.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="documento"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Documento
          </label>
          <input
            type="text"
            id="documento"
            {...register("documento")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.documento ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Documento (Cédula o RUC)"
            readOnly={readOnly}
          />
          {errors.documento && (
            <p className="mt-1 text-sm text-red-600">
              {errors.documento.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="telefono"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Teléfono
          </label>
          <input
            type="text"
            id="telefono"
            {...register("telefono")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.telefono ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Número de teléfono"
            readOnly={readOnly}
          />
          {errors.telefono && (
            <p className="mt-1 text-sm text-red-600">
              {errors.telefono.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="direccion"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Dirección
          </label>
          <input
            type="text"
            id="direccion"
            {...register("direccion")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.direccion ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Dirección"
            readOnly={readOnly}
          />
          {errors.direccion && (
            <p className="mt-1 text-sm text-red-600">
              {errors.direccion.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="categoria"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Categoría
          </label>
          <select
            id="categoria"
            {...register("idCategoria")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.idCategoria ? "border-red-500" : "border-gray-300"
            }`}
            disabled={readOnly}
          >
            <option value="">
              {loadingCategorias
                ? "Cargando categorías..."
                : "Seleccione una categoría"}
            </option>
            {categorias.map((categoria) => (
              <option key={categoria.idCategoria} value={categoria.idCategoria}>
                {categoria.nombre} {`(${categoria.descuento}% desc.)`}
              </option>
            ))}
          </select>
          {errors.idCategoria && (
            <p className="mt-1 text-sm text-red-600">
              {errors.idCategoria.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="tipo"
            className="flex items-center text-sm font-medium text-gray-700 cursor-pointer"
          >
            <input
              type="checkbox"
              id="tipo"
              {...register("isPersonaFisica")}
              className={`mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                errors.isPersonaFisica ? "border-red-500" : ""
              }`}
              defaultChecked={
                isEditForm || readOnly ? cliente?.isPersonaFisica : true
              }
              disabled={readOnly}
            />
            Persona física
          </label>
          {errors.isPersonaFisica && (
            <p className="mt-1 text-sm text-red-600">
              {errors.isPersonaFisica.message}
            </p>
          )}
        </div>

        <div className="flex space-x-3 pt-4">
          {!readOnly && (
            <button
              type="button"
              onClick={handleSubmit(onFormSubmit)}
              disabled={isSubmitting}
              className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Creando..."
                : isEditForm
                ? "Editar Cliente"
                : "Crear cliente"}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {readOnly ? "Volver" : "Cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientForm;
