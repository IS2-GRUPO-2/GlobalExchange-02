/**
 * @fileoverview Componente para renderizado condicional basado en permisos
 */

import type { ReactNode } from "react";
import { useAuthZ } from "../context/AuthZContext";

type Props = {
  anyOf?: string[];
  allOf?: string[];
  fallback?: ReactNode;
  children: ReactNode;
};

export default function Can({ anyOf, allOf, fallback = null, children }: Props) {
  const { ready, any, all } = useAuthZ();
  if (!ready) return null;

  const okAny = anyOf && anyOf.length > 0 ? any(...anyOf) : true;
  const okAll = allOf && allOf.length > 0 ? all(...allOf) : true;

  return okAny && okAll ? <>{children}</> : <>{fallback}</>;
}
