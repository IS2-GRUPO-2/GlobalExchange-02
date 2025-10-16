import { useEffect, useMemo, useState } from "react";
import type { Permission } from "../../../types/Permission";
import type { Role } from "../types/Role";
import { Search } from "lucide-react";

export type RoleFormData = {
  name: string;
  permissions: number[];
};

type Props = {
  onSubmit: (data: RoleFormData) => Promise<void> | void;
  onCancel: () => void;
  permissions: Permission[];
  initial?: Role | null;     // si viene -> modo editar/detalle
  readOnly?: boolean;        // detalle
};

const RoleForm = ({ onSubmit, onCancel, permissions, initial, readOnly }: Props) => {
  const [name, setName] = useState<string>(initial?.name ?? "");
  const [permIds, setPermIds] = useState<number[]>(initial?.permissions ?? []);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setName(initial?.name ?? "");
    setPermIds(initial?.permissions ?? []);
  }, [initial]);

  const filteredPerms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.codename.toLowerCase().includes(q) ||
        p.app_label.toLowerCase().includes(q) ||
        p.name_es.toLowerCase().includes(q)
    );
  }, [permissions, query]);

  const toggle = (id: number) => {
    if (readOnly) return;
    setPermIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return onCancel();
    await onSubmit({ name: name.trim(), permissions: permIds });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nombre del rol</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Administrador"
          disabled={readOnly}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-gray-700 focus:border-transparent disabled:bg-gray-100"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Permisos</label>
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar"
              className="pl-9 w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-gray-700 focus:border-transparent"
              disabled={readOnly && permissions.length === 0}
            />
          </div>
        </div>

        <div className="max-h-72 overflow-auto rounded-md border border-gray-200 p-3 bg-white">
          {filteredPerms.length === 0 ? (
            <div className="px-1 py-8 text-center text-sm text-gray-500">
              Sin resultados
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {filteredPerms.map((p) => {
                const checked = permIds.includes(p.id);
                return (
                  <li key={p.id}>
                    <label className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-1 size-4 rounded border-gray-300"
                        checked={checked}
                        onChange={() => toggle(p.id)}
                        disabled={readOnly}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-800">{p.name_es}</div>
                        <div className="text-xs text-gray-500 font-mono">
                          {p.app_label}
                        </div>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          {readOnly ? "Cerrar" : "Cancelar"}
        </button>
        {!readOnly && (
          <button
            type="submit"
            className="btn-primary px-4 py-2 text-sm"
          >
            Guardar
          </button>
        )}
      </div>
    </form>
  );
};

export default RoleForm;