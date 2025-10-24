import type { Cliente } from "../../clientes/types/Cliente";
import type { TransaccionDetalle } from "../../operaciones/types/Transaccion";
import { tauserApi } from "./tauserApi";

export const fetchTauserAssignedClients = async (userId: number) => {
  const res = await tauserApi.get<Cliente[]>(`/usuarios/${userId}/get_clientes_asignados/`);
  return res.data;
};

export const fetchTauserTransacciones = async (
  clienteId: string,
  estado?: string | string[],
) => {
  const params = estado ? { estado } : {};
  const res = await tauserApi.get<TransaccionDetalle[]>(
    `/clientes/${clienteId}/get_historial_transacciones/`,
    { params },
  );
  return res.data;
};

export const fetchTauserPendingTransaccionesCount = async (clienteId: string) => {
  const transacciones = await fetchTauserTransacciones(clienteId, ["pendiente", "en_proceso"]);
  return transacciones.length;
};
