import * as Yup from "yup";
import { useAuth } from "../context/useAuth";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "react-toastify";
import VerifyEmail from "../components/VerifyEmail";
import { useState } from "react";
// Eliminando la definición de Props no utilizada
// type Props = {};

type RegisterFormInputs = {
  username: string;
  email: string;
  first_name: string;
  password: string;
  confirm_password: string;
};

const validation = Yup.object().shape({
  username: Yup.string().required("Este campo es requerido."),
  email: Yup.string()
    .email("Ingrese un correo válido.")
    .required("Este campo es requerido."),
  first_name: Yup.string().required("Este campo es requerido."),
  password: Yup.string().required("Este campo es requerido."),
  confirm_password: Yup.string()
    .oneOf([Yup.ref("password")], "Las contraseñas no coinciden.")
    .required("Este campo es requerido."),
});

const RegisterPage = () => {
  const { registerUser } = useAuth();
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({ resolver: yupResolver(validation) });

  const handleRegister = async (form: RegisterFormInputs) => {
    console.log("handle register");
    setError("");
    setLoading(true);
    
    try {
      const res = await registerUser(form.username, form.email, form.first_name, form.password);
      if (res) {
        toast.success("Registro exitoso. Revisa tu email para verificar tu cuenta.");
        setAwaitingVerification(true);
        setUserEmail(form.email);
      }
    } catch (e: any) {
      console.error("Error en handleRegister:", e);
      
      // Extraer mensaje de error específico del backend
      let errorMessage = "Error en el registro. Por favor, intenta nuevamente.";
      
      if (e.response?.status === 500) {
        // Error 500 - Error interno del servidor
        errorMessage = "Error del servidor. Por favor, contacta al administrador.";
      } else if (e.response?.status >= 400 && e.response?.status < 500) {
        // Errores 4xx - Errores del cliente
        const data = e.response?.data;
        
        // Detectar si la respuesta es HTML (página de error de Django)
        const isHTML = typeof data === 'string' && (
          data.trim().startsWith('<!DOCTYPE') || 
          data.trim().startsWith('<html') ||
          data.includes('<title>') ||
          data.includes('<body>')
        );
        
        if (isHTML) {
          // Si es HTML, no mostrar nada de eso al usuario
          errorMessage = "Error al procesar el registro. Por favor, verifica tus datos.";
        } else if (typeof data === 'object' && data !== null) {
          // Es un objeto JSON - extraer errores específicos
          if (data.username && Array.isArray(data.username)) {
            errorMessage = `Usuario: ${data.username[0]}`;
          } else if (data.email && Array.isArray(data.email)) {
            errorMessage = `Email: ${data.email[0]}`;
          } else if (data.password && Array.isArray(data.password)) {
            errorMessage = `Contraseña: ${data.password[0]}`;
          } else if (data.error) {
            errorMessage = data.error;
          } else if (data.detail) {
            errorMessage = data.detail;
          } else if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
            errorMessage = data.non_field_errors[0];
          }
        } else if (typeof data === 'string' && data.length < 200) {
          // String corto que no es HTML
          errorMessage = data;
        }
      } else if (e.message && !e.message.includes('Network Error')) {
        errorMessage = "Error de conexión. Verifica tu internet.";
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gray-50 min-h-screen">
      {awaitingVerification ? (
        <VerifyEmail email={userEmail} />
      ) : (
        <div className="flex flex-col items-center justify-center px-6 py-0 mx-auto min-h-screen">
          <div className="w-full bg-white rounded-lg shadow-lg sm:max-w-md xl:p-0 my-8">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl ">
                Registro de usuario
              </h1>
              <form
                className="space-y-4 md:space-y-6"
                onSubmit={handleSubmit(handleRegister)}
              >
                <div>
                  <label
                    htmlFor="username"
                    className="block mb-2 text-sm font-medium text-gray-900 "
                  >
                    Nombre de usuario
                  </label>
                  <input
                    type="text"
                    id="username"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                    placeholder="Usuario"
                    disabled={loading}
                    {...register("username")}
                  />
                  {errors.username ? (
                    <p className="text-gray-900">{errors.username.message}</p>
                  ) : (
                    ""
                  )}
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 text-sm font-medium text-gray-900 "
                  >
                    Correo electrónico
                  </label>
                  <input
                    type="text"
                    id="email"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                    placeholder="example123@gmail.com"
                    disabled={loading}
                    {...register("email")}
                  />
                  {errors.email ? (
                    <p className="text-gray-900">{errors.email.message}</p>
                  ) : (
                    ""
                  )}
                </div>
                <div>
                  <label
                    htmlFor="first_name"
                    className="block mb-2 text-sm font-medium text-gray-900 "
                  >
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                    placeholder="Nombre"
                    disabled={loading}
                    {...register("first_name")}
                  />
                  {errors.first_name ? (
                    <p className="text-gray-900">{errors.first_name.message}</p>
                  ) : (
                    ""
                  )}
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Contraseña
                  </label>
                  <input
                    type="password"
                    id="password"
                    placeholder="••••••••"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                    disabled={loading}
                    {...register("password")}
                  />
                  {errors.password ? (
                    <p className="text-gray-900">{errors.password.message}</p>
                  ) : (
                    ""
                  )}
                </div>
                <div>
                  <label
                    htmlFor="confirm_password"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    id="confirm_password"
                    placeholder="••••••••"
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                    disabled={loading}
                    {...register("confirm_password")}
                  />
                  {errors.confirm_password ? (
                    <p className="text-gray-900">
                      {errors.confirm_password.message}
                    </p>
                  ) : (
                    ""
                  )}
                </div>
                
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-h-24 overflow-y-auto">
                    <p className="text-sm font-medium break-words">{error}</p>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-md bg-gray-900 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Registrando..." : "Registrarme"}
                </button>
                <p className="text-sm font-light text-gray-500">
                  ¿Ya tiene una cuenta?{" "}
                  <a
                    href="/login"
                    className="font-medium text-primary-600 hover:underline"
                  >
                    Inicie sesión aquí
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default RegisterPage;
