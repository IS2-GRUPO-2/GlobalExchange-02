import type { Cliente } from "../../clientes/types/Cliente";
import type { Denominacion } from "../../divisas/types/Divisa";
import type { TransaccionDetalle } from "../../operaciones/types/Transaccion";
import { tauserApi } from "./tauserApi";

export type Banco = {
  id: number;
  nombre: string;
};

type DetalleMovimiento = {
  denominacion: number;
  cantidad: number;
};

type RecibirEfectivoPayload = {
  tauser: string;
  detalles: DetalleMovimiento[];
  acepta_cambio?: boolean;
};

type EntregarMetalicoPayload = {
  tauser: string;
};

type ChequePayload = {
  cliente: string;
  banco_emisor: number;
  titular: string;
  numero: string;
  tipo: "NORMAL" | "ADELANTADO";
  monto: number;
  divisa: string;
  observaciones?: string;
};

export const getTauserClientes = async (userId: number) =>
  tauserApi.get<Cliente[]>(`/usuarios/${userId}/get_clientes_asignados/`);

export const getTauserTransacciones = async (clienteId: string, estados?: string[]) => {
  const params = estados ? { estado: estados } : undefined;
  return tauserApi.get<TransaccionDetalle[]>(
    `/clientes/${clienteId}/get_historial_transacciones/`,
    { params }
  );
};

export const recibirEfectivoTauser = async (transaccionId: number, payload: RecibirEfectivoPayload) =>
  tauserApi.post<TransaccionDetalle>(
    `/operaciones/transacciones/${transaccionId}/recibir-efectivo/`,
    payload
  );

export const entregarMetalicoTauser = async (
  transaccionId: number,
  payload: EntregarMetalicoPayload
) =>
  tauserApi.post<TransaccionDetalle>(
    `/operaciones/transacciones/${transaccionId}/entregar-metalico/`,
    payload
  );

export const completarTransaccionTauser = async (transaccionId: number) =>
  tauserApi.patch<TransaccionDetalle>(`/operaciones/transacciones/${transaccionId}/completar/`);

export const cancelarTransaccionTauser = async (transaccionId: number) =>
  tauserApi.patch<TransaccionDetalle>(`/operaciones/transacciones/${transaccionId}/cancelar/`);

export const getTauserDenominaciones = async (divisaId: number) =>
  tauserApi.get<Denominacion[]>(`/divisas/${divisaId}/get_denominaciones/`);

export const getTauserBancos = async () =>
  tauserApi.get<Banco[]>(`/metodos-financieros/bancos/`);

export const crearChequeTauser = async (payload: ChequePayload) =>
  tauserApi.post(`/metodos-financieros/cheques/`, payload);

export const reconfirmarTasaTauser = async (transaccionId: number) =>
  tauserApi.get<{ cambio: boolean } & Record<string, string>>(
    `/operaciones/transacciones/${transaccionId}/reconfirmar-tasa/`
  );

export const actualizarReconfirmacionTauser = async (
  transaccionId: number,
  payload: { tasa_actual?: number; monto_destino_actual?: number; monto_origen?: number }
) =>
  tauserApi.patch<TransaccionDetalle>(
    `/operaciones/transacciones/${transaccionId}/actualizar-reconfirmacion/`,
    payload
  );
