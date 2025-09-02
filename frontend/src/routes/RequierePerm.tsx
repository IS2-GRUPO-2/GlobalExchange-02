import { useAuthZ } from "../context/AuthZContext";
import ForbiddenPage from "../pages/ForbiddenPage";

/**
 * Protege una ruta exigiendo uno o varios permisos (codenames Django).
 * Ejemplos de perm: "auth.view_group", "clientes.view_cliente", "usuario.view_user"
 */
export default function RequirePerm({
  allOf,
  anyOf,
  children,
}: {
  allOf?: string[];
  anyOf?: string[];
  children: JSX.Element;
}) {
  const { ready, all, any } = useAuthZ();

  if (!ready) return null;

  const passAll = allOf ? all(...allOf) : true;
  const passAny = anyOf ? any(...anyOf) : true;

  if (passAll && passAny) return children;

  return <ForbiddenPage />;
}