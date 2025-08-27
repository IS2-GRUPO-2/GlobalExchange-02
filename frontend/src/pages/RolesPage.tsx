import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogPanel, Transition } from "@headlessui/react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { RolesService, PermisosService } from "../services/rolesService";
import type { Role } from "../types/Role";
import type { Permission } from "../types/Permission";

type FormState = {
  id?: number;
  name: string;
  permissions: number[];
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [perms, setPerms] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Role | null>(null);

  // Modal
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ name: "", permissions: [] });

  // Filtro de permisos dentro del modal
  const [permQuery, setPermQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [r, p] = await Promise.all([
          RolesService.list(),
          PermisosService.list(),
        ]);
        setRoles(r);
        setPerms(p);
      } catch (e: any) {
        setError(e.message ?? "Error cargando datos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const permById = useMemo(() => {
    const m = new Map<number, Permission>();
    perms.forEach((p) => m.set(p.id, p));
    return m;
  }, [perms]);

  const filteredPerms = useMemo(() => {
    const q = permQuery.trim().toLowerCase();
    if (!q) return perms;
    return perms.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.codename.toLowerCase().includes(q) ||
        p.app_label.toLowerCase().includes(q)
    );
  }, [permQuery, perms]);

  function openCreate() {
    setForm({ name: "", permissions: [] });
    setPermQuery("");
    setOpen(true);
  }
  function openEdit(role: Role) {
    setForm({
      id: role.id,
      name: role.name,
      permissions: role.permissions.slice(),
    });
    setPermQuery("");
    setOpen(true);
  }
  function closeForm() {
    setOpen(false);
    setError(null);
  }

  function togglePerm(id: number) {
    setForm((prev) => {
      const has = prev.permissions.includes(id);
      return {
        ...prev,
        permissions: has
          ? prev.permissions.filter((x) => x !== id)
          : [...prev.permissions, id],
      };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      if (!form.name.trim()) throw new Error("El nombre es requerido");

      const payload = { name: form.name.trim(), permissions: form.permissions };
      let saved: Role;
      if (form.id) {
        saved = await RolesService.update(form.id, payload);
        setRoles((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      } else {
        saved = await RolesService.create(payload as Omit<Role, "id">);
        setRoles((prev) => [saved, ...prev]);
      }
      closeForm();
    } catch (e: any) {
      setError(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  }
  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await RolesService.remove(toDelete.id);
      setRoles((prev) => prev.filter((r) => r.id !== toDelete.id));
    } catch (e: any) {
      alert(e.message ?? "No se pudo eliminar");
    } finally {
      setToDelete(null); // Cerrar modal
    }
  }

  // Esta función no se usa, así que la comentamos o eliminamos
  // async function onDelete(id: number) {
  //   if (!confirm("¿Eliminar este rol?")) return;
  //   try {
  //     await RolesService.remove(id);
  //     setRoles((prev) => prev.filter((r) => r.id !== id));
  //   } catch (e: any) {
  //     alert(e.message ?? "No se pudo eliminar");
  //   }
  // }

  if (loading) {
    return (
      <div className="px-6 py-10">
        <div className="mx-auto max-w-6xl rounded-lg border border-white/10 bg-gray-800/40 p-8 text-gray-300">
          Cargando…
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Roles</h1>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            <PlusIcon className="size-4" />
            Crear rol
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-white/10 bg-gray-900/40">
          {roles.length === 0 ? (
            <div className="p-8 text-gray-400">No hay roles.</div>
          ) : (
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-gray-800/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-300">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-300">
                    # Permisos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-300">
                    Permisos (resumen)
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {roles.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-200">
                      {r.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-300">
                      {r.permissions.length}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {r.permissions
                        .slice(0, 6)
                        .map((pid) => permById.get(pid)?.codename)
                        .filter(Boolean)
                        .join(", ")}
                      {r.permissions.length > 6 ? "…" : ""}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(r)}
                        className="mr-2 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/20"
                      >
                        <PencilSquareIcon className="size-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => setToDelete(r)}
                        className="inline-flex items-center gap-1 rounded-md bg-red-500/20 px-2 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/30"
                      >
                        <TrashIcon className="size-4" />
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      <Transition show={open} appear>
        <Dialog onClose={closeForm} className="relative z-50">
          {/* Backdrop */}
          <Transition.Child
            enter="transition duration-150 ease-out"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition duration-100 ease-in"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          {/* Panel */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                enter="transition duration-150 ease-out"
                enterFrom="opacity-0 translate-y-2 scale-95"
                enterTo="opacity-100 translate-y-0 scale-100"
                leave="transition duration-100 ease-in"
                leaveFrom="opacity-100 translate-y-0 scale-100"
                leaveTo="opacity-0 translate-y-2 scale-95"
              >
                <DialogPanel className="w-full max-w-3xl rounded-xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
                  <div className="mb-4 flex items-center justify-between">
                    <Dialog.Title className="text-lg font-semibold text-white">
                      {form.id ? "Editar rol" : "Crear rol"}
                    </Dialog.Title>
                    <button
                      onClick={closeForm}
                      className="rounded-md p-1 text-gray-400 hover:text-white"
                    >
                      <XMarkIcon className="size-6" />
                    </button>
                  </div>

                  {error && (
                    <div className="mb-3 rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </div>
                  )}

                  <form onSubmit={onSubmit} className="space-y-5">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-300">
                        Nombre del rol
                      </label>
                      <input
                        value={form.name}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, name: e.target.value }))
                        }
                        placeholder="Ej: ADMIN, USER…"
                        className="block w-full rounded-md border border-white/10 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-0"
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-300">
                          Permisos
                        </label>
                        <input
                          type="text"
                          value={permQuery}
                          onChange={(e) => setPermQuery(e.target.value)}
                          placeholder="Buscar (nombre, codename o app)"
                          className="w-64 rounded-md border border-white/10 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="max-h-72 overflow-auto rounded-md border border-white/10 bg-gray-800/40 p-3">
                        {filteredPerms.length === 0 ? (
                          <div className="px-1 py-8 text-center text-sm text-gray-400">
                            Sin resultados
                          </div>
                        ) : (
                          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                            {filteredPerms.map((p) => {
                              const checked = form.permissions.includes(p.id);
                              return (
                                <li key={p.id}>
                                  <label className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-white/5">
                                    <input
                                      type="checkbox"
                                      className="mt-1 size-4 rounded border-white/20 bg-gray-900 text-indigo-500 focus:ring-indigo-500"
                                      checked={checked}
                                      onChange={() => togglePerm(p.id)}
                                    />
                                    <div>
                                      <div className="text-sm font-medium text-gray-200">
                                        {p.name}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        <span className="font-mono">
                                          {p.app_label}.{p.codename}
                                        </span>
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
                        onClick={closeForm}
                        className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/20"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? "Guardando…" : "Guardar"}
                      </button>
                    </div>
                  </form>
                </DialogPanel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      {/* ⬇️ Nuevo modal de confirmación de borrado */}
      <Transition show={!!toDelete} appear>
        <Dialog onClose={() => setToDelete(null)} className="relative z-50">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-md rounded-lg bg-gray-900 p-6 text-gray-200 shadow-xl">
              <Dialog.Title className="text-lg font-semibold text-white">
                Confirmar eliminación
              </Dialog.Title>
              <p className="mt-2 text-sm text-gray-400">
                ¿Seguro que deseas eliminar el rol{" "}
                <span className="font-semibold text-red-400">
                  {toDelete?.name}
                </span>
                ?
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setToDelete(null)}
                  className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/20"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400"
                >
                  Eliminar
                </button>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
