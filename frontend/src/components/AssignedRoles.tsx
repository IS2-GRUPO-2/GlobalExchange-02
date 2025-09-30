import { useEffect, useMemo, useState } from "react";
import type { User } from "../features/usuario/types/User";
import type { Role } from "../types/Role";
import { getRoles } from "../services/rolesService";
import { getUserRoles, assignUserRoles } from "../features/usuario/services/usuarioService";
import { toast } from "react-toastify";
import { Search } from "lucide-react";
import Can from "./Can";
import { USUARIOS } from "../types/perms";

type Props = {
  user: User;
  onClose: () => void;
};

export default function AssignedRoles({ user, onClose }: Props) {
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [originalSelected, setOriginalSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [readOnly, setReadOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const [rolesRes, userRolesRes] = await Promise.all([
        getRoles(),
        getUserRoles(user.id),
      ]);

      const rolesSorted = rolesRes.data
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));
      const assignedIds = userRolesRes.data.map((r) => r.id);

      setAllRoles(rolesSorted);
      setSelectedIds(assignedIds);
      setOriginalSelected(assignedIds);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const toggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const hasChanges = useMemo(() => {
    if (originalSelected.length !== selectedIds.length) return true;
    const a = [...originalSelected].sort((x, y) => x - y);
    const b = [...selectedIds].sort((x, y) => x - y);
    return a.some((val, idx) => val !== b[idx]);
  }, [originalSelected, selectedIds]);

  const onSave = async () => {
    try {
      setSaving(true);
      await assignUserRoles(user.id, selectedIds);
      toast.success("Roles actualizados");
      setOriginalSelected(selectedIds);
      setReadOnly(true);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo actualizar los roles");
    } finally {
      setSaving(false);
    }
  };

  const q = search.trim().toLowerCase();

  const selected = useMemo(
    () =>
      allRoles
        .filter((r) => selectedIds.includes(r.id))
        .filter((r) => !q || r.name.toLowerCase().includes(q)),
    [allRoles, selectedIds, q]
  );

  const unselected = useMemo(
    () =>
      allRoles
        .filter((r) => !selectedIds.includes(r.id))
        .filter((r) => !q || r.name.toLowerCase().includes(q)),
    [allRoles, selectedIds, q]
  );

  return (
    <div className="w-[90vw] max-w-3xl">
      {/* Header */}
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Roles</h2>
      </div>

      {/* Username */}
      <div className="mb-4">
        <div className="text-sm text-gray-500">Usuario</div>
        <div className="text-base font-medium text-gray-900">
          {user.username}
        </div>
      </div>

      {/* Search (solo edición) */}
      {!readOnly && (
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Body */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <div className="p-6 text-gray-500">Cargando…</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : readOnly ? (
          <div className="p-4">
            {selected.length === 0 ? (
              <div className="text-sm text-gray-500">Sin roles asignados.</div>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {selected.map((r) => (
                  <li
                    key={r.id}
                    className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200"
                  >
                    {r.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            {/* Columna: Asignados */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">
                  Asignados ({selected.length})
                </h3>
              </div>
              <ul className="max-h-72 overflow-auto rounded-md border border-gray-200 bg-gray-50">
                {selected.length === 0 ? (
                  <li className="px-3 py-8 text-center text-sm text-gray-400">
                    Ninguno
                  </li>
                ) : (
                  selected.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => toggle(r.id)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-white"
                        title="Quitar de asignados"
                      >
                        <span className="text-gray-800">{r.name}</span>
                        <span className="text-xs text-red-600">Quitar</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Columna: Disponibles */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">
                  Disponibles ({unselected.length})
                </h3>
              </div>
              <ul className="max-h-72 overflow-auto rounded-md border border-gray-200 bg-gray-50">
                {unselected.length === 0 ? (
                  <li className="px-3 py-8 text-center text-sm text-gray-400">
                    Sin resultados
                  </li>
                ) : (
                  unselected.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => toggle(r.id)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-white"
                        title="Agregar a asignados"
                      >
                        <span className="text-gray-800">{r.name}</span>
                        <span className="text-xs text-green-700">Agregar</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer (alineado a la derecha) */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
        >
          Cerrar
        </button>

        {readOnly ? (
          <Can anyOf={[USUARIOS.ASSIGN_ROLES]}>
            <button
              type="button"
              onClick={() => setReadOnly(false)}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Editar
            </button>
          </Can>
        ) : (
          <button
            type="button"
            disabled={!hasChanges || saving}
            onClick={onSave}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        )}
      </div>
    </div>
  );
}
