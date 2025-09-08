import { Navigate, useLocation } from "react-router-dom";
import ForbiddenPage from "../pages/ForbiddenPage";
import { useAuth } from "../context/useAuth";
import { useAuthZ } from "../context/AuthZContext";

export default function RequireAuth({
  allOf,
  anyOf,
  children,
}: {
  allOf?: string[];
  anyOf?: string[];
  children: JSX.Element;
}) {
  const location = useLocation();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { ready, all, any } = useAuthZ();

  // 1) Cargando identidad
  if (authLoading) return null;

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
