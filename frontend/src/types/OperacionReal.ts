/**
 * @fileoverview Tipos de datos para operaciones reales de compra/venta.
 */

import {type SimulacionResponse, type SimulacionRequestConInstancia} from './Simulacion'
// import {type Tauser} from './Tauser' // No se usa directamente en las interfaces

/**
 * @typedef {Object} OperacionRealRequest
 * Extiende SimulacionRequestConInstancia agregando selección de Tauser
 */
export interface OperacionRealRequest extends SimulacionRequestConInstancia {
  tauser_id: string;
}

/**
 * @typedef {Object} OperacionRealResponse
 * Extiende SimulacionResponse agregando información de Tauser
 */
export interface OperacionRealResponse extends SimulacionResponse {
  tauser: {
    id: string;
    nombre: string;
    direccion: string;
    ciudad: string;
    departamento: string;
  };
}

/**
 * @typedef {Object} TransaccionCreateRequest
 * Datos necesarios para crear una transacción
 */
export interface TransaccionCreateRequest {
  cliente_id: string;
  divisa_origen: number;
  divisa_destino: number;
  monto: number;
  detalle_metodo_id?: number;
  metodo_id?: number;
  tauser_id: string;
  terminos_aceptados: boolean;
}

/**
 * @typedef {Object} TransaccionResponse
 * Respuesta al crear una transacción
 */
export interface TransaccionResponse {
  id: string;
  estado: 'pendiente' | 'procesando' | 'completada' | 'cancelada';
  fecha_creacion: string;
  operacion_cliente: "compra" | "venta";
  operacion_casa: "compra" | "venta";
  divisa_origen: string;
  divisa_destino: string;
  monto_origen: number;
  monto_destino: number;
  tc_final: number;
  tauser: {
    id: string;
    nombre: string;
    direccion: string;
    ciudad: string;
    departamento: string;
  };
}

/**
 * Tipo para las etapas de la operación real
 */
export type EtapaOperacionReal = 1 | 2 | 3 | 4 | 5;