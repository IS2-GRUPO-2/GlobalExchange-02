/**
 * @fileoverview Página de inicio de sesión para usuarios con soporte MFA
 */

import * as Yup from "yup";
import { useAuth } from "../context/useAuth";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState, useEffect } from "react";

/**
 * @typedef {Object} LoginFormInputs
 * @property {string} username - Nombre de usuario
 * @property {string} password - Contraseña del usuario
 */
type LoginFormInputs = {
  username: string;
  password: string;
};

/**
 * @typedef {Object} MFAFormInputs
 * @property {string} code - Código TOTP de 6 dígitos
 */
type MFAFormInputs = {
  code: string;
};

/** Esquema de validación para el formulario de login */
const validation = Yup.object().shape({
  username: Yup.string().required("El nombre de usuario es necesario"),
  password: Yup.string().required("La contraseña de usuario es necesaria"),
});

/** Esquema de validación para el código MFA */
const mfaValidation = Yup.object().shape({
  code: Yup.string()
    .required("El código es necesario")
    .matches(/^[0-9]{6}$/, "El código debe tener 6 dígitos"),
});

/**
 * Página de inicio de sesión con soporte para MFA
 * @component LoginPage
 * @returns {JSX.Element} Página de login con formulario de autenticación
 * 
 * @description
 * - Formulario de autenticación con validación usando Yup y React Hook Form
 * - Soporte para autenticación de dos factores (MFA)
 * - Flujo de 2 pasos: credenciales + código TOTP (si está habilitado)
 * - Manejo de errores de validación en tiempo real
 * - Redirección automática después del login exitoso
 * 
 * @features
 * - Validación de formulario en cliente
 * - Diseño responsivo y centrado
 * - Mensajes de error amigables
 * - Integración con contexto de autenticación
 * - Soporte para MFA opcional
 * 
 * @example
 * // Se accede mediante la ruta /login
 * <Route path="/login" element={<LoginPage />} />
 */
const LoginPage = () => {
  const { loginUser, verifyMfa, mfaRequired } = useAuth();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Formulario de login (username/password)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({ resolver: yupResolver(validation) });

  // Formulario de MFA (código TOTP)
  const {
    register: registerMfa,
    handleSubmit: handleSubmitMfa,
    formState: { errors: errorsMfa },
  } = useForm<MFAFormInputs>({ resolver: yupResolver(mfaValidation) });

  // Limpiar errores cuando cambia el estado de MFA
  useEffect(() => {
    setError("");
  }, [mfaRequired]);

  /**
   * Maneja el envío del formulario de login
   * @function handleLogin
   * @param {LoginFormInputs} form - Datos del formulario
   * @returns {Promise<void>}
   * 
   * @description
   * - Llama a la función loginUser del contexto
   * - Si el usuario tiene MFA, muestra el formulario de código TOTP
   * - Si no tiene MFA, completa el login inmediatamente
   */
  const handleLogin = async (form: LoginFormInputs) => {
    setError("");
    setLoading(true);
    try {
      await loginUser(form.username, form.password);
    } catch (e: any) {
      console.error("Error en handleLogin:", e);
      
      // Extraer el mensaje de error de diferentes posibles estructuras
      let errorMessage = "Error al iniciar sesión";
      
      if (e.response?.data?.error) {
        errorMessage = e.response.data.error;
      } else if (e.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el envío del código MFA
   * @function handleMfaSubmit
   * @param {MFAFormInputs} form - Datos del formulario con código TOTP
   * @returns {Promise<void>}
   * 
   * @description
   * - Verifica el código TOTP con el backend
   * - Si es correcto, completa el login y redirecciona
   * - Si es incorrecto, muestra mensaje de error
   */
  const handleMfaSubmit = async (form: MFAFormInputs) => {
    setError("");
    setLoading(true);
    try {
      await verifyMfa(form.code);
    } catch (e: any) {
      console.error("Error en handleMfaSubmit:", e);
      
      // Extraer el mensaje de error de diferentes posibles estructuras
      let errorMessage = "Código inválido";
      
      if (e.response?.data?.error) {
        errorMessage = e.response.data.error;
      } else if (e.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gray-50 min-h-screen">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto min-h-screen">
        <div className="w-full bg-white rounded-lg shadow-lg sm:max-w-md xl:p-0 my-8">
          <div className="pl-8 pt-6">
            <h1 className="text-xl leading-tight tracking-tight text-gray-900 md:text-2xl">
              Bienvenido!
            </h1>
          </div>
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            {!mfaRequired ? (
              /* FORMULARIO DE LOGIN (USERNAME/PASSWORD) */
              <>
                <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                  Inicie sesión
                </h1>
                <form
                  className="space-y-4 md:space-y-6"
                  onSubmit={handleSubmit(handleLogin)}
                >
                  <div>
                    <label
                      htmlFor="username"
                      className="block mb-2 text-sm font-medium text-gray-900"
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
                    {errors.username && (
                      <p className="text-red-600 text-sm mt-1">{errors.username.message}</p>
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
                    {errors.password && (
                      <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
                    )}
                  </div>
                  
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="remember"
                          aria-describedby="remember"
                          type="checkbox"
                          className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="remember" className="text-gray-500">
                          Recordarme
                        </label>
                      </div>
                    </div>
                    <a
                      href="#"
                      className="text-sm font-medium text-primary-600 hover:underline"
                    >
                      Olvidé mi contraseña
                    </a>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full justify-center rounded-md bg-gray-900 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                  </button>
                  
                  <p className="text-sm font-light text-gray-500">
                    Aún no tiene una cuenta?{" "}
                    <a
                      href="/register"
                      className="font-medium text-primary-600 hover:underline"
                    >
                      Regístrese aquí
                    </a>
                  </p>
                </form>
              </>
            ) : (
              /* FORMULARIO DE VERIFICACIÓN MFA */
              <>
                <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                  Verificación de dos factores
                </h1>
                <p className="text-sm text-gray-600">
                  Ingrese el código de 6 dígitos de su aplicación de autenticación (Google Authenticator, Authy, etc.)
                </p>
                <form
                  className="space-y-4 md:space-y-6"
                  onSubmit={handleSubmitMfa(handleMfaSubmit)}
                >
                  <div>
                    <label
                      htmlFor="code"
                      className="block mb-2 text-sm font-medium text-gray-900"
                    >
                      Código de autenticación
                    </label>
                    <input
                      type="text"
                      id="code"
                      maxLength={6}
                      placeholder="000000"
                      className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 text-center text-2xl tracking-widest"
                      disabled={loading}
                      {...registerMfa("code")}
                    />
                    {errorsMfa.code && (
                      <p className="text-red-600 text-sm mt-1">{errorsMfa.code.message}</p>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full justify-center rounded-md bg-gray-900 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Verificando..." : "Verificar código"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
