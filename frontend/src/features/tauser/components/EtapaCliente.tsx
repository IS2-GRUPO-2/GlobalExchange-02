import { useEffect, useState } from "react";
import type { Cliente } from "../../clientes/types/Cliente";
import { toast } from "react-toastify";
import { useTauserAuth } from "../context/useTauserAuth";
import {
  fetchTauserAssignedClients,
  fetchTauserPendingTransaccionesCount,
} from "../services/tauserDataService";

interface EtapaClienteProps {
  onSelectCliente: (cliente: Cliente) => void;
}

export default function EtapaCliente({ onSelectCliente }: EtapaClienteProps) {
  const { user } = useTauserAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const itemsPerPage = 10;

  // Cargar los clientes asignados al usuario actual
  useEffect(() => {
    const fetchUserClients = async () => {
      if (!user || !user.id) {
        toast.error("No se pudo identificar el usuario actual");
        return;
      }

      setLoading(true);
      try {
  const clientesList = await fetchTauserAssignedClients(user.id);
        
        setClientes(clientesList);
        setTotalPages(Math.ceil(clientesList.length / itemsPerPage));
        
        // Cargar contadores de transacciones pendientes para cada cliente
        const counts: Record<string, number> = {};
        await Promise.all(
          clientesList.map(async (cliente) => {
            try {
              const count = await fetchTauserPendingTransaccionesCount(
                cliente.id.toString(),
              );
              counts[cliente.id] = count;
            } catch (error) {
              console.error(`Error al cargar operaciones pendientes para cliente ${cliente.id}:`, error);
              counts[cliente.id] = 0; // Si hay error, mostramos 0
            }
          })
        );
        
        setPendingCounts(counts);
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar los clientes del usuario:", error);
        toast.error("No se pudieron cargar los clientes asignados");
        setLoading(false);
      }
    };

    fetchUserClients();
  }, [user]);

  // Obtener los clientes para la página actual
  const getCurrentPageClientes = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, clientes.length);
    return clientes.slice(startIndex, endIndex);
  };

  // Calcular clientes de la página actual
  const clientesActuales = getCurrentPageClientes();

  const handleSelectCliente = (cliente: Cliente) => {
    toast.info(`Cliente seleccionado: ${cliente.nombre}`);
    onSelectCliente(cliente); // Llamar a la función proporcionada desde el componente padre
  };

  return (
    <div className="w-full max-w-3xl">
      <h2 className="text-2xl font-bold mb-4 text-center">Clientes</h2>
      <p className="text-gray-600 text-center mb-6">Seleccione el cliente a operar</p>

      <div className="space-y-3">
        {loading && (
          <div className="text-center text-gray-500">Cargando clientes...</div>
        )}

        {!loading && clientes.length === 0 && (
          <div className="text-center text-gray-500">No se encontraron clientes asignados a su usuario.</div>
        )}

        {!loading && clientesActuales.map((c: Cliente) => (
          <div
            key={c.id}
            className="border rounded-lg p-4 bg-white shadow-sm flex justify-between items-center"
          >
            <div>
              <div className="font-medium">{c.nombre}</div>
              <div className="text-sm text-gray-500">
                {"Categoría: " + c.categoria?.nombre || "Sin categoría"}
              </div>
              <div className="text-sm text-gray-500">
                {"Operaciones pendientes: "}
                <span className={pendingCounts[c.id] > 0 ? "text-amber-600 font-medium" : "text-gray-600"}>
                  {pendingCounts[c.id] || 0}
                </span>
              </div>
            </div>
            <div>
              <button 
                className="px-3 py-1 btn-primary"
                onClick={() => handleSelectCliente(c)}
              >
                Seleccionar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mostrar paginación solo si hay más de una página */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-4">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1 btn-primary disabled:opacity-50"
          >
            Anterior
          </button>
          <div className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1 btn-primary disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}