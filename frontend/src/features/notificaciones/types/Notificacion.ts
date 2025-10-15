import { type Divisa } from '../../divisas/types/Divisa';

export interface PreferenciaNotificacionUsuario {
  id: number;
  notificaciones_activas: boolean;
  divisas_suscritas: number[];
  divisas_detalle: Divisa[];
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface PreferenciaNotificacionCliente {
  id: number;
  cliente: number;
  cliente_nombre: string;
  notificaciones_activas: boolean;
  divisas_suscritas: number[];
  divisas_detalle: Divisa[];
  fecha_creacion: string;
  fecha_actualizacion: string;
}