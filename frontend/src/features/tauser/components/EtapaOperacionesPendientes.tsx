import { useEffect, useMemo, useState } from "react";
import type { Cliente } from "../../clientes/types/Cliente";
import type { TransaccionDetalle } from "../../operaciones/types/Transaccion";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";
import { getTauserTransacciones } from "../services/tauserTerminalService";
import type { SelectedTauser } from "../store/useSelectedTauser";

type Props = {
  cliente: Cliente | null;
  tauser: SelectedTauser | null;
  onVolver: () => void;
  onSeleccionar: (transaccion: TransaccionDetalle) => void;
};

const ITEMS_PER_PAGE = 8;

export default function EtapaOperacionesPendientes({ cliente, tauser, onVolver, onSeleccionar }: Props) {
  const [transacciones, setTransacciones] = useState<TransaccionDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!cliente || !tauser) {
      setTransacciones([]);
      setTotalPages(1);
      setPage(1);
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchTransacciones = async () => {
      try {
        const res = await getTauserTransacciones(cliente.id.toString(), ["pendiente", "en_proceso"]);
        const listaFiltrada = (res.data ?? [])
          .filter((transaccion) => ["pendiente", "en_proceso"].includes(transaccion.estado))
          .filter(
            (transaccion) => !(transaccion.operacion === "venta" && transaccion.estado === "pendiente")
          )
          .filter((transaccion) => {
            const targetId = `${tauser.id}`.toLowerCase();
            const targetCodigo = `${tauser.codigo}`.toLowerCase();
            const posiblesValores = [
              transaccion.tauser ?? null,
              transaccion.tauser_detalle?.id ?? null,
              transaccion.tauser_detalle?.codigo ?? null,
            ]
              .filter((valor): valor is string | number => valor !== null && valor !== undefined)
              .map((valor) => `${valor}`.toLowerCase());

            return posiblesValores.some(
              (valor) => valor === targetId || valor === targetCodigo
            );
          });

        setTransacciones(listaFiltrada);
        setTotalPages(Math.max(1, Math.ceil(listaFiltrada.length / ITEMS_PER_PAGE)));
      } catch (error) {
        console.error(error);
        toast.error("No se pudieron cargar las operaciones pendientes");
      } finally {
        setLoading(false);
      }
    };

    fetchTransacciones();
    const interval = setInterval(fetchTransacciones, 5000);
    return () => clearInterval(interval);
  }, [cliente, tauser]);

  useEffect(() => {
    if (!cliente) {
      toast.error("No se ha seleccionado ningun cliente");
      onVolver();
    }
  }, [cliente, onVolver]);

  useEffect(() => {
    setPage(1);
  }, [cliente?.id, tauser?.id]);

  const transaccionesActuales = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, transacciones.length);
    return transacciones.slice(startIndex, endIndex);
  }, [page, transacciones]);

  const formatDate = (value: string | Date) => {
    const date = new Date(value);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (value: string | number) =>
    Number(value).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getStatusColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "en_proceso":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="w-full max-w-4xl relative">
      <div className="flex justify-center items-center mb-6">
        <h2 className="text-2xl font-bold text-[var(--foreground)]">Operaciones pendientes</h2>
      </div>

      {cliente && (
        <div className="bg-[var(--accent)]/60 rounded-2xl p-4 mb-6">
          <div className="font-medium text-lg text-[var(--foreground)]">{cliente.nombre}</div>
          <div className="text-sm text-[var(--muted-foreground)]">
            Categoría: {cliente.categoria?.nombre ?? "Sin categoría"}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading && <div className="text-center text-[var(--muted-foreground)] py-8">Cargando operaciones...</div>}

        {!loading && transaccionesActuales.length === 0 && (
          <div className="text-center text-[var(--muted-foreground)] py-8">
            No hay operaciones pendientes para este cliente.
          </div>
        )}

        {!loading &&
          transaccionesActuales.map((transaccion) => (
            <div
              key={transaccion.id}
              className="border border-[var(--border)] rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-[var(--foreground)]">Operación #{transaccion.id}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(transaccion.estado)}`}>
                      {transaccion.estado === "en_proceso" ? "En proceso" : "Pendiente"}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)] mt-1">
                    Fecha: {formatDate(transaccion.fecha_inicio)}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                    <div>
                      <span className="text-[var(--muted-foreground)]">Monto origen:</span>{" "}
                      <span className="font-semibold text-[var(--foreground)]">
                        {formatAmount(transaccion.monto_origen)} {transaccion.divisa_origen_detalle?.codigo ?? ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--muted-foreground)]">Monto destino:</span>{" "}
                      <span className="font-semibold text-[var(--foreground)]">
                        {formatAmount(transaccion.monto_destino)} {transaccion.divisa_destino_detalle?.codigo ?? ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--muted-foreground)]">Operación:</span>{" "}
                      <span className="font-semibold text-[var(--foreground)]">
                        {transaccion.operacion === "compra" ? "Compra" : "Venta"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--muted-foreground)]">Tasa:</span>{" "}
                      <span className="font-semibold text-[var(--foreground)]">{transaccion.tasa_aplicada}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onSeleccionar(transaccion)}
                  className="px-4 py-2 rounded-2xl bg-[var(--primary)] text-white font-semibold"
                >
                  Procesar
                </button>
              </div>
            </div>
          ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-4">
          <button
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-2xl border border-[var(--border)] disabled:opacity-50"
          >
            Anterior
          </button>
          <div className="text-sm text-[var(--muted-foreground)]">
            Página {page} de {totalPages}
          </div>
          <button
            onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-2xl border border-[var(--border)] disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      <button
        onClick={onVolver}
        className="fixed bottom-16 left-6 flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-3 rounded-2xl shadow-lg"
      >
        <ArrowLeft size={20} />
        Volver a clientes
      </button>
    </div>
  );
}
