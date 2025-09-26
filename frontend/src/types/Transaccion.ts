/**
 * @fileoverview Tipos de datos para transacciones de operaciones.
 */

import type { SimulacionResponse } from './Simulacion';
import type { Tauser } from './Tauser';

export interface TransaccionRequest {
  cliente_id: string;
  divisa_origen: number;
  divisa_destino: number;
  monto: number;
  detalle_metodo_id?: number;
  metodo_id?: number;
  tauser_id: string;
  terminos_aceptados: boolean;
}

export interface Transaccion {
  id: number;
  operador: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  cliente: {
    idCliente: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  operacion: 'compra' | 'venta';
  tasa_aplicada: number;
  tasa_inicial: number;
  divisa_origen: {
    id: number;
    nombre: string;
    código: string;
  };
  divisa_destino: {
    id: number;
    nombre: string;
    código: string;
  };
  monto_origen: number;
  monto_destino: number;
  metodo_financiero: {
    id: number;
    nombre: string;
    nombre_display: string;
  };
  fecha_inicio: string;
  fecha_fin: string | null;
  tauser: Tauser;
  estado: 'pendiente' | 'en_proceso' | 'completada' | 'cancelada' | 'fallida';
  created_at: string;
  updated_at: string;
}

export interface OperacionCompleta extends SimulacionResponse {
  tauser_seleccionado: Tauser;
}

export interface SimulacionOperacionResultado {
  tasa_cambio: boolean;
  resultado_anterior?: SimulacionResponse;
  resultado_actual: SimulacionResponse;
}

export interface TransaccionResponse {
  id: string;
  codigo: string;
  estado: 'pendiente' | 'en_proceso' | 'completada' | 'cancelada' | 'fallida';
  mensaje?: string;
}