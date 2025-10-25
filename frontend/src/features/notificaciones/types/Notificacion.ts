import { type Divisa } from '../../divisas/types/Divisa';

export interface DivisaCompacta {
  id: number;
  codigo: string;
  nombre: string;
  simbolo: string;
}

export interface NotificacionTasaUsuario {
  id: number;
  is_active: boolean;
  divisas_suscritas: number[];
  divisas_detalle: Divisa[];
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface NotificacionTasaCliente {
  id: number;
  cliente: number;
  cliente_nombre: string;
  is_active: boolean;
  divisas_suscritas: number[];
  divisas_detalle: Divisa[];
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface SnapshotTasa {
  anterior: string;
  nueva: string;
  variacion: string;
  variacion_porcentaje: string;
  es_incremento: boolean;
  es_decremento: boolean;
}

export interface NotificacionCambioTasa {
  id: number;
  tipo_evento: 'suscripcion' | 'transaccion_pendiente';
  titulo: string;
  descripcion: string;
  par_divisa: string;
  divisa: DivisaCompacta;
  tasa_compra: SnapshotTasa;
  tasa_venta: SnapshotTasa;
  created_at: string;
}