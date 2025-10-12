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
import Modal from "../../../components/Modal";
import UserForm from "../components/UserForm";
import EditUserForm from "../components/EditUserForm";
import AssignedClients from "../components/AssignedClients"; 
import AssignedRoles from "../components/AssignedRoles";
import { KeyRound } from "lucide-react";
import Can from "../../../components/Can";
import { USUARIOS } from "../../../types/perms";

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);

  const [clientsModalOpen, setClientsModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rolesModalOpen, setRolesModalOpen] = useState<boolean>(false);
  const [editReadOnly, setEditReadOnly] = useState(true);
  const openCreateModal = (): void => setCreateModalOpen(true);
  const closeCreateModal = (): void => setCreateModalOpen(false);
  
  const openRolesModal = (user: User): void => {
    setSelectedUser(user);
    setRolesModalOpen(true);
  };
  const closeRolesModal = (): void => {
    setRolesModalOpen(false);
    setSelectedUser(null);
  };
  const openEditModal = (user: User): void => {
    setSelectedUser(user);
    setEditReadOnly(true);    
    setEditModalOpen(true);
  };
  const closeEditModal = (): void => {
    setEditModalOpen(false);
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
      const nuevoUsuario = await createUsuario(userData as any);
      
      if (userData.clientes && userData.clientes.length > 0) {
        await asignarClientesAUsuario(nuevoUsuario.id, userData.clientes);
      }
      
      toast.success("Usuario creado con éxito!");
      fetchUsuarios();
      closeCreateModal();
    } catch (err: any) {
      // Extraer mensajes de error específicos del backend
      const errorData = err.response?.data;
      
      if (errorData) {
        // Si es un objeto con campos específicos (ej: {username: ["error"], email: ["error"]})
        if (typeof errorData === 'object' && !Array.isArray(errorData)) {
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => {
              // Traducir nombres de campos al español
              const fieldTranslations: Record<string, string> = {
                username: 'Usuario',
                email: 'Correo electrónico',
                password: 'Contraseña',
                first_name: 'Nombre',
                last_name: 'Apellido',
                clientes: 'Clientes',
              };
              
              const fieldName = fieldTranslations[field] || field;
              const msg = Array.isArray(messages) ? messages[0] : messages;
              return `${fieldName}: ${msg}`;
            })
            .join('\n');
          
          toast.error(errorMessages);
        } else if (typeof errorData === 'string') {
          // Si es un string directo
          toast.error(errorData);
        } else {
          // Fallback genérico
          toast.error("Ha ocurrido un error al crear el usuario.");
        }
      } else {
        toast.error("Ha ocurrido un error al crear el usuario.");
      }
      
      console.error("Error completo:", err.response?.data);
      // NO cerrar el modal si hay error, para que el usuario pueda corregir
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
      
      toast.success("Usuario actualizado con éxito!");
      fetchUsuarios();
      closeEditModal();
    } catch (err: any) {
      // Extraer mensajes de error específicos del backend
      const errorData = err.response?.data;
      
      if (errorData) {
        if (typeof errorData === 'object' && !Array.isArray(errorData)) {
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => {
              const fieldTranslations: Record<string, string> = {
                username: 'Usuario',
                email: 'Correo electrónico',
                password: 'Contraseña',
                first_name: 'Nombre',
                last_name: 'Apellido',
              };
              
              const fieldName = fieldTranslations[field] || field;
              const msg = Array.isArray(messages) ? messages[0] : messages;
              return `${fieldName}: ${msg}`;
            })
            .join('\n');
          
          toast.error(errorMessages);
        } else if (typeof errorData === 'string') {
          toast.error(errorData);
        } else {
          toast.error("Ha ocurrido un error al actualizar el usuario.");
        }
      } else {
        toast.error("Ha ocurrido un error al actualizar el usuario.");
      }
      
      console.error("Error completo:", err.response?.data);
      // NO cerrar el modal si hay error
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

        <Can anyOf={[USUARIOS.ADD]}>
          <button
            onClick={openCreateModal}
            className="btn-primary flex items-center justify-center"
          >
            <UserPlus size={18} className="mr-2" />
            Crear Usuario
          </button>
        </Can>
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
                    <span className="text-sm text-gray-500">
                      {user.clientes?.length || 0} cliente(s)
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-1 text-gray-500 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <Can anyOf={[USUARIOS.DELETE]}>
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
                      </Can>
                      <button
                        onClick={() => openClientsModal(user)}
                        className="p-1 text-gray-500 hover:text-yellow-700 rounded-full hover:bg-gray-100"
                        title="Ver clientes asignados"
                      >
                        <BookUser size={16} />
                      </button>
                      <button
                        onClick={() => openRolesModal(user)}
                        className="p-1 text-gray-500 hover:text-purple-700 rounded-full hover:bg-gray-100"
                        title="Ver/Asignar roles"
                      >
                        <KeyRound size={16} />
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
          {selectedUser && (
            <EditUserForm
              onSubmit={handleEditUser}
              onCancel={closeEditModal}
              user={selectedUser}
              readOnly={editReadOnly}
              setReadOnly={setEditReadOnly}
            />
          )}
        </Modal>
        <Modal isOpen={clientsModalOpen} onClose={closeClientsModal}>
          {selectedUser && (
            <AssignedClients user={selectedUser} onClose={closeClientsModal} />
          )}
        </Modal>
        <Modal isOpen={rolesModalOpen} onClose={closeRolesModal}>
          {selectedUser && (
            <AssignedRoles user={selectedUser} onClose={closeRolesModal} />
          )}
        </Modal>
      </div>
    </div>
  );
};

export default UsuariosPage;
