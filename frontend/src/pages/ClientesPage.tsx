import { useEffect, useState } from "react";
import type { Cliente } from "../types/Cliente";
import {
  createCliente,
  deleteCliente,
  getClientes,
  updateCliente,
} from "../services/clienteService";
import {
  Edit,
  UserX,
  UserCheck,
  UserPlus,
  Search,
  BookUser,
} from "lucide-react";
import type { ClientFormData } from "../components/ClientForm";
import type { EditClientFormData } from "../components/EditClientForm";
import { toast } from "react-toastify";
import Modal from "../components/Modal";
import ClientForm from "../components/ClientForm";
import EditClientForm from "../components/EditClientForm";
import AssignedUsers from "../components/AssignedUsers";

const ClientesPage = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [usersModalOpen, setUsersModalOpen] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);

  const openCreateModal = (): void => setCreateModalOpen(true);
  const closeCreateModal = (): void => setCreateModalOpen(false);

  const openEditModal = (client: Cliente): void => {
    setSelectedClient(client);
    setEditModalOpen(true);
  };
  const closeEditModal = (): void => {
    setEditModalOpen(false);
    setSelectedClient(null);
  };

  const openDetailModal = (client: Cliente): void => {
    setSelectedClient(client);
    setDetailModalOpen(true);
  };
  const closeDetailModal = (): void => {
    setDetailModalOpen(false);
    setSelectedClient(null);
  };

  const openUsersModal = (client: Cliente): void => {
    setSelectedClient(client);
    setUsersModalOpen(true);
  };
  const closeUsersModal = (): void => {
    setUsersModalOpen(false);
    setSelectedClient(null);
  };

  const fetchClientes = async () => {
    const res = await getClientes(searchQuery);
    setClientes(res.data);
  };

  useEffect(() => {
    fetchClientes();
  }, [searchQuery]);

  const handleCreateClient = async (clientData: ClientFormData) => {
    let clienteData: Partial<Cliente> = {
      nombre: clientData.nombre,
      isPersonaFisica: clientData.isPersonaFisica,
      categoria: clientData.categoria,
      correo: clientData.correo,
      telefono: clientData.telefono,
      direccion: clientData.direccion,
      isActive: true,
    };

    clientData.isPersonaFisica
      ? (clienteData.cedula = clientData.documento)
      : (clienteData.ruc = clientData.documento);

    try {
      const res = await createCliente(clienteData);
      if (res.status === 201) {
        toast.success("Cliente creado con éxito!");
        fetchClientes();
      }
    } catch (err) {
      toast.error("Ha ocurrido un error al crear al cliente.");
    } finally {
      closeCreateModal();
    }
  };

  const handleEditClient = async (clientData: EditClientFormData) => {
    let clienteData: Partial<Cliente> = {
      idCliente: clientData.id,
      nombre: clientData.nombre,
      isPersonaFisica: clientData.isPersonaFisica,
      categoria: clientData.categoria,
      correo: clientData.correo,
      telefono: clientData.telefono,
      direccion: clientData.direccion,
      isActive: true,
    };

    if (clientData.isPersonaFisica) {
      clienteData.cedula = clientData.documento;
      clienteData.ruc = "";
    } else {
      clienteData.ruc = clientData.documento;
      clienteData.cedula = "";
    }

    try {
      const res = await updateCliente(clientData.id, clienteData);
      if (res.status === 200) {
        toast.success("Cliente actualizado con éxito!");
        fetchClientes();
      }
    } catch (err) {
      toast.error("Ha ocurrido un error al actualizar al cliente.");
    } finally {
      closeEditModal();
    }
  };

  const handleDeactivateClient = async (id: string) => {
    try {
      const res = await deleteCliente(id);
      if (res.status === 200) toast.success("Cliente desactivado con éxito");
      fetchClientes();
    } catch (e) {
      toast.error("Ha ocurrido un error");
    }
  };

  const handleActivateClient = async (cliente: Cliente) => {
    cliente.isActive = true;
    try {
      const res = await updateCliente(cliente.idCliente, cliente);
      if (res.status === 200) {
        toast.success("Cliente activado con éxito");
        fetchClientes();
      }
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
            placeholder="Buscar clientes..."
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
          Agregar Cliente
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Tipo</th>
                <th>Documento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clientes.map((cliente: Cliente) => (
                <tr key={cliente.idCliente}>
                  <td className="font-medium">{cliente.nombre}</td>
                  <td>{cliente.categoria}</td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cliente.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-900"
                      }`}
                    >
                      {cliente.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    {cliente.isPersonaFisica
                      ? "Persona física"
                      : "Persona jurídica"}
                  </td>
                  <td>
                    {cliente.isPersonaFisica ? cliente.cedula : cliente.ruc}
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(cliente)}
                        className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={
                          cliente.isActive
                            ? () => handleDeactivateClient(cliente.idCliente)
                            : () => handleActivateClient(cliente)
                        }
                        className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                        title={cliente.isActive ? "Desactivar" : "Activar"}
                      >
                        {cliente.isActive ? (
                          <UserX size={16} />
                        ) : (
                          <UserCheck size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => openDetailModal(cliente)}
                        className="p-1 text-gray-500 hover:text-green-600 rounded-full hover:bg-gray-100"
                        title="Ver detalles"
                      >
                        <Search size={16} />
                      </button>
                      <button
                        onClick={() => openUsersModal(cliente)}
                        className="p-1 text-gray-500 hover:text-yellow-700 rounded-full hover:bg-gray-100"
                        title="Ver operadores"
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
          <ClientForm
            onSubmit={handleCreateClient}
            onCancel={closeCreateModal}
          />
        </Modal>
        <Modal isOpen={editModalOpen} onClose={closeEditModal}>
          <EditClientForm
            onSubmit={handleEditClient}
            onCancel={closeEditModal}
            cliente={selectedClient!}
            readOnly={false}
          />
        </Modal>
        <Modal isOpen={detailModalOpen} onClose={closeDetailModal}>
          <EditClientForm
            onSubmit={handleEditClient}
            onCancel={closeDetailModal}
            cliente={selectedClient!}
            readOnly={true}
          />
        </Modal>
        <Modal isOpen={usersModalOpen} onClose={closeUsersModal}>
          <AssignedUsers cliente={selectedClient!} />
        </Modal>
      </div>
    </div>
  );
};

export default ClientesPage;
