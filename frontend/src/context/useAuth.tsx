/**
 * @fileoverview Contexto de autenticación con soporte para MFA
 * 
 * @description
 * Provee autenticación a nivel de aplicación con soporte completo para:
 * - Login tradicional (username/password)
 * - Autenticación de dos factores (MFA/2FA)
 * - Gestión de tokens JWT (access y refresh)
 * - Registro de nuevos usuarios
 * - Persistencia de sesión en localStorage
 * - Configuración de headers de Axios
 * 
 * **Flujo de Login sin MFA:**
 * 1. Usuario ingresa credenciales
 * 2. Se reciben tokens JWT inmediatamente
 * 3. Se guarda sesión y se redirecciona
 * 
 * **Flujo de Login con MFA:**
 * 1. Usuario ingresa credenciales
 * 2. Se recibe token temporal (válido 5 minutos)
 * 3. Se solicita código TOTP de 6 dígitos
 * 4. Al verificar código correcto, se reciben tokens JWT
 * 5. Se guarda sesión y se redirecciona
 * 
 * @author Elias Figueredo
 * @date 08-10-2025
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
 * @property {string|null} tempToken - Token temporal para verificación MFA (expira en 5 min)
 * @property {Function} loginUser - Función para iniciar sesión con soporte MFA
 * @property {Function} verifyMfa - Función para verificar código TOTP de 6 dígitos
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
          // Ignorar errores 401 de endpoints de autenticación
          // Estos son errores esperados (credenciales incorrectas, código MFA inválido, etc.)
          if (originalRequest.url.includes("/auth/login/") || 
              originalRequest.url.includes("/auth/register/") ||
              originalRequest.url.includes("/mfa/verify-login/")) {
            return Promise.reject(error);
          }
          
          // Si es un error de refresh token, hacer logout
          if (originalRequest.url.includes("/refresh")) {
            logout();
            return Promise.reject(error);
          }
          
          // Para otros endpoints, intentar renovar el token
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
      
      if (!res) {
        throw new Error("No se recibió respuesta del servidor");
      }

      // Verificar si se requiere MFA
      if (res.data.mfa_required) {
        setMfaRequired(true);
        setTempToken(res.data.temp_token || null);
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
        
        // Notificar a otros contextos que el usuario se autenticó
        window.dispatchEvent(new Event('auth-changed'));
        
        navigate("/");
      }
    } catch (e) {
      console.error("Error en loginUser:", e);
      // Re-lanzar el error para que sea capturado por el componente
      throw e;
    }
  };

  /**
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
      
      // Notificar a otros contextos que el usuario se autenticó
      window.dispatchEvent(new Event('auth-changed'));
      
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
    try {
      const res = await registerAPI(username, email, first_name, password);
      if (res) {
        console.log("Usuario registrado exitosamente:", res);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error en registerUser:", e);
      // Re-lanzar el error para que el componente pueda manejarlo
      throw e;
    }
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
    delete axios.defaults.headers.common["Authorization"];
    
    // Notificar a otros contextos que el usuario cerró sesión
    window.dispatchEvent(new Event('auth-changed'));
    
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
