/**
 * @fileoverview Servicios de autenticación para comunicación con la API
 */

import axios from "axios";
import { type UserProfileToken } from "../types/User";

// Usamos rutas relativas para que las peticiones pasen por el proxy de Nginx
const api = "/api";

/**
 * Realiza login de usuario
 * @async
 * @function loginAPI
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<AxiosResponse<UserProfileToken>|undefined>} Respuesta con tokens de autenticación o undefined si hay error
 * 
 * @description
 * - Envía credenciales al endpoint de autenticación
 * - Retorna access token y refresh token si es exitoso
 * - Maneja errores de autenticación
 * 
 * @example
 * try {
 *   const response = await loginAPI('usuario', 'password123');
 *   if (response) {
 *     console.log(response.data.access); // Token de acceso
 *   }
 * } catch (error) {
 *   console.error('Login failed');
 * }
 */
export const loginAPI = async (username: string, password: string) => {
  try {
    const data = await axios.post<UserProfileToken>(api + "/token/", {
      username: username,
      password: password,
    });

    return data;
  } catch (err) {
    console.log("error en peticion para inicio de sesion " + err);
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
