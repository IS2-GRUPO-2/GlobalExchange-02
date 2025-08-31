import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { type User } from "../types/User";
import { type Cliente } from "../types/Cliente";
import { useEffect, useState } from "react";
import { getClientes } from "../services/clienteService";

export type UserFormData = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  is_staff: boolean;
  is_active: boolean;
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
  is_staff: yup.boolean(),
  is_active: yup.boolean(),
  clientes: yup.array().of(yup.string()),
});

const UserForm = ({ onSubmit, onCancel }: Props) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<UserFormData>({
    resolver: yupResolver(userSchema),
    defaultValues: {
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      is_staff: false,
      is_active: true,
      clientes: [],
    },
  });

  const selectedClientes = watch("clientes");

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const res = await getClientes("");
      setClientes(res.data);
    } catch (error) {
      toast.error("Error al cargar clientes");
    }
  };

  const handleClienteChange = (clienteId: string, checked: boolean) => {
    if (checked) {
      setValue("clientes", [...selectedClientes, clienteId]);
    } else {
      setValue("clientes", selectedClientes.filter(id => id !== clienteId));
    }
  };

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Asignar Clientes
          </label>
          <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
            {clientes.map((cliente) => (
              <label key={cliente.idCliente} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedClientes.includes(cliente.idCliente)}
                  onChange={(e) => handleClienteChange(cliente.idCliente, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  {cliente.nombre} ({cliente.categoria})
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="is_staff"
              className="flex items-center text-sm font-medium text-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                id="is_staff"
                {...register("is_staff")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              Es Staff
            </label>
          </div>

          <div>
            <label
              htmlFor="is_active"
              className="flex items-center text-sm font-medium text-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                id="is_active"
                {...register("is_active")}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              Activo
            </label>
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={handleSubmit(onFormSubmit)}
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
