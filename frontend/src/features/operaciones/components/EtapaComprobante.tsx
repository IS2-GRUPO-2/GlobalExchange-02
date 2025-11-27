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
  metodoSeleccionado: string | null
): string => {
  if ((transaccion as TransaccionDetalle).metodo_financiero_detalle) {
    const detalle = (transaccion as TransaccionDetalle).metodo_financiero_detalle;
    return detalle?.nombre ?? metodoSeleccionado ?? "Metodo de pago";
  }
  return metodoSeleccionado ?? "Metodo de pago";
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
      return nombre ?? "Metodo";
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

  const opCasa =
    resultado?.op_perspectiva_casa ??
    ((transaccion as any).operacion as "compra" | "venta" | undefined) ??
    "compra";

  const descuentoCategoria =
    resultado?.tasas?.descuento_categoria ??
    Number(resultado?.parametros.descuento_categoria ?? 0);
  const comisionMetodoPct =
    resultado?.tasas?.comision_metodo ??
    Number(resultado?.parametros.comision_metodo ?? 0);

  const tasaAplicada =
    resultado?.tasas?.tasa_aplicada ??
    Number(resultado?.tc_final ?? transaccion.tasa_aplicada ?? transaccion.tasa_inicial);

  const tasaOriginal =
    resultado?.tasas?.tasa_original ??
    Number(transaccion.tasa_inicial ?? tasaAplicada);

  let tasaSinDescuentoCategoria =
    resultado?.tasas?.tasa_sin_descuento_categoria as number | undefined;

  if (tasaSinDescuentoCategoria === undefined) {
    if (opCasa === "compra") {
      tasaSinDescuentoCategoria =
        tasaOriginal - tasaOriginal * (comisionMetodoPct / 100);
    } else {
      tasaSinDescuentoCategoria =
        tasaOriginal + tasaOriginal * (comisionMetodoPct / 100);
    }
  }

  const divisaOrigen = resultado?.divisa_origen ?? transaccion.divisa_origen;
  const divisaDestino = resultado?.divisa_destino ?? transaccion.divisa_destino;

  const montoFinalOrigen =
    resultado?.monto_origen !== undefined
      ? Number(resultado.monto_origen)
      : montoOrigen;
  const montoFinalDestino =
    resultado?.monto_destino !== undefined
      ? Number(resultado.monto_destino)
      : montoDestino;

  const montoSinDescuentoOrigen =
    opCasa === "venta"
      ? (montoFinalDestino || 0) * (tasaSinDescuentoCategoria ?? tasaAplicada)
      : montoFinalOrigen;

  const montoSinDescuentoDestino =
    opCasa === "compra"
      ? (montoFinalOrigen || 0) * (tasaSinDescuentoCategoria ?? tasaAplicada)
      : montoFinalDestino;

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
                `Terminacion: ${detalleMetodoSeleccionado.last4 ? `**** ${detalleMetodoSeleccionado.last4}` : "N/D"}`,
              ],
            }
          : null;

  return (
    <div className="space-y-6 select-none">
      <div className="text-center space-y-1">
        <h3 className="text-2xl font-semibold text-gray-900">Comprobante de transaccion</h3>
        <p className="text-sm text-gray-600">
          Revisa el detalle de la transaccion generada antes de continuar.
        </p>
      </div>

      {/* Conversion principal */}
      <div className="relative overflow-hidden rounded-lg border-2 border-zinc-300 bg-gradient-to-br from-zinc-50 to-white p-6">
        <div className="flex items-center justify-center gap-8">
          <div className="text-center flex-1">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              {opCasa === "compra" ? "Entrega" : "Entrega"}
            </div>
            <div className="text-4xl font-bold text-zinc-900">
              {formatNumber(montoFinalOrigen, 2)}
            </div>
            <div className="text-base font-semibold text-zinc-600 mt-2">
              {divisaOrigen}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-4xl text-zinc-400">⇆</div>
          </div>

          <div className="text-center flex-1">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              {opCasa === "compra" ? "Recibe" : "Recibe"}
            </div>
            <div className="text-4xl font-bold text-zinc-900">
              {formatNumber(montoFinalDestino, 2)}
            </div>
            <div className="text-base font-semibold text-zinc-600 mt-2">
              {divisaDestino}
            </div>
          </div>
        </div>
      </div>

      {/* Resumen general */}
      <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm p-6 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">ID de transaccion</span>
          <span className="text-lg font-semibold text-gray-900">#{transaccion.id}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Estado</span>
          <span className="text-sm font-semibold uppercase text-zinc-900">{estado}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Metodo</span>
          <span className="text-sm font-semibold text-gray-900">{metodoLabel}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Terminal</span>
          <span className="text-sm font-semibold text-gray-900">
            {tauserSeleccionado || "No asignado"}
          </span>
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

      {/* Tasas y descuentos */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
        <h4 className="font-semibold text-zinc-900 border-b border-zinc-200 pb-2">
          Tasas y descuentos
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
            <p className="text-xs text-zinc-500 font-semibold uppercase mb-1">Tasa original</p>
            <p className="text-lg font-semibold text-zinc-900">
              {formatNumber(tasaOriginal, 0)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
            <p className="text-xs text-zinc-500 font-semibold uppercase mb-1">
              Descuento categoria
            </p>
            <p className="text-lg font-semibold text-zinc-900">
              {formatNumber(descuentoCategoria, 2)}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
            <p className="text-xs text-zinc-500 font-semibold uppercase mb-1">
              Comision metodo
            </p>
            <p className="text-lg font-semibold text-zinc-900">
              {formatNumber(comisionMetodoPct, 2)}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
            <p className="text-xs text-zinc-500 font-semibold uppercase mb-1">
              Tasa sin descuento de categoria
            </p>
            <p className="text-lg font-semibold text-zinc-900">
              {formatNumber(tasaSinDescuentoCategoria ?? tasaAplicada, 0)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
            <p className="text-xs text-zinc-500 font-semibold uppercase mb-1">Tasa aplicada</p>
            <p className="text-lg font-bold text-zinc-900">
              {formatNumber(tasaAplicada, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Montos comparativos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase">Monto origen final</p>
          <p className="text-xl font-semibold text-gray-900">
            {formatNumber(montoFinalOrigen, 2)} {divisaOrigen}
          </p>
          {opCasa === "venta" && (
            <p className="text-sm text-gray-500 mt-2">
              Sin descuento cat.: {formatNumber(montoSinDescuentoOrigen, 2)} {divisaOrigen}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase">Monto destino final</p>
          <p className="text-xl font-semibold text-gray-900">
            {formatNumber(montoFinalDestino, 2)} {divisaDestino}
          </p>
          {opCasa === "compra" && (
            <p className="text-sm text-gray-500 mt-2">
              Sin descuento cat.: {formatNumber(montoSinDescuentoDestino, 2)} {divisaDestino}
            </p>
          )}
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
