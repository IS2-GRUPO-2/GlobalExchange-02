import { useEffect, useState } from "react";
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  asignarClientesAUsuario,
} from "../services/usuarioService";
import { type User } from "../types/User";
import {
  Edit,
  UserX,
  UserCheck,
  UserPlus,
  Search,
  BookUser,
} from "lucide-react";
import type { UserFormData } from "../components/UserForm";
import type { EditUserFormData } from "../components/EditUserForm";
import { toast } from "react-toastify";
import Modal from "../components/Modal";
import UserForm from "../components/UserForm";
import EditUserForm from "../components/EditUserForm";
import AssignedClients from "../components/AssignedClients"; 

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [clientsModalOpen, setClientsModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const openCreateModal = (): void => setCreateModalOpen(true);
  const closeCreateModal = (): void => setCreateModalOpen(false);

  const openEditModal = (user: User): void => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };
  const closeEditModal = (): void => {
    setEditModalOpen(false);
    setSelectedUser(null);
  };

  const openDetailModal = (user: User): void => {
    setSelectedUser(user);
    setDetailModalOpen(true);
  };
  const closeDetailModal = (): void => {
    setDetailModalOpen(false);
    setSelectedUser(null);
  };

  const openClientsModal = (user: User): void => {
    setSelectedUser(user);
    setClientsModalOpen(true);
  };
  const closeClientsModal = (): void => {
    setClientsModalOpen(false);
    setSelectedUser(null);
  };

  const fetchUsuarios = async () => {
    try {
      const res = await getUsuarios();
      // Filtrar usuarios por búsqueda
      let filteredUsers = res.data;
      if (searchQuery.trim()) {
        filteredUsers = res.data.filter((user: User) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      setUsuarios(filteredUsers);
    } catch (error) {
      toast.error("Error al cargar usuarios");
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [searchQuery]);

  const handleCreateUser = async (userData: UserFormData) => {
    try {
      const nuevoUsuario = await createUsuario(userData);
      
      if (userData.clientes.length > 0) {
        await asignarClientesAUsuario(nuevoUsuario.id, userData.clientes);
      }
      
      toast.success("Usuario creado con éxito!");
      fetchUsuarios();
    } catch (err) {
      toast.error("Ha ocurrido un error al crear el usuario.");
    } finally {
      closeCreateModal();
    }
  };

  const handleEditUser = async (userData: EditUserFormData) => {
    try {
      const userDataToUpdate = { ...userData };
      // Si no se proporciona password, eliminarlo del objeto
      if (!userData.password) {
        delete userDataToUpdate.password;
      }
      
      await updateUsuario(String(userData.id), userDataToUpdate);
      
      if (userData.clientes.length > 0) {
        await asignarClientesAUsuario(userData.id, userData.clientes);
      }
      
      toast.success("Usuario actualizado con éxito!");
      fetchUsuarios();
    } catch (err) {
      toast.error("Ha ocurrido un error al actualizar el usuario.");
    } finally {
      closeEditModal();
    }
  };

  const handleDeactivateUser = async (id: number) => {
    try {
      await deleteUsuario(String(id));
      toast.success("Usuario eliminado con éxito");
      fetchUsuarios();
    } catch (e) {
      toast.error("Ha ocurrido un error");
    }
  };

  const handleActivateUser = async (user: User) => {
    try {
      const userData = { ...user, is_active: true };
      await updateUsuario(String(user.id), userData);
      toast.success("Usuario activado con éxito");
      fetchUsuarios();
    } catch (e) {
      toast.error("Ha ocurrido un error");
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
            placeholder="Buscar usuarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center justify-center"
        >
          <UserPlus size={18} className="mr-2" />
          Agregar Usuario
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Estado</th>
                <th>Staff</th>
                <th>Clientes</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usuarios.map((user: User) => (
                <tr key={user.id}>
                  <td className="font-medium">{user.username}</td>
                  <td>{user.first_name} {user.last_name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-900"
                      }`}
                    >
                      {user.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_staff
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.is_staff ? "Sí" : "No"}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-gray-500">
                      {user.clientes?.length || 0} cliente(s)
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={
                          user.is_active
                            ? () => handleDeactivateUser(user.id)
                            : () => handleActivateUser(user)
                        }
                        className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                        title={user.is_active ? "Desactivar" : "Activar"}
                      >
                        {user.is_active ? (
                          <UserX size={16} />
                        ) : (
                          <UserCheck size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => openDetailModal(user)}
                        className="p-1 text-gray-500 hover:text-green-600 rounded-full hover:bg-gray-100"
                        title="Ver detalles"
                      >
                        <Search size={16} />
                      </button>
                      <button
                        onClick={() => openClientsModal(user)}
                        className="p-1 text-gray-500 hover:text-yellow-700 rounded-full hover:bg-gray-100"
                        title="Ver clientes asignados"
                      >
                        <BookUser size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Modal isOpen={createModalOpen} onClose={closeCreateModal}>
          <UserForm
            onSubmit={handleCreateUser}
            onCancel={closeCreateModal}
          />
        </Modal>
        <Modal isOpen={editModalOpen} onClose={closeEditModal}>
          <EditUserForm
            onSubmit={handleEditUser}
            onCancel={closeEditModal}
            user={selectedUser!}
            readOnly={false}
          />
        </Modal>
        <Modal isOpen={detailModalOpen} onClose={closeDetailModal}>
          <EditUserForm
            onSubmit={handleEditUser}
            onCancel={closeDetailModal}
            user={selectedUser!}
            readOnly={true}
          />
        </Modal>
        <Modal isOpen={clientsModalOpen} onClose={closeClientsModal}>
          <AssignedClients user={selectedUser!} />
        </Modal>
      </div>
    </div>
  );
};

export default UsuariosPage;
