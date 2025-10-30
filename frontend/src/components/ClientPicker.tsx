import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import {
  getClienteActual,
  getUserClients,
  setClienteActual,
} from "../features/usuario/services/usuarioService";
import type { Cliente } from "../features/clientes/types/Cliente";
import { useClientStore } from "../hooks/useClientStore";

const ClientPicker = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const { user } = useAuth();
  const { selectedClient, setSelectedClient } = useClientStore();

  const fetchClientes = async () => {
    try {
      const res = await getUserClients(user!.id);
      setClientes(res.data);
    } catch (err) {
      console.error("Error cargando clientes", err);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    const fetchClienteActual = async () => {
      try {
        const res = await getClienteActual(user!.id);
        const { clienteActual } = res.data;

        if (clienteActual) {
          setSelectedClient(clienteActual);
        }
      } catch (err) {
        console.error("Error obteniendo cliente actual", err);
      }
    };

    // Siempre ejecutar al montar el componente para sincronizar con el backend
    // Esto asegura que cliente_actual esté persistido en DB
    if (user?.id) {
    // if (!selectedClient) {
      fetchClienteActual();
    }
  }, [user?.id, setSelectedClient]);

  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clienteId = e.target.value;
    const cliente = clientes.find((c) => c.id === clienteId);

    if (cliente) {
      setSelectedClient(cliente);
      setClienteActual(user?.id!, clienteId);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <select
        value={selectedClient?.id || ""}
        onChange={handleClienteChange}
        className="block w-full rounded-lg border-gray-300 shadow-sm text-white bg-zinc-900 focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
      >
        <option value="" disabled>
          Seleccionar cliente
        </option>
        {clientes.map((cliente) => (
          <option key={cliente.id} value={cliente.id}>
            {cliente.nombre}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ClientPicker;
