export interface OperacionRealRequest {
  cliente_id: string;
  divisa_origen: number;
  divisa_destino: number;
  monto: number;
  detalle_metodo_id?: number;
  metodo_id?: number;
  tauser_id?: string;
}

export interface OperacionRealResponse {
  id: number;
  cliente_id: string;
  divisa_origen: number;
  divisa_destino: number;
  monto: number;
  monto_final: number;
  tasa_aplicada: number;
  comision: number;
  detalle_metodo_id?: number;
  metodo_id?: number;
  tauser_id?: string;
  estado: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface TransaccionCreateRequest {
  operacion_id: number;
  metodo_pago?: string;
  datos_adicionales?: any;
}

export interface TransaccionResponse {
  id: number;
  operacion_id: number;
  metodo_pago?: string;
  estado: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  datos_adicionales?: any;
}
