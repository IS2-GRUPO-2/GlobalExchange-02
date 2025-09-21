import { useEffect, useState } from "react";
import type { Cliente } from "../types/Cliente";
import {
  Edit,
  UserX,
  UserCheck,
  UserPlus,
  Search,
  BookUser,
} from "lucide-react";
import type { ClientFormData } from "../features/clientes/components/ClientForm";
import Modal from "../components/Modal";
import ClientForm from "../features/clientes/components/ClientForm";
import AssignedUsers from "../features/clientes/components/AssignedUsers";
import { useClientes } from "../features/clientes/hooks/useCliente";
import { useModal } from "../hooks/useModal";
import SearchBar from "../components/SearchBar";
import { CLIENTES } from "../types/perms";
import Can from "../components/Can";

const ClientesPage = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const clientesHook = useClientes();
  const modalHook = useModal();

  useEffect(() => {
    clientesHook.fetchClientes(searchQuery, clientesHook.page);
  }, [clientesHook.page]);

  const handleCreateClient = async (clientData: ClientFormData) => {
    modalHook.setIsSubmitting(true);
    const success = await clientesHook.registerCliente(clientData);
    if (success) {
      clientesHook.fetchClientes(searchQuery, clientesHook.page);
      modalHook.closeCreateModal();
    }
    modalHook.setIsSubmitting(false);
  };

  const handleEditClient = async (clientData: ClientFormData) => {
    modalHook.setIsSubmitting(true);
    const success = await clientesHook.updateClient(
      clientData,
      clientesHook.selectedClient?.idCliente!
    );
    if (success) {
      clientesHook.fetchClientes(searchQuery, clientesHook.page);
      modalHook.closeCreateModal();
    }
    modalHook.setIsSubmitting(false);
  };

  const handleToggleClient = async (cliente: Cliente) => {
    const success = await clientesHook.toggleCliente(cliente);
    if (success) {
      clientesHook.fetchClientes(searchQuery, clientesHook.page);
    }
  };

  const onSearch = () => {
    clientesHook.setPage(1);
    clientesHook.fetchClientes(searchQuery, clientesHook.page);
  };

  return (
    <div className="bg-gray-50 min-h-screen flex-1 overflow-y-auto p-6">
      {/* Header: buscador + botón */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex w-full sm:w-64 md:w-96 gap-2">
          <SearchBar
            search={searchQuery}
            setSearch={setSearchQuery}
            onSearch={onSearch}
          />
        </div>
        <Can anyOf = {[CLIENTES.ADD]}>
          <button
            onClick={modalHook.openCreateModal}
            className="btn-primary flex items-center justify-center"
          >
            <UserPlus size={18} className="mr-2" />
            Crear Cliente
          </button>
        </Can>
      </div>

      {/* Tabla */}
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
              {clientesHook.clientes.map((cliente: Cliente) => (
                <tr key={cliente.idCliente}>
                  <td className="font-medium">{cliente.nombre}</td>
                  <td>{cliente.categoria?.nombre}</td>
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
                      <Can anyOf = {[CLIENTES.CHANGE]}>
                        <button
                          onClick={() => modalHook.openEditModal(cliente)}
                          className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                      </Can>
                      <Can anyOf = {cliente.isActive? [CLIENTES.DELETE] : [CLIENTES.CHANGE]}>
                        <button
                          onClick={() => handleToggleClient(cliente)}
                          className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                          title={cliente.isActive ? "Desactivar" : "Activar"}
                        >
                          {cliente.isActive ? (
                            <UserX size={16} />
                          ) : (
                            <UserCheck size={16} />
                          )}
                        </button>
                      </Can>
                      <button
                        onClick={() => modalHook.openViewModal(cliente)}
                        className="p-1 text-gray-500 hover:text-green-600 rounded-full hover:bg-gray-100"
                        title="Ver detalles"
                      >
                        <Search size={16} />
                      </button>
                      <button
                        onClick={() => clientesHook.openUsersModal(cliente)}
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
            <tfoot>
              <tr>
                <td colSpan={7}>
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600">
                      Página {clientesHook.page} de {clientesHook.totalPages}
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={() =>
                          clientesHook.setPage((p) => Math.max(p - 1, 1))
                        }
                        disabled={clientesHook.page === 1}
                        className="px-3 py-1 btn-primary disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() =>
                          clientesHook.setPage((p) =>
                            Math.min(p + 1, clientesHook.totalPages)
                          )
                        }
                        disabled={clientesHook.page === clientesHook.totalPages}
                        className="px-3 py-1 btn-primary disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Modales */}
        <Modal
          isOpen={modalHook.createModalOpen}
          onClose={modalHook.closeCreateModal}
        >
          <ClientForm
            onSubmit={handleCreateClient}
            onCancel={modalHook.closeCreateModal}
            isEditForm={false}
            cliente={null}
            readOnly={false}
          />
        </Modal>
        <Modal
          isOpen={modalHook.editModalOpen}
          onClose={modalHook.closeEditModal}
        >
          <ClientForm
            onSubmit={handleEditClient}
            onCancel={modalHook.closeEditModal}
            cliente={modalHook.selectedItem}
            isEditForm={true}
            readOnly={false}
          />
        </Modal>
        <Modal
          isOpen={modalHook.viewModalOpen}
          onClose={modalHook.closeViewModal}
        >
          <ClientForm
            onSubmit={handleEditClient}
            onCancel={modalHook.closeViewModal}
            cliente={modalHook.selectedItem}
            isEditForm={false}
            readOnly={true}
          />
        </Modal>
        <Modal
          isOpen={clientesHook.usersModalOpen}
          onClose={clientesHook.closeUsersModal}
        >
          <AssignedUsers cliente={clientesHook.selectedClient!} />
        </Modal>
      </div>
    </div>
  );
};

export default ClientesPage;
