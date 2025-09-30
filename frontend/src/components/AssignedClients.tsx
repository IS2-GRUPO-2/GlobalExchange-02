import { useEffect, useMemo, useState } from "react";
import type { User } from "../features/usuario/types/User";
import type { Cliente } from "../features/clientes/types/Cliente";
import { getAllClientes } from "../services/clienteService";
import {
  getUserClients,
  asignarClientesAUsuario,
} from "../features/usuario/services/usuarioService";
import { toast } from "react-toastify";
import { Search } from "lucide-react";
import { USUARIOS } from "../types/perms";
import Can from "./Can";

type Props = {
  user: User;
  onClose: () => void;
};

export default function AssignedClients({ user, onClose }: Props) {
  const [allClients, setAllClients] = useState<Cliente[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [originalSelected, setOriginalSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [readOnly, setReadOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const [allRes, assignedRes] = await Promise.all([
        getAllClientes(),
        getUserClients(user.id),
      ]);

      const allSorted = allRes.data
        .slice()
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

      const assignedIds = assignedRes.data.map((c) => c.idCliente);

      setAllClients(allSorted);
      setSelectedIds(assignedIds);
      setOriginalSelected(assignedIds);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const hasChanges = useMemo(() => {
    if (originalSelected.length !== selectedIds.length) return true;
    const a = [...originalSelected].sort();
    const b = [...selectedIds].sort();
    return a.some((val, idx) => val !== b[idx]);
  }, [originalSelected, selectedIds]);

  const onSave = async () => {
    try {
      setSaving(true);
      await asignarClientesAUsuario(user.id, selectedIds);
      toast.success("Clientes asignados actualizados");
      setOriginalSelected(selectedIds);
      setReadOnly(true);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo actualizar clientes");
    } finally {
      setSaving(false);
    }
  };

  // Filtro (solo edición)
  const q = search.trim().toLowerCase();
  const filteredAll = useMemo(() => {
    if (readOnly) {
      return allClients.filter((c) => selectedIds.includes(c.idCliente));
    }
    if (!q) return allClients;
    return allClients.filter((c) => {
      const doc = c.isPersonaFisica ? c.cedula ?? "" : c.ruc ?? "";
      return (
        c.nombre.toLowerCase().includes(q) ||
        c.categoria?.nombre?.toLowerCase().includes(q) || // ✅ corregido
        doc.toLowerCase().includes(q)
      );
    });
  }, [allClients, selectedIds, readOnly, q]);

  const renderDoc = (c: Cliente) =>
    (c.isPersonaFisica ? c.cedula : c.ruc) ?? "-";
  const renderTipo = (c: Cliente) =>
    c.isPersonaFisica ? "Persona física" : "Persona jurídica";

  const emptyColSpan = readOnly ? 5 : 6;

  return (
    // ⬇️ clave: que NO exceda el ancho del panel del modal
    <div className="w-full max-w-full">
      {/* Header */}
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Asignar Clientes
        </h2>
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
              placeholder="Buscar clientes (nombre, categoría, documento)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Tabla dentro del modal, scroll vertical, sin desbordar */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <div className="p-6 text-gray-500">Cargando…</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {!readOnly && (
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-16">
                      Sel.
                    </th>
                  )}
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Nombre
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-40">
                    Categoría
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-40">
                    Tipo
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-40">
                    Documento
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-32">
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredAll.length === 0 ? (
                  <tr>
                    <td
                      colSpan={emptyColSpan}
                      className="px-3 py-8 text-center text-sm text-gray-400"
                    >
                      {readOnly ? "Sin clientes asignados." : "Sin resultados."}
                    </td>
                  </tr>
                ) : (
                  filteredAll.map((c) => {
                    const checked = selectedIds.includes(c.idCliente);
                    return (
                      <tr
                        key={c.idCliente}
                        className={
                          readOnly ? "" : "hover:bg-gray-50 cursor-pointer"
                        }
                        onClick={
                          readOnly ? undefined : () => toggle(c.idCliente)
                        }
                      >
                        {!readOnly && (
                          <td className="px-3 py-2 align-top">
                            <input
                              type="checkbox"
                              className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={checked}
                              onChange={() => toggle(c.idCliente)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                        )}
                        <td className="px-3 py-2 text-sm text-gray-900 font-medium break-words">
                          {c.nombre}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 break-words">
                          {c.categoria?.nombre}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 break-words">
                          {renderTipo(c)}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700 break-words">
                          {renderDoc(c)}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              c.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-900"
                            }`}
                          >
                            {c.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
        >
          Cerrar
        </button>

        {readOnly ? (
          <Can anyOf={[USUARIOS.ASSIGN_CLIENTS]}>
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
