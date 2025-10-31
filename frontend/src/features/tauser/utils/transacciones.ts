import type { TransaccionDetalle } from "../../operaciones/types/Transaccion";
import type { SelectedTauser } from "../store/useSelectedTauser";

const normalizar = (valor: unknown): string | null => {
  if (valor === null || valor === undefined) {
    return null;
  }
  const texto = `${valor}`.trim();
  return texto.length > 0 ? texto.toLowerCase() : null;
};

export const esCompraExtranjeraABasePendiente = (transaccion: TransaccionDetalle): boolean => {
  const esCompra = transaccion.operacion === "compra";
  if (!esCompra) {
    return false;
  }

  const estaPendiente = transaccion.estado === "pendiente";
  if (!estaPendiente) {
    return false;
  }

  const divisaOrigenEsExtranjera = Boolean(transaccion.divisa_origen_detalle && !transaccion.divisa_origen_detalle.es_base);
  const divisaDestinoEsBase = Boolean(transaccion.divisa_destino_detalle?.es_base);

  return divisaOrigenEsExtranjera && divisaDestinoEsBase;
};

export const coincideConTauserSeleccionado = (
  transaccion: TransaccionDetalle,
  tauser: SelectedTauser | null
): boolean => {
  if (!tauser) {
    return false;
  }

  const targetId = normalizar(tauser.id);
  const targetCodigo = normalizar(tauser.codigo);

  if (!targetId && !targetCodigo) {
    return false;
  }

  const candidatos = [
    transaccion.tauser,
    transaccion.tauser_detalle?.id,
    transaccion.tauser_detalle?.codigo,
  ]
    .map(normalizar)
    .filter((valor): valor is string => Boolean(valor));

  if (candidatos.length === 0) {
    return false;
  }

  return candidatos.some((valor) => valor === targetId || valor === targetCodigo);
};

export const debeMostrarTransaccionTauser = (
  transaccion: TransaccionDetalle,
  tauser: SelectedTauser | null
): boolean => {
  if (coincideConTauserSeleccionado(transaccion, tauser)) {
    return true;
  }

  const sinTauserAsignado =
    !normalizar(transaccion.tauser) && !transaccion.tauser_detalle?.id && !transaccion.tauser_detalle?.codigo;

  if (!sinTauserAsignado) {
    return false;
  }

  return esCompraExtranjeraABasePendiente(transaccion);
};

