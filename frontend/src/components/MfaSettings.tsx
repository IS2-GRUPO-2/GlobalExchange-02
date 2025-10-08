/**
 * @fileoverview Componente para gestionar la configuración de MFA (Autenticación de Dos Factores)
 * @component MfaSettings
 * 
 * @description
 * Componente reutilizable que permite a los usuarios:
 * - Ver el estado actual de MFA (habilitado/deshabilitado)
 * - Habilitar MFA generando un código QR para Google Authenticator
 * - Deshabilitar MFA ingresando un código de verificación
 * 
 * @example
 * // Uso en cualquier página
 * import MfaSettings from '../components/MfaSettings';
 * 
 * function ProfilePage() {
 *   return (
 *     <div>
 *       <h1>Configuración de Seguridad</h1>
 *       <MfaSettings />
 *     </div>
 *   );
 * }
 */

import { useState, useEffect } from "react";
import * as Yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  getMfaStatusAPI,
  setupMfaAPI,
  enableMfaAPI,
  disableMfaAPI,
} from "../services/authService";

/**
 * Tipos para el formulario de código MFA
 */
type MfaCodeForm = {
  code: string;
};

/**
 * Esquema de validación para código MFA
 */
const codeValidation = Yup.object().shape({
  code: Yup.string()
    .required("El código es necesario")
    .matches(/^[0-9]{6}$/, "El código debe tener 6 dígitos"),
});

/**
 * Estados del componente MFA
 */
type MfaState = "loading" | "disabled" | "setup" | "enabled";

/**
 * Componente principal de configuración MFA
 */
const MfaSettings = () => {
  const [state, setState] = useState<MfaState>("loading");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MfaCodeForm>({ resolver: yupResolver(codeValidation) });

  /**
   * Cargar el estado actual de MFA al montar el componente
   */
  useEffect(() => {
    loadMfaStatus();
  }, []);

  /**
   * Obtiene el estado actual de MFA del usuario
   */
  const loadMfaStatus = async () => {
    try {
      const response = await getMfaStatusAPI();
      if (response?.data.mfa_enabled) {
        setState("enabled");
      } else {
        setState("disabled");
      }
    } catch (err) {
      console.error("Error al cargar estado de MFA:", err);
      setError("Error al cargar la configuración de MFA");
      setState("disabled");
    }
  };

  /**
   * Inicia el proceso de configuración de MFA generando el QR code
   */
  const handleStartSetup = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await setupMfaAPI();
      if (response) {
        setQrCode(response.data.qr_code);
        setSecret(response.data.secret);
        setState("setup");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al generar código QR");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Habilita MFA verificando el código TOTP ingresado
   */
  const handleEnableMfa = async (form: MfaCodeForm) => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await enableMfaAPI(form.code);
      setSuccess("¡MFA habilitado exitosamente!");
      setState("enabled");
      reset();
      setQrCode("");
      setSecret("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Código inválido. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deshabilita MFA verificando el código TOTP ingresado
   */
  const handleDisableMfa = async (form: MfaCodeForm) => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await disableMfaAPI(form.code);
      setSuccess("MFA deshabilitado exitosamente");
      setState("disabled");
      reset();
    } catch (err: any) {
      setError(err.response?.data?.error || "Código inválido. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancela el proceso de configuración
   */
  const handleCancelSetup = () => {
    setState("disabled");
    setQrCode("");
    setSecret("");
    setError("");
    setSuccess("");
    reset();
  };

  /**
   * Renderizado del estado de carga
   */
  if (state === "loading") {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-300 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Autenticación de Dos Factores (MFA)
        </h2>
        <p className="text-gray-600">
          Agrega una capa adicional de seguridad a tu cuenta requiriendo un código de tu
          teléfono además de tu contraseña.
        </p>
      </div>

      {/* MENSAJES DE ÉXITO/ERROR */}
      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* ESTADO: MFA DESHABILITADO */}
      {state === "disabled" && (
        <div>
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                MFA no está habilitado
              </h3>
              <p className="text-gray-600">
                Tu cuenta no está protegida con autenticación de dos factores
              </p>
            </div>
          </div>

          <button
            onClick={handleStartSetup}
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generando..." : "Habilitar MFA"}
          </button>
        </div>
      )}

      {/* ESTADO: CONFIGURANDO MFA (MOSTRANDO QR) */}
      {state === "setup" && (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Configurar Autenticación de Dos Factores
            </h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">Paso 1: Escanea el código QR</h4>
              <p className="text-blue-800 text-sm mb-4">
                Usa una aplicación de autenticación como Google Authenticator, Microsoft
                Authenticator, o Authy para escanear este código QR.
              </p>

              {/* QR CODE */}
              <div className="flex justify-center bg-white p-4 rounded-lg mb-4">
                {qrCode && (
                  <img
                    src={qrCode}
                    alt="QR Code para MFA"
                    className="w-48 h-48"
                  />
                )}
              </div>

              {/* SECRETO EN TEXTO */}
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-xs text-gray-600 mb-1">
                  O ingresa este código manualmente:
                </p>
                <code className="text-sm font-mono text-gray-900 break-all">
                  {secret}
                </code>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-yellow-900 mb-2">
                Paso 2: Verifica el código
              </h4>
              <p className="text-yellow-800 text-sm mb-4">
                Ingresa el código de 6 dígitos que aparece en tu aplicación de autenticación
                para confirmar la configuración.
              </p>

              <form onSubmit={handleSubmit(handleEnableMfa)} className="space-y-4">
                <div>
                  <label
                    htmlFor="code"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Código de verificación
                  </label>
                  <input
                    type="text"
                    id="code"
                    maxLength={6}
                    placeholder="000000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                    disabled={loading}
                    {...register("code")}
                  />
                  {errors.code && (
                    <p className="text-red-600 text-sm mt-1">{errors.code.message}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Verificando..." : "Habilitar MFA"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelSetup}
                    disabled={loading}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ESTADO: MFA HABILITADO */}
      {state === "enabled" && (
        <div>
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0">
              <svg
                className="h-12 w-12 text-green-500"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                MFA está habilitado ✓
              </h3>
              <p className="text-gray-600">
                Tu cuenta está protegida con autenticación de dos factores
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">
              Deshabilitar autenticación de dos factores
            </h4>
            <p className="text-red-800 text-sm mb-4">
              Para deshabilitar MFA, ingresa el código actual de tu aplicación de
              autenticación.
            </p>

            <form onSubmit={handleSubmit(handleDisableMfa)} className="space-y-4">
              <div>
                <label
                  htmlFor="code-disable"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Código de verificación
                </label>
                <input
                  type="text"
                  id="code-disable"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-2xl tracking-widest"
                  disabled={loading}
                  {...register("code")}
                />
                {errors.code && (
                  <p className="text-red-600 text-sm mt-1">{errors.code.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Deshabilitando..." : "Deshabilitar MFA"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* INFORMACIÓN ADICIONAL */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-2">
          ¿Qué es la autenticación de dos factores?
        </h4>
        <p className="text-sm text-gray-600 mb-2">
          La autenticación de dos factores (MFA) agrega una capa extra de seguridad a tu
          cuenta. Además de tu contraseña, necesitarás un código de tu teléfono para
          iniciar sesión.
        </p>
        <p className="text-sm text-gray-600">
          Aplicaciones recomendadas: Google Authenticator, Microsoft Authenticator, Authy
        </p>
      </div>
    </div>
  );
};

export default MfaSettings;
