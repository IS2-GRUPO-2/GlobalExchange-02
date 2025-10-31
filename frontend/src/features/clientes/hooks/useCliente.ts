import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import {
  createCliente,
  deleteCliente,
  getClientes,
  updateCliente,
} from "../services/clienteService";
import { type Cliente } from "../types/Cliente";
import type { ClientFormData } from "../components/ClientForm";

export const useClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [usersModalOpen, setUsersModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);

  const openUsersModal = (client: Cliente): void => {
    setSelectedClient(client);
    setUsersModalOpen(true);
  };
  const closeUsersModal = (): void => {
    setUsersModalOpen(false);
    setSelectedClient(null);
  };

  const fetchClientes = useCallback(
    async (search: string = "", currentPage: number = 1) => {
      setLoading(true);
      try {
        const res = await getClientes({ search, page: currentPage });
        setClientes(res.results);
        setTotalPages(Math.ceil(res.count / 10));
      } catch (err) {
        toast.error("Error al cargar clientes!");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const registerCliente = useCallback(async (clientData: ClientFormData) => {
    let clienteData: Partial<Cliente> = {
      nombre: clientData.nombre,
      is_persona_fisica: clientData.is_persona_fisica,
      is_contribuyente: clientData.is_contribuyente,
      id_categoria: clientData.idCategoria,
      correo: clientData.correo,
      telefono: clientData.telefono,
      direccion: clientData.direccion,
      is_active: true,
    };

    clientData.is_contribuyente
      ? (clienteData.cedula = clientData.documento)
      : (clienteData.ruc = clientData.documento);
    try {
      await createCliente(clienteData);
      toast.success("Cliente registrado exitosamente!");
      return true;
    } catch (err) {
      toast.error("Error al crear cliente!");
      return false;
    }
  }, []);

  const updateClient = useCallback(
    async (clientData: ClientFormData, id: string) => {
      let clienteData: Partial<Cliente> = {
        nombre: clientData.nombre,
        is_persona_fisica: clientData.is_persona_fisica,
        is_contribuyente: clientData.is_contribuyente,
        id_categoria: clientData.idCategoria,
        correo: clientData.correo,
        telefono: clientData.telefono,
        direccion: clientData.direccion,
        is_active: true,
      };

      if (clientData.is_persona_fisica) {
        clienteData.cedula = clientData.documento;
        clienteData.ruc = undefined;
      } else {
        clienteData.ruc = clientData.documento;
        clienteData.cedula = undefined;
      }

      try {
        await updateCliente(id, clienteData);
        toast.success("Cliente actualizado exitosamente!");
        return true;
      } catch (err) {
        toast.error("Error al actualizar cliente");
        console.error(err);
        return false;
      }
    },
    []
  );

  const toggleCliente = useCallback(async (cliente: Cliente) => {
    if (!cliente.id) return false;

    try {
      if (cliente.is_active) {
        await deleteCliente(cliente.id);
        toast.success("Cliente desactivado exitosamente!");
      } else {
        const activeCliente: Cliente = { ...cliente, is_active: true };
        await updateCliente(cliente.id, activeCliente);
        toast.success("Cliente activado exitosamente!");
      }
      return true;
    } catch (err) {
      toast.error(
        `Error al ${cliente.is_active ? "desactivar" : "activar"} cliente`
      );
      console.error(err);
      return false;
    }
  }, []);

  return {
    clientes,
    setClientes,
    loading,
    setLoading,
    page,
    setPage,
    totalPages,
    usersModalOpen,
    setUsersModalOpen,
    selectedClient,
    setSelectedClient,
    openUsersModal,
    closeUsersModal,
    fetchClientes,
    registerCliente,
    updateClient,
    toggleCliente,
  };
};
