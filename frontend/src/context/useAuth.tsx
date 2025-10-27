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
  loginUserTauser: (username: string, password: string) => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  verifyMfaTauser: (code: string) => Promise<void>;
  registerUser: (
    username: string,
    email: string,
    first_name: string,
    password: string
  ) => Promise<boolean>;
  logout: () => void;
  logoutTauser: () => void;
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
   * Login especial para terminal TAUSER: SOLO permite login si el usuario tiene MFA habilitado
   * Si el usuario no tiene MFA, lanza un error y no navega ni guarda tokens
   * Si el usuario tiene MFA, actualiza el contexto y permite avanzar de etapa
   */
  const loginUserTauser = async (username: string, password: string) => {
    try {
      // NO reseteamos mfaRequired aquí - dejamos que el estado actual persista
      // Solo lo actualizaremos basado en la respuesta del servidor
      
      const res = await loginAPI(username, password, "tauser");
      if (!res) {
        throw new Error("No se recibió respuesta del servidor");
      }

      // Caso 1: Usuario con MFA habilitado
      if (res.data.mfa_required) {
        setMfaRequired(true);
        setTempToken(res.data.temp_token || null);
        return; // Salir exitosamente, el componente mostrará el form MFA
      }

      // Caso 2: Usuario sin MFA (no permitido en terminal TAUSER)
      // Limpiar cualquier estado residual antes de lanzar error
      setMfaRequired(false);
      setTempToken(null);
      throw new Error("Este terminal requiere autenticación de dos factores (MFA). Solicite al administrador que habilite MFA en su cuenta.");
      
    } catch (e: any) {
      console.error("Error en loginUserTauser:", e);
      
      // Limpiar estado de MFA solo en caso de error real
      // (no cuando se está esperando el código MFA)
      setMfaRequired(false);
      setTempToken(null);
      
      // Construir mensaje de error apropiado
      let errorMessage = "Error de autenticación. Verifique sus credenciales.";
      
      if (e.response?.data?.error) {
        errorMessage = e.response.data.error;
      } else if (e.response?.data?.detail) {
        errorMessage = e.response.data.detail;
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      // Re-lanzar el error con el mensaje apropiado
      const error = new Error(errorMessage);
      // Preservar información adicional del error original si existe
      if (e.response) {
        (error as any).response = e.response;
      }
      throw error;
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
      
      // Notificar a otros contextos que el usuario se autenticó
      window.dispatchEvent(new Event('auth-changed'));
      
      navigate("/");
    } catch (e) {
      console.log("Error al verificar MFA: " + e);
      throw e;
    }
  };
  /**
   * Verifica el código TOTP y completa el login para terminal TAUSER
   * NO redirecciona automáticamente, permite que el componente maneje el flujo
   */
  const verifyMfaTauser = async (code: string) => {
    if (!tempToken) {
      throw new Error("Sesión expirada. Por favor, inicie sesión nuevamente.");
    }

    try {
      const res = await verifyMfaLoginAPI(tempToken, code);
      
      if (!res || !res.data.access || !res.data.refresh) {
        throw new Error("Respuesta inválida del servidor");
      }

      // Guardar tokens
      localStorage.setItem("token", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      
      // Obtener datos del usuario
      const userObj = jwtDecode<DecodedToken>(res.data.access);
      const headers = {
        headers: {
          Authorization: `Bearer ${res.data.access}`,
        },
      };
      const user = await getUsuario(userObj.user_id, headers);

      // Actualizar estado global
      localStorage.setItem("user", JSON.stringify(user.data));
      setToken(res.data.access);
      setRefresh(res.data.refresh);
      setUser(user.data);
      
      // Limpiar estado de MFA - autenticación completada
      setMfaRequired(false);
      setTempToken(null);
      
      // NO navegamos aquí - dejamos que el componente llame a onAutenticacionExitosa()
      
    } catch (e: any) {
      console.error("Error en verifyMfaTauser:", e);
      
      // Construir mensaje de error
      let errorMessage = "Código MFA inválido. Intente nuevamente.";
      
      if (e.response?.data?.error) {
        errorMessage = e.response.data.error;
      } else if (e.response?.data?.detail) {
        errorMessage = e.response.data.detail;
      } else if (e.message && !e.message.includes("Respuesta inválida")) {
        errorMessage = e.message;
      }
      
      // Si el error es 401 o indica token expirado, limpiar el estado
      if (
        e.response?.status === 401 ||
        errorMessage.toLowerCase().includes("expirad") ||
        errorMessage.toLowerCase().includes("inválido")
      ) {
        // Solo limpiar tempToken si es un error de token
        if (errorMessage.toLowerCase().includes("expirad") || 
            errorMessage.toLowerCase().includes("token")) {
          setTempToken(null);
          setMfaRequired(false);
        }
      }
      
      // Re-lanzar el error
      const error = new Error(errorMessage);
      if (e.response) {
        (error as any).response = e.response;
      }
      throw error;
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
    // Limpiar el cliente seleccionado del store
    localStorage.removeItem("selected-client");
    setUser(null);
    setToken("");
    setRefresh("");
    
    // Notificar a otros contextos que el usuario cerró sesión
    window.dispatchEvent(new Event('auth-changed'));
    
    navigate("/");
  };
   /**
   * Cierra la sesión del usuario actual en el terminal TAUSER
   * NO redirecciona - permite que el componente maneje la navegación
   */
  const logoutTauser = () => {
    // Limpiar localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refresh");
    // Limpiar el cliente seleccionado del store
    localStorage.removeItem("selected-client");
    
    // Reiniciar estados de autenticación
    setMfaRequired(false);
    setTempToken(null);
    setUser(null);
    setToken("");
    setRefresh("");
    
    // Limpiar headers de autorización
    delete axios.defaults.headers.common["Authorization"];
    
    // NO redireccionamos aquí - el componente maneja su propio estado
  };

  return (
    <UserContext.Provider
      value={{
        loginUser,
        loginUserTauser,
        verifyMfa,
        verifyMfaTauser,
        registerUser,
        user,
        token,
        refresh,
        mfaRequired,
        tempToken,
        logout,
        logoutTauser,
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
