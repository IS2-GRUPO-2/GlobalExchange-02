/**
 * @fileoverview Contexto de autenticación para manejo de usuarios y tokens
 */

import React from "react";
import type { User, DecodedToken } from "../features/usuario/types/User";
import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  loginAPI,
  refreshTokenAPI,
  registerAPI,
  verifyMfaLoginAPI,
} from "../services/authService";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { getUsuario } from "../features/usuario/services/usuarioService";

/**
 * @typedef {Object} UserContextType
 * @property {User|null} user - Usuario autenticado actual
 * @property {string|null} token - Token de acceso JWT
 * @property {string|null} refresh - Token de actualización
 * @property {boolean} mfaRequired - Indica si se requiere verificación MFA
 * @property {string|null} tempToken - Token temporal para verificación MFA
 * @property {Function} loginUser - Función para iniciar sesión
 * @property {Function} verifyMfa - Función para verificar código TOTP
 * @property {Function} registerUser - Función para registrar nuevo usuario
 * @property {Function} logout - Función para cerrar sesión
 * @property {Function} isLoggedIn - Función para verificar si está autenticado
 */
type UserContextType = {
  user: User | null;
  token: string | null;
  refresh: string | null;
  mfaRequired: boolean;
  tempToken: string | null;
  loginUser: (username: string, password: string) => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  registerUser: (
    username: string,
    email: string,
    first_name: string,
    password: string
  ) => Promise<boolean>;
  logout: () => void;
  isLoggedIn: () => boolean;
};

type Props = { children: React.ReactNode };

const UserContext = createContext<UserContextType>({} as UserContextType);

/**
 * Proveedor de contexto de autenticación
 * @component UserProvider
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijos
 * @returns {JSX.Element} Proveedor de contexto de autenticación
 * 
 * @description
 * - Maneja el estado de autenticación global
 * - Gestiona tokens JWT y refresh tokens
 * - Configura interceptores de Axios para renovación automática
 * - Persiste datos en localStorage
 * - Maneja redirecciones después de login/logout
 * 
 * @example
 * <UserProvider>
 *   <App />
 * </UserProvider>
 */
export const UserProvider = ({ children }: Props) => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  /**
   * Renueva el token de acceso usando el refresh token
   * @async
   * @function refreshToken
   * @returns {Promise<string|null>} Nuevo token de acceso o null si falla
   * 
   * @description
   * - Utiliza el refresh token para obtener un nuevo access token
   * - Actualiza el localStorage y el estado
   * - Configura headers de Axios automáticamente
   */
  const refreshToken = async () => {
    if (!refresh) return null;
    try {
      const res = await refreshTokenAPI(refresh);
      localStorage.setItem("token", res!.data.access); // store it
      setToken(res!.data.access); // update state
      axios.defaults.headers.common["Authorization"] = `Bearer ${
        res!.data.access
      }`; // update axios
      return res!.data.access; // return it for immediate use
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const refresh = localStorage.getItem("refresh");

    if (user && token && refresh) {
      setUser(JSON.parse(user));
      setToken(token);
      setRefresh(refresh);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401) {
          if (originalRequest.url.includes("/refresh")) {
            logout();
            return Promise.reject(error);
          }
          const newToken = await refreshToken();
          if (newToken) {
            error.config.headers["Authorization"] = `Bearer ${newToken}`;
            return axios(error.config); // retry the failed request
          }
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [refresh]);

  /**
   * Inicia sesión del usuario con soporte para MFA
   * @async
   * @function loginUser
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<void>}
   * 
   * @description
   * - Autentica al usuario con el backend
   * - Si el usuario NO tiene MFA: Completa el login inmediatamente
   * - Si el usuario SÍ tiene MFA: Guarda temp_token y solicita código TOTP
   * - Maneja errores de autenticación
   * 
   * @example
   * await loginUser('usuario123', 'password123');
   */
  const loginUser = async (username: string, password: string) => {
    try {
      const res = await loginAPI(username, password);
      
      if (!res) return;

      // Verificar si se requiere MFA
      if (res.data.mfa_required) {
        // Usuario tiene MFA habilitado - guardar token temporal
        setMfaRequired(true);
        setTempToken(res.data.temp_token || null);
        // No navegar ni guardar tokens aún
        return;
      }

      // Usuario sin MFA - login normal
      if (res.data.access && res.data.refresh) {
        localStorage.setItem("token", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);
        
        const userObj = jwtDecode<DecodedToken>(res.data.access);
        const headers = {
          headers: {
            Authorization: `Bearer ${res.data.access}`,
          },
        };
        const user = await getUsuario(userObj.user_id, headers);

        localStorage.setItem("user", JSON.stringify(user.data));
        setToken(res.data.access);
        setRefresh(res.data.refresh);
        setUser(user.data);
        setMfaRequired(false);
        setTempToken(null);
        navigate("/");
      }
    } catch (e) {
      console.log("error en useAuth: " + e);
      throw e;
    }
  };

  /**
   * Verifica el código TOTP y completa el login
   * @async
   * @function verifyMfa
   * @param {string} code - Código TOTP de 6 dígitos
   * @returns {Promise<void>}
   * 
   * @description
   * - Envía el código TOTP junto con el token temporal
   * - Si el código es válido, completa el login y obtiene JWT
   * - Almacena tokens y datos del usuario
   * - Redirecciona a la página principal
   * 
   * @example
   * await verifyMfa('123456');
   */
  const verifyMfa = async (code: string) => {
    if (!tempToken) {
      console.error("No hay token temporal");
      return;
    }

    try {
      const res = await verifyMfaLoginAPI(tempToken, code);
      
      if (!res) return;

      // Login exitoso con MFA
      localStorage.setItem("token", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      
      const userObj = jwtDecode<DecodedToken>(res.data.access);
      const headers = {
        headers: {
          Authorization: `Bearer ${res.data.access}`,
        },
      };
      const user = await getUsuario(userObj.user_id, headers);

      localStorage.setItem("user", JSON.stringify(user.data));
      setToken(res.data.access);
      setRefresh(res.data.refresh);
      setUser(user.data);
      setMfaRequired(false);
      setTempToken(null);
      navigate("/");
    } catch (e) {
      console.log("Error al verificar MFA: " + e);
      throw e;
    }
  };

  /**
   * Registra un nuevo usuario en el sistema
   * @async
   * @function registerUser
   * @param {string} username - Nombre de usuario único
   * @param {string} email - Correo electrónico del usuario
   * @param {string} first_name - Nombre del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<boolean>} true si el registro fue exitoso, false en caso contrario
   * 
   * @description
   * - Envía datos de registro al backend
   * - Retorna un booleano indicando el éxito de la operación
   * - No inicia sesión automáticamente después del registro
   * 
   * @example
   * const success = await registerUser('nuevo_usuario', 'email@ejemplo.com', 'Juan', 'password123');
   * if (success) {
   *   // Mostrar mensaje de éxito
   * }
   */
  const registerUser = async (
    username: string,
    email: string,
    first_name: string,
    password: string
  ): Promise<boolean> => {
    let success = false;
    const res = await registerAPI(username, email, first_name, password);
    if (res) {
      success = true;
      console.log(res);
    }

    return success;
  };

  /**
   * Verifica si el usuario está autenticado
   * @function isLoggedIn
   * @returns {boolean} true si hay un usuario autenticado, false en caso contrario
   * 
   * @description
   * - Verifica la existencia del objeto user en el estado
   * - Útil para renderizado condicional y protección de rutas
   * 
   * @example
   * if (isLoggedIn()) {
   *   // Mostrar contenido para usuarios autenticados
   * }
   */
  const isLoggedIn = () => {
    console.log("datos usuario: " + user);
    console.log("User logged in: " + !!user);
    return !!user;
  };

  /**
   * Cierra la sesión del usuario actual
   * @function logout
   * @returns {void}
   * 
   * @description
   * - Elimina todos los datos de autenticación del localStorage
   * - Limpia el estado del usuario y tokens
   * - Redirecciona a la página principal
   * - Limpia headers de autorización
   * 
   * @example
   * logout(); // Cierra sesión y redirecciona
   */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refresh");
    setUser(null);
    setToken("");
    setRefresh("");
    navigate("/");
  };

  return (
    <UserContext.Provider
      value={{
        loginUser,
        verifyMfa,
        registerUser,
        user,
        token,
        refresh,
        mfaRequired,
        tempToken,
        logout,
        isLoggedIn,
      }}
    >
      {isReady ? children : null}
    </UserContext.Provider>
  );
};

/**
 * Hook personalizado para acceder al contexto de autenticación
 * @function useAuth
 * @returns {UserContextType} Objeto con métodos y estado de autenticación
 * @throws {Error} Error si se usa fuera del UserProvider
 * 
 * @description
 * - Proporciona acceso a todas las funciones de autenticación
 * - Debe usarse dentro de un componente envuelto por UserProvider
 * - Incluye user, token, loginUser, registerUser, logout, isLoggedIn
 * 
 * @example
 * const { user, loginUser, logout, isLoggedIn } = useAuth();
 * 
 * if (isLoggedIn()) {
 *   return <div>Bienvenido {user?.first_name}</div>;
 * }
 */
export const useAuth = () => React.useContext(UserContext);
