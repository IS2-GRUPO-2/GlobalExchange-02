import { useEffect, useState } from "react";
import type { Cliente } from "../../clientes/types/Cliente";
import type { TransaccionDetalle } from "../../operaciones/types/Transaccion";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";
import { fetchTauserTransacciones } from "../services/tauserDataService";

interface EtapaOperacionesPendientesProps {
  cliente: Cliente | null;
  onVolver: () => void;
}

export default function EtapaOperacionesPendientes({ cliente, onVolver }: EtapaOperacionesPendientesProps) {
  const [transacciones, setTransacciones] = useState<TransaccionDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Cargar las transacciones pendientes y en proceso del cliente seleccionado
  useEffect(() => {
    const fetchTransacciones = async () => {
      if (!cliente) {
        toast.error("No se ha seleccionado ningún cliente");
        onVolver();
        return;
      }

      setLoading(true);
      try {
        const transaccionesList = await fetchTauserTransacciones(
          cliente.id.toString(),
          ['pendiente', 'en_proceso'],
        );
        
        setTransacciones(transaccionesList);
        setTotalPages(Math.ceil(transaccionesList.length / itemsPerPage));
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar las transacciones del cliente:", error);
        toast.error("No se pudieron cargar las operaciones pendientes");
        setLoading(false);
      }
    };

    fetchTransacciones();
  }, [cliente, onVolver]);

  // Obtener las transacciones para la página actual
  const getCurrentPageTransacciones = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, transacciones.length);
    return transacciones.slice(startIndex, endIndex);
  };

  // Calcular transacciones de la página actual
  const transaccionesActuales = getCurrentPageTransacciones();

  // Función para formatear fechas
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para formatear montos con separador de miles
  const formatAmount = (amount: string | number) => {
    return Number(amount).toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Función para obtener el color del estado
  const getStatusColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_proceso':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para manejar la selección de una transacción
  const handleSelectTransaccion = (transaccion: TransaccionDetalle) => {
    toast.info(`Transacción seleccionada: ${transaccion.id}`);
    // TODO: Implementar la lógica para continuar con la operación seleccionada
  };

  return (
    <div className="w-full max-w-3xl relative">
      <div className="flex justify-center items-center mb-6">
        <h2 className="text-2xl font-bold">Operaciones Pendientes</h2>
      </div>

      {cliente && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="font-medium text-lg">{cliente.nombre}</div>
          <div className="text-sm text-gray-500">
            {"Categoría: " + (cliente.categoria?.nombre || "Sin categoría")}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading && (
          <div className="text-center text-gray-500 py-8">Cargando operaciones pendientes...</div>
        )}

        {!loading && transaccionesActuales.length === 0 && (
          <div className="text-center text-gray-500 py-8">No hay operaciones pendientes para este cliente.</div>
        )}

        {!loading && transaccionesActuales.map((transaccion) => (
          <div
            key={transaccion.id}
            className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{`Operación #${transaccion.id}`}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(transaccion.estado)}`}>
                    {transaccion.estado === 'en_proceso' ? 'En Proceso' : 'Pendiente'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Fecha: {formatDate(transaccion.fecha_inicio)}
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2">
                  <div className="text-sm">
                    <span className="text-gray-500">Monto Origen:</span>{" "}
                    <span className="font-medium">{formatAmount(transaccion.monto_origen)}</span>{" "}
                    <span className="text-gray-700">{transaccion.divisa_origen_detalle?.codigo || ""}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Monto Destino:</span>{" "}
                    <span className="font-medium">{formatAmount(transaccion.monto_destino)}</span>{" "}
                    <span className="text-gray-700">{transaccion.divisa_destino_detalle?.codigo || ""}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Operación:</span>{" "}
                    <span className="font-medium">{transaccion.operacion === "compra" ? "Compra" : "Venta"}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Tasa:</span>{" "}
                    <span className="font-medium">{transaccion.tasa_aplicada}</span>
                  </div>
                </div>
              </div>
              <button 
                className="px-3 py-1 btn-primary"
                onClick={() => handleSelectTransaccion(transaccion)}
              >
                Continuar
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
      
      {/* Botón de volver a clientes en la esquina inferior izquierda */}
      <button 
        onClick={onVolver}
        className="fixed bottom-16 left-8 flex items-center justify-center gap-2 bg-black text-white px-5 py-3 rounded-lg text-base font-medium shadow-lg hover:bg-gray-800 transition-colors"
      >
        <ArrowLeft size={24} />
        Volver a Clientes
      </button>
    </div>
  );
}