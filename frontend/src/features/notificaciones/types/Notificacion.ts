import { type Divisa } from '../../divisas/types/Divisa';

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