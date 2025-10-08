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
import { toast } from "react-toastify";
import {
  getMfaStatusAPI,
  setupMfaAPI,
  enableMfaAPI,
  disableMfaAPI,
} from "../services/authService";
import {
  ShieldCheck,
  ShieldX,
  QrCode,
  Loader2,
  CheckCircle2,
  KeyRound,
  XCircle,
  Smartphone,
  Info
} from "lucide-react";

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
type MfaState = "loading" | "disabled" | "setup" | "enabled" | "disabling";

/**
 * Componente principal de configuración MFA
 */
const MfaSettings = () => {
  const [state, setState] = useState<MfaState>("loading");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [error, setError] = useState<string>("");
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
    setLoading(true);

    try {
      await enableMfaAPI(form.code);
      toast.success("¡MFA habilitado exitosamente!");
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
   * Inicia el proceso de desactivación de MFA
   */
  const handleStartDisable = () => {
    setError("");
    setState("disabling");
  };

  /**
   * Deshabilita MFA verificando el código TOTP ingresado
   */
  const handleDisableMfa = async (form: MfaCodeForm) => {
    setError("");
    setLoading(true);

    try {
      await disableMfaAPI(form.code);
      toast.success("MFA deshabilitado exitosamente");
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
    reset();
  };

  /**
   * Cancela el proceso de desactivación
   */
  const handleCancelDisable = () => {
    setState("enabled");
    setError("");
    reset();
  };

  /**
   * Renderizado del estado de carga
   */
  if (state === "loading") {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-300 rounded w-full"></div>
        </div>
      </div>
    );
  }

   return (
    <div className="bg-white rounded-lg shadow p-5 max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">
            Autenticación de dos factores
          </h2>
        </div>

        {/* Chip de estado */}
        {state === "enabled" ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Activo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
            Inactivo
          </span>
        )}
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="mb-3 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Disabled */}
      {state === "disabled" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Agrega una capa adicional de seguridad a tu cuenta.
            <br />
            Compatible con   Google Authenticator o Authy.
          </p>

          <button
            onClick={handleStartSetup}
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                Habilitar
              </>
            )}
          </button>
        </div>
      )}

      {/* Setup */}
      {state === "setup" && (
        <div className="space-y-4">
          {/* QR Code */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Escanea con tu app de autenticación</p>
            <div className="bg-gray-50 border border-gray-300 rounded-md p-4 flex justify-center">
              {qrCode ? (
                <img src={qrCode} alt="QR MFA" className="h-40 w-40" />
              ) : (
                <div className="h-40 w-40 bg-gray-200 animate-pulse rounded" />
              )}
            </div>
          </div>

          {/* Código manual */}
          <div className="space-y-2">
           <p className="text-sm font-medium text-gray-700">Código manual</p>
            <div className="mt-2 bg-gray-50 border border-gray-300 rounded px-3 py-2">
              <code className="text-xs font-mono text-gray-900 break-all">{secret}</code>
            </div>
          </div>

          {/* Verificación */}
          <form onSubmit={handleSubmit(handleEnableMfa)} className="space-y-3 pt-2">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Código de verificación
              </label>
              <input
                id="code"
                type="text"
                maxLength={6}
                placeholder="000000"
                className="w-full text-center text-xl tracking-widest px-3 py-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                disabled={loading}
                {...register("code")}
              />
              {errors?.code && (
                <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Activar"
                )}
              </button>
              <button
                type="button"
                onClick={handleCancelSetup}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Enabled */}
      {state === "enabled" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Tu cuenta está protegida con autenticación de dos factores.
          </p>

          <button
            onClick={handleStartDisable}
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-gray-900 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                Deshabilitar
              </>
            )}
          </button>
        </div>
      )}

      {/* Disabling */}
      {state === "disabling" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Ingresa tu código de autenticación para desactivar MFA.
          </p>

          <form onSubmit={handleSubmit(handleDisableMfa)} className="space-y-3">
            <div>
              <label htmlFor="code-disable" className="block text-sm font-medium text-gray-700 mb-2">
                Código de verificación
              </label>
              <input
                id="code-disable"
                type="text"
                maxLength={6}
                placeholder="000000"
                className="w-full text-center text-xl tracking-widest px-3 py-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={loading}
                {...register("code")}
              />
              {errors?.code && (
                <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deshabilitando...
                  </>
                ) : (
                  "Desactivar"
                )}
              </button>
              <button
                type="button"
                onClick={handleCancelDisable}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MfaSettings;
