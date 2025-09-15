/**
 * @fileoverview Componente de protección de rutas con autenticación y autorización
 */

import { Navigate, useLocation } from "react-router-dom";
import ForbiddenPage from "../pages/ForbiddenPage";
import { useAuth } from "../context/useAuth";
import { useAuthZ } from "../context/AuthZContext";

/**
 * @typedef {Object} RequireAuthProps
 * @property {string[]} [allOf] - Lista de permisos requeridos (todos deben estar presentes)
 * @property {string[]} [anyOf] - Lista de permisos requeridos (al menos uno debe estar presente)
 * @property {JSX.Element} children - Componente a proteger
 */

/**
 * Componente de protección de rutas
 * @component RequireAuth
 * @param {RequireAuthProps} props - Propiedades del componente
 * @param {string[]} [props.allOf] - Permisos requeridos (todos)
 * @param {string[]} [props.anyOf] - Permisos requeridos (cualquiera)
 * @param {JSX.Element} props.children - Componente a proteger
 * @returns {JSX.Element|null} Componente protegido, redirección o página de error
 * 
 * @description
 * - Verifica autenticación del usuario antes de permitir acceso
 * - Valida permisos específicos si se proporcionan
 * - Redirecciona a login si no está autenticado
 * - Muestra página 403 si no tiene permisos suficientes
 * - Maneja estados de carga tanto de autenticación como autorización
 * 
 * @workflow
 * 1. Verifica si está cargando la autenticación
 * 2. Verifica si el usuario está logueado
 * 3. Si no requiere permisos específicos, permite acceso
 * 4. Verifica si están cargados los permisos
 * 5. Valida permisos requeridos (allOf y anyOf)
 * 
 * @example
 * // Proteger ruta solo con autenticación
 * <RequireAuth>
 *   <Dashboard />
 * </RequireAuth>
 * 
 * @example
 * // Proteger con permisos específicos (cualquiera)
 * <RequireAuth anyOf={['USUARIOS.VIEW', 'USUARIOS.EDIT']}>
 *   <UsuariosPage />
 * </RequireAuth>
 * 
 * @example
 * // Proteger con múltiples permisos (todos requeridos)
 * <RequireAuth allOf={['USUARIOS.VIEW', 'USUARIOS.DELETE']}>
 *   <DeleteUserButton />
 * </RequireAuth>
 */
export default function RequireAuth({
  allOf,
  anyOf,
  children,
}: {
  allOf?: string[];
  anyOf?: string[];
  children: React.ReactElement;
}) {
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const { ready, all, any } = useAuthZ();

  // 1) Cargando identidad
  // if (authLoading) return null;

  // 2) No logueado => 401/login
  if (!isLoggedIn()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3) Si NO pediste permisos, basta con login
  const wantsPerms = (allOf && allOf.length > 0) || (anyOf && anyOf.length > 0);
  if (!wantsPerms) return children;

  // 4) Cargando permisos
  if (!ready) return null;

  // 5) Autorización
  const passAll = allOf ? all(...allOf) : true;
  const passAny = anyOf ? any(...anyOf) : true;

  return passAll && passAny ? children : <ForbiddenPage />;
}
