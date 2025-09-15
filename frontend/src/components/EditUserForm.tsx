import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";
import { type User } from "../types/User";
import Can from "./Can";
import { USUARIOS } from "../types/perms";

export type EditUserFormData = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
};

type Props = {
  onSubmit: (userData: EditUserFormData) => void;
  onCancel: () => void;
  user: User;
  readOnly: boolean;
  setReadOnly: (value: boolean) => void; 
};

const userSchema = yup.object().shape({
  id: yup.number().required(),
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
  password: yup.string().nullable(), // ✅ ahora compatible
});

const EditUserForm = ({
  onSubmit,
  onCancel,
  user,
  readOnly,
  setReadOnly,
}: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditUserFormData>({
    resolver: yupResolver(userSchema) as any,
    defaultValues: {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: "",
    },
  });

  // ✅ usar SubmitHandler de react-hook-form
  const onFormSubmit: SubmitHandler<EditUserFormData> = async (data) => {
    try {
      onSubmit(data);
      reset();
      setReadOnly(true);
    } catch (err) {
      toast.error("Error al actualizar usuario!");
    }
  };

  return (
    <div className="w-[90vw] max-w-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        {readOnly ? "Detalles del usuario" : "Editar usuario"}
      </h2>

      <div className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            {...register("username")}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.username ? "border-red-500" : "border-gray-300"
            }`}
            readOnly={readOnly}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">
              {errors.username.message}
            </p>
          )}
        </div>

        {/* Nombre y Apellido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              {...register("first_name")}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.first_name ? "border-red-500" : "border-gray-300"
              }`}
              readOnly={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido
            </label>
            <input
              type="text"
              {...register("last_name")}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.last_name ? "border-red-500" : "border-gray-300"
              }`}
              readOnly={readOnly}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            {...register("email")}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
            readOnly={readOnly}
          />
        </div>

        {/* Password solo edición */}
        {!readOnly && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva contraseña (opcional)
            </label>
            <input
              type="password"
              {...register("password")}
              className="w-full px-3 py-2 border rounded-md border-gray-300"
              placeholder="Dejar vacío para mantener la actual"
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
          >
            Cerrar
          </button>

          {readOnly ? (
            <Can anyOf={[USUARIOS.CHANGE]}>
              <button
                type="button"
                onClick={() => setReadOnly(false)}
                className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-500"
              >
                Editar
              </button>
            </Can>
          ) : (
            <button
              type="button"
              onClick={handleSubmit(onFormSubmit as any)}
              disabled={isSubmitting}
              className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-500 disabled:opacity-60"
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditUserForm;
