import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { formatNumberDecimals } from "../../../utils/format";
import type { TransaccionDetalle } from "../types/Transaccion";
import { obtenerTransaccion } from "../services/transaccionService";

export default function ComprobantePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transaccion, setTransaccion] = useState<TransaccionDetalle | null>(
    null
  );

  useEffect(() => {
    const fetchData = async () => {
      const transaccionId = searchParams.get("transaccion_id");
      const sessionId = searchParams.get("session_id");

      if (!transaccionId || !sessionId) {
        toast.error("Parámetros inválidos");
        navigate("/");
        return;
      }

      const data = await obtenerTransaccion(transaccionId);
      setTransaccion(data);
      toast.success("Pago procesado exitosamente");
      setLoading(false);
    };

    fetchData();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!transaccion) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6 select-none">
        <div className="text-center space-y-1">
          <h3 className="text-2xl font-semibold text-gray-900">
            Comprobante de pago
          </h3>
          <p className="text-sm text-gray-600">
            Tu pago ha sido procesado exitosamente
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">ID de transacción</span>
            <span className="text-lg font-semibold text-gray-900">
              #{transaccion.id}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Estado</span>
            <span className="text-sm font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
              {transaccion.estado}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Método de pago</span>
            <span className="text-sm font-semibold text-gray-900">
              Tarjeta de crédito
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Monto origen
            </p>
            <p className="text-xl font-semibold text-gray-900">
              {formatNumberDecimals(transaccion.monto_origen, 2)}
              {transaccion.divisa_origen_detalle.codigo}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Monto destino
            </p>
            <p className="text-xl font-semibold text-gray-900">
              {formatNumberDecimals(transaccion.monto_destino, 2)}
              {transaccion.divisa_destino_detalle.codigo}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Tasa aplicada
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {formatNumberDecimals(
                transaccion.tasa_aplicada ?? transaccion.tasa_inicial,
                2
              )}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Terminal
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {transaccion.tauser_detalle.nombre || "No asignado"}
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-6">
          <button
            onClick={() => navigate("/historial-transacciones")}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Ver historial
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-700 transition-colors"
          >
            Nueva operación
          </button>
        </div>
      </div>
    </div>
  );
}
