import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";


export type UserFormData = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  is_active: boolean;
  email_verified: boolean;
  clientes: string[];
};

type Props = {
  onSubmit: (userData: UserFormData) => void;
  onCancel: () => void;
};

const userSchema = yup.object().shape({
  username: yup
    .string()
    .required("Este campo es requerido.")
    .min(3, "El username debe tener al menos 3 caracteres"),
  first_name: yup
    .string()
    .required("Este campo es requerido.")
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  last_name: yup
    .string()
    .required("Este campo es requerido.")
    .min(2, "El apellido debe tener al menos 2 caracteres"),
  email: yup
    .string()
    .required("Este campo es requerido")
    .email("Ingrese una dirección de correo válida"),
  password: yup
    .string()
    .required("Este campo es requerido.")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
  is_active: yup.boolean(),
  email_verified: yup.boolean(),
});

const UserForm = ({ onSubmit, onCancel }: Props) => {

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<UserFormData>({
    resolver: yupResolver(userSchema) as any,
    defaultValues: {
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      password: "", 
      is_active: true,
      email_verified: true, // Los usuarios creados por admin ya están verificados
      clientes: [], // Array vacío para evitar undefined
    },
  });

  const onFormSubmit = async (data: UserFormData) => {
    try {
      onSubmit(data);
      reset();
    } catch (err) {
      toast.error("Error al crear usuario!");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Crear nuevo usuario
      </h2>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            {...register("username")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.username ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Username"
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nombre
            </label>
            <input
              type="text"
              id="first_name"
              {...register("first_name")}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.first_name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Nombre"
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Apellido
            </label>
            <input
              type="text"
              id="last_name"
              {...register("last_name")}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.last_name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Apellido"
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
            )}
          </div>
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
            {...register("email")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="correo@ejemplo.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            {...register("password")}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.password ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => {
                const currentValue = watch("is_active");
                setValue("is_active", !currentValue);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                watch("is_active") ? "bg-green-400" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  watch("is_active") ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                watch("is_active")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-900"
              }`}
            >
              {watch("is_active") ? "Activo" : "Inactivo"}
            </span>
            {/* Hidden input para registrar el campo con react-hook-form */}
            <input type="hidden" {...register("is_active")} />
          </div>
        </div>

        {/* Campo oculto para email_verified - los usuarios creados por admin están verificados */}
        <input type="hidden" {...register("email_verified")} />

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={handleSubmit(onFormSubmit as any)}
            disabled={isSubmitting}
            className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creando..." : "Crear Usuario"}
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

export default UserForm;
