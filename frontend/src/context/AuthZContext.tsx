/**
 * @fileoverview Contexto de autorización para manejo de permisos de usuario
 */

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMyPerms } from "../services/authzService";

/**
 * @typedef {Object} AuthZ
 * @property {boolean} ready - Indica si los permisos han sido cargados
 * @property {Set<string>} perms - Conjunto de permisos del usuario actual
 * @property {Function} has - Verifica si el usuario tiene un permiso específico
 * @property {Function} any - Verifica si el usuario tiene cualquiera de los permisos dados
 * @property {Function} all - Verifica si el usuario tiene todos los permisos dados
 */
type AuthZ = {
  ready: boolean;
  perms: Set<string>;
  has: (p: string) => boolean;
  any: (...ps: string[]) => boolean;
  all: (...ps: string[]) => boolean;
};

const Ctx = createContext<AuthZ | null>(null);

/**
 * Proveedor de contexto de autorización
 * @component AuthZProvider
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijos
 * @returns {JSX.Element} Proveedor de contexto de autorización
 * 
 * @description
 * - Carga y gestiona los permisos del usuario autenticado
 * - Proporciona métodos para verificar permisos específicos
 * - Optimiza las verificaciones usando Set para O(1) lookup
 * - Maneja estados de carga y error
 * 
 * @example
 * <AuthZProvider>
 *   <App />
 * </AuthZProvider>
 */
export const AuthZProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [perms, setPerms] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const r = await getMyPerms();
        setPerms(new Set(r.data.perms));
      } catch {
        setPerms(new Set());
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const value = useMemo<AuthZ>(() => ({
    ready,
    perms,
    /**
     * Verifica si el usuario tiene un permiso específico
     * @function has
     * @param {string} p - Permiso a verificar
     * @returns {boolean} true si el usuario tiene el permiso
     */
    has: (p) => perms.has(p),
    /**
     * Verifica si el usuario tiene cualquiera de los permisos dados
     * @function any
     * @param {...string} ps - Lista de permisos a verificar
     * @returns {boolean} true si el usuario tiene al menos uno de los permisos
     */
    any: (...ps) => ps.some((p) => perms.has(p)),
    /**
     * Verifica si el usuario tiene todos los permisos dados
     * @function all
     * @param {...string} ps - Lista de permisos a verificar
     * @returns {boolean} true si el usuario tiene todos los permisos
     */
    all: (...ps) => ps.every((p) => perms.has(p)),
  }), [ready, perms]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

/**
 * Hook para acceder al contexto de autorización
 * @function useAuthZ
 * @returns {AuthZ} Objeto con métodos de verificación de permisos
 * @throws {Error} Error si se usa fuera del AuthZProvider
 * 
 * @description
 * - Proporciona acceso a todas las funciones de autorización
 * - Incluye ready, perms, has, any, all
 * - Debe usarse dentro de un componente envuelto por AuthZProvider
 * 
 * @example
 * const { ready, has, any, all } = useAuthZ();
 * 
 * if (!ready) return <Loading />;
 * 
 * if (has('USUARIOS.VIEW')) {
 *   return <UsuariosPage />;
 * }
 */
export const useAuthZ = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuthZ must be used within <AuthZProvider>");
  return ctx;
};