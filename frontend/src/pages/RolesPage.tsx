import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Edit, UserPlus, Search, Trash2, Eye } from "lucide-react";
import type { Role } from "../types/Role";
import type { Permission } from "../types/Permission";
import {
  getRoles,
  getPermissions,
  createRole,
  updateRole,
  deleteRole,
} from "../services/rolesService";
import Modal from "../components/Modal";
import RoleForm, { type RoleFormData } from "../components/RoleForm";
import Can from "../components/Can";
import { ROLES } from "../types/perms";

const RolesPage = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [perms, setPerms] = useState<Permission[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => setCreateModalOpen(false);

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedRole(null);
  };

  const openDetailModal = (role: Role) => {
    setSelectedRole(role);
    setDetailModalOpen(true);
  };
  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedRole(null);
  };

  const fetchData = async () => {
    try {
      const [rRes, pRes] = await Promise.all([getRoles(searchQuery), getPermissions()]);
      setRoles(rRes.data);
      setPerms(pRes.data);
    } catch {
      toast.error("Error cargando roles o permisos");
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  const permById = useMemo(() => {
    const m = new Map<number, Permission>();
    perms.forEach((p) => m.set(p.id, p));
    return m;
  }, [perms]);

  const handleCreateRole = async (data: RoleFormData) => {
    try {
      const res = await createRole({ name: data.name, permissions: data.permissions } as Omit<Role, "id">);
      if (res.status === 201 || res.status === 200) {
        toast.success("Rol creado con éxito!");
        fetchData();
      }
    } catch {
      toast.error("Ha ocurrido un error al crear el rol.");
    } finally {
      closeCreateModal();
    }
  };

  const handleEditRole = async (data: RoleFormData) => {
    if (!selectedRole) return;
    try {
      const res = await updateRole(selectedRole.id, {
        name: data.name,
        permissions: data.permissions,
      });
      if (res.status === 200) {
        toast.success("Rol actualizado con éxito!");
        fetchData();
      }
    } catch {
      toast.error("Ha ocurrido un error al actualizar el rol.");
    } finally {
      closeEditModal();
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!confirm(`¿Eliminar el rol "${role.name}"?`)) return;
    try {
      const res = await deleteRole(role.id);
      if ((res.status ?? 200) === 200 || res.status === 204) {
        toast.success("Rol eliminado con éxito");
        fetchData();
      }
    } catch {
      toast.error("No se pudo eliminar el rol");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex-1 overflow-y-auto p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-64 md:w-96 pl-4">
          <div className="absolute inset-y-0 left-0 p-8 pt-5 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
          />
        </div>

        <Can anyOf={[ROLES.ADD]}>
          <button onClick={openCreateModal} className="btn-primary flex items-center justify-center">
            <UserPlus size={18} className="mr-2" />
            Crear Rol
          </button>
        </Can>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th># Permisos</th>
                <th>Permisos (resumen)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {roles.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.name}</td>
                  <td>{r.permissions.length}</td>
                  <td className="text-gray-600">
                    {r.permissions
                      .slice(0, 6)
                      .map((pid) => permById.get(pid)?.name_es)
                      .filter(Boolean)
                      .join(", ")}
                    {r.permissions.length > 6 ? "…" : ""}
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openDetailModal(r)}
                        className="p-1 text-gray-500 hover:text-green-600 rounded-full hover:bg-gray-100"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                      <Can anyOf={[ROLES.CHANGE]}>
                        <button
                          onClick={() => openEditModal(r)}
                          className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                      </Can>
                      <Can anyOf={[ROLES.DELETE]}>
                        <button
                          onClick={() => handleDeleteRole(r)}
                          className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </Can>
                    </div>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-8">
                    No hay roles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Crear */}
        <Modal isOpen={createModalOpen} onClose={closeCreateModal}>
          <RoleForm
            onSubmit={handleCreateRole}
            onCancel={closeCreateModal}
            permissions={perms}
            initial={null}
            readOnly={false}
          />
        </Modal>

        {/* Editar */}
        <Modal isOpen={editModalOpen} onClose={closeEditModal}>
          <RoleForm
            onSubmit={handleEditRole}
            onCancel={closeEditModal}
            permissions={perms}
            initial={selectedRole}
            readOnly={false}
          />
        </Modal>

        {/* Detalle */}
        <Modal isOpen={detailModalOpen} onClose={closeDetailModal}>
          <RoleForm
            onSubmit={async () => {}}
            onCancel={closeDetailModal}
            permissions={perms.filter((p) => selectedRole?.permissions.includes(p.id))}
            initial={selectedRole}
            readOnly={true}
          />
        </Modal>
      </div>
    </div>
  );
};

export default RolesPage;