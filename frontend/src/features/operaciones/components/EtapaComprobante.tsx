import { formatNumber } from "../utils/formatNumber";
import type {
  CuentaBancaria,
  BilleteraDigital,
  Tarjeta,
} from "../../metodos_financieros/types/MetodoFinanciero";
import type { CalcularOperacionResponse } from "../types/Operacion";
import type { Transaccion, TransaccionDetalle } from "../types/Transaccion";

interface EtapaComprobanteProps {
  transaccion: Transaccion | TransaccionDetalle;
  resultado: CalcularOperacionResponse | null;
  metodoSeleccionado: string | null;
  detalleMetodoSeleccionado: CuentaBancaria | BilleteraDigital | Tarjeta | null;
  tauserSeleccionado: string;
  onVerHistorial: () => void;
  onNuevaOperacion: () => void;
}

const obtenerMetodoLabel = (
  transaccion: Transaccion | TransaccionDetalle,
  metodoSeleccionado: string | null,
): string => {
  if ((transaccion as TransaccionDetalle).metodo_financiero_detalle) {
    const detalle = (transaccion as TransaccionDetalle).metodo_financiero_detalle;
    return detalle?.nombre ?? metodoSeleccionado ?? "Método de pago";
  }
  return metodoSeleccionado ?? "Método de pago";
};

const obtenerEstado = (transaccion: Transaccion | TransaccionDetalle): string => {
  return (transaccion.estado ?? "").toString();
};

const obtenerMonto = (valor: string | number): number => {
  if (typeof valor === "number") return valor;
  const parsed = Number(valor);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapMetodoLabel = (nombre: string | null) => {
  switch (nombre) {
    case "TRANSFERENCIA_BANCARIA":
      return "Transferencia bancaria";
    case "BILLETERA_DIGITAL":
      return "Billetera digital";
    case "TARJETA":
      return "Tarjeta";
    case "EFECTIVO":
      return "Efectivo";
    case "CHEQUE":
      return "Cheque";
    default:
      return nombre ?? "Método";
  }
};

export default function EtapaComprobante({
  transaccion,
  resultado,
  metodoSeleccionado,
  detalleMetodoSeleccionado,
  tauserSeleccionado,
  onVerHistorial,
  onNuevaOperacion,
}: EtapaComprobanteProps) {
  const metodoLabelRaw = obtenerMetodoLabel(transaccion, metodoSeleccionado);
  const metodoLabel = mapMetodoLabel(metodoLabelRaw);
  const estado = obtenerEstado(transaccion);
  const montoOrigen = obtenerMonto(transaccion.monto_origen);
  const montoDestino = obtenerMonto(transaccion.monto_destino);
  const tasa = Number(transaccion.tasa_aplicada ?? transaccion.tasa_inicial);

  const detalleMetodo =
    detalleMetodoSeleccionado && "numero_cuenta" in detalleMetodoSeleccionado
      ? {
          titulo: "Cuenta seleccionada",
          lineas: [
            `Banco: ${detalleMetodoSeleccionado.banco_nombre ?? "N/D"}`,
            `Cuenta: ${
              detalleMetodoSeleccionado.numero_cuenta
                ? `**** ${detalleMetodoSeleccionado.numero_cuenta.slice(-4)}`
                : "No disponible"
            }`,
          ],
        }
      : detalleMetodoSeleccionado && "usuario_id" in detalleMetodoSeleccionado
        ? {
            titulo: "Billetera seleccionada",
            lineas: [
              `Plataforma: ${detalleMetodoSeleccionado.plataforma_nombre ?? "N/D"}`,
              `Usuario: ${
                detalleMetodoSeleccionado.usuario_id ??
                detalleMetodoSeleccionado.alias_billetera ??
                "No disponible"
              }`,
            ],
          }
        : detalleMetodoSeleccionado && "last4" in detalleMetodoSeleccionado
          ? {
              titulo: "Tarjeta seleccionada",
              lineas: [
                `Marca: ${detalleMetodoSeleccionado.marca_nombre ?? detalleMetodoSeleccionado.brand ?? "N/D"}`,
                `Terminación: ${detalleMetodoSeleccionado.last4 ? `**** ${detalleMetodoSeleccionado.last4}` : "N/D"}`,
              ],
            }
          : null;

  return (
    <div className="space-y-6 select-none">
      <div className="text-center space-y-1">
        <h3 className="text-2xl font-semibold text-gray-900">Comprobante de transacción</h3>
        <p className="text-sm text-gray-600">
          Revisa el detalle de la transacción generada antes de continuar.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">ID de transacción</span>
          <span className="text-lg font-semibold text-gray-900">#{transaccion.id}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Estado</span>
          <span className="text-sm font-semibold uppercase text-zinc-900">{estado}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Método</span>
          <span className="text-sm font-semibold text-gray-900">{metodoLabel}</span>
        </div>
        {detalleMetodo && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-1">{detalleMetodo.titulo}</p>
            <ul className="text-sm text-gray-700 space-y-1">
              {detalleMetodo.lineas.map((linea) => (
                <li key={linea}>{linea}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase">Monto origen</p>
          <p className="text-xl font-semibold text-gray-900">
            {formatNumber(montoOrigen, 2)} {resultado?.divisa_origen ?? transaccion.divisa_origen}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase">Monto destino</p>
          <p className="text-xl font-semibold text-gray-900">
            {formatNumber(montoDestino, 2)} {resultado?.divisa_destino ?? transaccion.divisa_destino}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase">Tasa aplicada</p>
          <p className="text-lg font-semibold text-gray-900">{formatNumber(tasa, 4)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase">Terminal</p>
          <p className="text-lg font-semibold text-gray-900">{tauserSeleccionado || "No asignado"}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-end gap-3 pt-4">
        <button
          onClick={onVerHistorial}
          className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Ver historial
        </button>
        <button
          onClick={onNuevaOperacion}
          className="px-6 py-2 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-700 transition-colors"
        >
          Ok
        </button>
      </div>
    </div>
  );
}




