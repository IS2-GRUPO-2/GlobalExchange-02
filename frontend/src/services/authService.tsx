/**
 * @fileoverview Servicios de autenticación y MFA para comunicación con la API
 * 
 * Este módulo contiene todas las funciones para:
 * - Autenticación básica (login, registro, refresh token)
 * - Gestión de MFA (status, setup, enable, disable)
 * - Verificación de MFA durante login
 * 
 * @author Elias Figueredo
 * @date 08-10-2025
 */

import axios from "axios";
import { 
  type UserProfileToken, 
  type MFALoginResponse, 
  type MFASetupResponse,
  type MFAStatusResponse 
} from "../features/usuario/types/User";

// Usamos rutas relativas para que las peticiones pasen por el proxy de Nginx
const api = "/api";

/**
 * Realiza login de usuario con soporte para MFA
 * @async
 * @function loginAPI
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<AxiosResponse<MFALoginResponse>|undefined>} Respuesta con tokens o solicitud de MFA
 * 
 * @description
 * - Envía credenciales al endpoint de autenticación
 * - Si el usuario NO tiene MFA: Retorna access token y refresh token
 * - Si el usuario SÍ tiene MFA: Retorna temp_token y mfa_required: true
 * - Maneja errores de autenticación
 * 
 * @example
 * const response = await loginAPI('usuario', 'password123');
 * if (response?.data.mfa_required) {
 *   // Solicitar código TOTP
 * } else {
 *   // Login exitoso, guardar tokens
 * }
 */
export const loginAPI = async (username: string, password: string) => {
  try {
    const data = await axios.post<MFALoginResponse>(api + "/auth/login/", {
      username: username,
      password: password,
    });

    return data;
  } catch (err) {
    console.log("error en peticion para inicio de sesion " + err);
    throw err;
  }
};

/**
 * Renueva el token de acceso usando el refresh token
 * @async
 * @function refreshTokenAPI
 * @param {string} refresh_token - Token de renovación
 * @returns {Promise<AxiosResponse<UserProfileToken>|undefined>} Respuesta con nuevo access token o undefined si hay error
 * 
 * @description
 * - Utiliza el refresh token para obtener un nuevo access token
 * - Evita que el usuario tenga que hacer login nuevamente
 * - Se llama automáticamente cuando el access token expira
 * 
 * @example
 * try {
 *   const response = await refreshTokenAPI(refreshToken);
 *   if (response) {
 *     // Actualizar token en el estado
 *   }
 * } catch (error) {
 *   // Redirigir al login
 * }
 */
export const refreshTokenAPI = async (refresh_token: string) => {
  try {
    const data = await axios.post<UserProfileToken>(api + "/token/refresh/", {
      refresh: refresh_token,
    });

    return data;
  } catch (err) {
    console.log("error al refrescar token" + err);
  }
};

/**
 * Registra un nuevo usuario en el sistema
 * @async
 * @function registerAPI
 * @param {string} username - Nombre de usuario único
 * @param {string} email - Correo electrónico del usuario
 * @param {string} first_name - Nombre del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<AxiosResponse<UserProfileToken>|undefined>} Respuesta del registro o undefined si hay error
 * 
 * @description
 * - Crea una nueva cuenta de usuario
 * - Valida que el username y email sean únicos
 * - Retorna información del usuario registrado
 * 
 * @example
 * try {
 *   const response = await registerAPI('nuevo_usuario', 'email@ejemplo.com', 'Juan', 'password123');
 *   if (response) {
 *     // Mostrar mensaje de éxito
 *   }
 * } catch (error) {
 *   // Mostrar errores de validación
 * }
 */
export const registerAPI = async (
  username: string,
  email: string,
  first_name: string,
  password: string
) => {
  try {
    const data = await axios.post<UserProfileToken>(api + "/auth/register/", {
      username: username,
      email: email,
      first_name: first_name,
      password: password,
    });

    return data;
  } catch (err) {
    console.log("Error en el endpoint de registro: " + err);
  }
};

export const verifyEmailAPI = async (email: string, code: string) => {
  try {
    const data = await axios.post(api + "/auth/verify-email/", {
      email: email,
      code: code,
    });

    return data;
  } catch (err) {
    console.log("Error en el endpoint de verificacion" + err);
  }
};

// ============================================
// MFA (Multi-Factor Authentication) API
// ============================================

/**
 * Verifica el código TOTP durante el login y obtiene el JWT real
 * @async
 * @function verifyMfaLoginAPI
 * @param {string} tempToken - Token temporal recibido del login
 * @param {string} code - Código TOTP de 6 dígitos
 * @returns {Promise<AxiosResponse<UserProfileToken>>} Respuesta con JWT real
 * 
 * @description
 * - Envía el token temporal y el código TOTP
 * - Si el código es válido, retorna access token y refresh token
 * - Si el código es inválido, retorna error
 * 
 * @example
 * const response = await verifyMfaLoginAPI(tempToken, '123456');
 * if (response) {
 *   // Guardar tokens y completar login
 * }
 */
export const verifyMfaLoginAPI = async (tempToken: string, code: string) => {
  try {
    const data = await axios.post<UserProfileToken>(api + "/auth/mfa/verify-login/", {
      temp_token: tempToken,
      token: code,
    });

    return data;
  } catch (err) {
    console.log("Error en verificación de MFA: " + err);
    throw err;
  }
};

/**
 * Obtiene el estado de MFA del usuario actual
 * @async
 * @function getMfaStatusAPI
 * @returns {Promise<AxiosResponse<MFAStatusResponse>>} Estado de MFA del usuario
 * 
 * @description
 * - Requiere autenticación (JWT en headers)
 * - Retorna si el usuario tiene MFA habilitado
 * 
 * @example
 * const response = await getMfaStatusAPI();
 * if (response?.data.mfa_enabled) {
 *   // Mostrar botón "Deshabilitar MFA"
 * }
 */
export const getMfaStatusAPI = async () => {
  try {
    const data = await axios.get<MFAStatusResponse>(api + "/auth/mfa/status/");
    return data;
  } catch (err) {
    console.log("Error al obtener estado de MFA: " + err);
    throw err;
  }
};

/**
 * Genera un nuevo dispositivo TOTP y retorna el QR code
 * @async
 * @function setupMfaAPI
 * @returns {Promise<AxiosResponse<MFASetupResponse>>} QR code y secreto para configurar
 * 
 * @description
 * - Requiere autenticación (JWT en headers)
 * - Genera un nuevo dispositivo TOTP
 * - Retorna QR code en base64 y secreto en texto
 * 
 * @example
 * const response = await setupMfaAPI();
 * if (response) {
 *   // Mostrar QR code para escanear con Google Authenticator
 * }
 */
export const setupMfaAPI = async () => {
  try {
    const data = await axios.post<MFASetupResponse>(api + "/auth/mfa/setup/");
    return data;
  } catch (err) {
    console.log("Error en setup de MFA: " + err);
    throw err;
  }
};

/**
 * Habilita MFA para el usuario después de verificar el código
 * @async
 * @function enableMfaAPI
 * @param {string} code - Código TOTP de 6 dígitos para confirmar
 * @returns {Promise<AxiosResponse>} Confirmación de habilitación
 * 
 * @description
 * - Requiere autenticación (JWT en headers)
 * - Verifica el código TOTP del dispositivo configurado
 * - Si es correcto, habilita MFA para el usuario
 * 
 * @example
 * const response = await enableMfaAPI('123456');
 * if (response) {
 *   // MFA habilitado exitosamente
 * }
 */
export const enableMfaAPI = async (code: string) => {
  try {
    const data = await axios.post(api + "/auth/mfa/enable/", {
      token: code,
    });
    return data;
  } catch (err) {
    console.log("Error al habilitar MFA: " + err);
    throw err;
  }
};

/**
 * Deshabilita MFA para el usuario después de verificar el código
 * @async
 * @function disableMfaAPI
 * @param {string} code - Código TOTP de 6 dígitos para confirmar
 * @returns {Promise<AxiosResponse>} Confirmación de deshabilitación
 * 
 * @description
 * - Requiere autenticación (JWT en headers)
 * - Verifica el código TOTP actual
 * - Si es correcto, elimina el dispositivo TOTP y deshabilita MFA
 * 
 * @example
 * const response = await disableMfaAPI('123456');
 * if (response) {
 *   // MFA deshabilitado exitosamente
 * }
 */
export const disableMfaAPI = async (code: string) => {
  try {
    const data = await axios.post(api + "/auth/mfa/disable/", {
      token: code,
    });
    return data;
  } catch (err) {
    console.log("Error al deshabilitar MFA: " + err);
    throw err;
  }
};
