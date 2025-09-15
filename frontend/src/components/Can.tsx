/**
 * @fileoverview Componente para renderizado condicional basado en permisos
 */

import { ReactNode } from "react";
import { useAuthZ } from "../context/AuthZContext";

/**
 * @typedef {Object} Props
 * @property {string[]} [anyOf] - Lista de permisos, el usuario debe tener al menos uno
 * @property {string[]} [allOf] - Lista de permisos, el usuario debe tener todos
 * @property {ReactNode} [fallback] - Componente a renderizar si no tiene permisos
 * @property {ReactNode} children - Componente a renderizar si tiene permisos
 */
type Props = {
  anyOf?: string[];
  allOf?: string[];
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * Componente para renderizado condicional basado en permisos
 * @component Can
 * @param {Props} props - Propiedades del componente
 * @param {string[]} [props.anyOf] - Lista de permisos (cualquiera)
 * @param {string[]} [props.allOf] - Lista de permisos (todos requeridos)
 * @param {ReactNode} [props.fallback=null] - Componente alternativo si no tiene permisos
 * @param {ReactNode} props.children - Componente a renderizar si tiene permisos
 * @returns {JSX.Element|null} Componente renderizado según permisos o null
 * 
 * @description
 * - Verifica permisos del usuario antes de renderizar children
 * - Soporta verificación de "cualquiera" (anyOf) o "todos" (allOf) los permisos
 * - Retorna fallback si no tiene permisos, null por defecto
 * - Espera a que los permisos estén cargados (ready) antes de evaluar
 * 
 * @example
 * // Requiere al menos uno de estos permisos
 * <Can anyOf={['USUARIOS.VIEW', 'USUARIOS.EDIT']}>
 *   <UsuariosComponent />
 * </Can>
 * 
 * @example
 * // Requiere todos estos permisos
 * <Can allOf={['USUARIOS.VIEW', 'USUARIOS.DELETE']}>
 *   <DeleteButton />
 * </Can>
 * 
 * @example
 * // Con componente fallback
 * <Can anyOf={['ADMIN.ACCESS']} fallback={<div>Sin permisos</div>}>
 *   <AdminPanel />
 * </Can>
 */
export default function Can({ anyOf, allOf, fallback = null, children }: Props) {
  const { ready, any, all } = useAuthZ();
  if (!ready) return null;

  const okAny = anyOf && anyOf.length > 0 ? any(...anyOf) : true;
  const okAll = allOf && allOf.length > 0 ? all(...allOf) : true;

  return okAny && okAll ? <>{children}</> : <>{fallback}</>;
}
