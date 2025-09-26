/**
 * @fileoverview Tipos de datos para simulaciones de operaciones.
 */

import {type MetodoFinanciero} from '../features/financiero/types/MetodoFinanciero'

/**
 * @typedef {Object} SimulacionRequest
 * @property {string} cliente_id - ID del cliente que solicita la simulación
 * @property {number} divisa_origen - ID de la divisa de origen
 * @property {number} divisa_destino - ID de la divisa de destino
 * @property {number} monto - Monto a convertir
 * @property {number} metodo_id - ID del método financiero a utilizar
 */
export type SimulacionRequest = {
  cliente_id: string;
  divisa_origen: number;
  divisa_destino: number;
  monto: number;
  metodo_id: number;
};

/**
 * @typedef {Object} SimulacionResponse
 * @property {"compra"|"venta"} operacion_cliente - Tipo de operación desde perspectiva del cliente
 * @property {"compra"|"venta"} operacion_casa - Tipo de operación desde perspectiva de la casa de cambio
 * @property {string} divisa_origen - Código de la divisa de origen
 * @property {string} divisa_destino - Código de la divisa de destino
 * @property {Object} parametros - Parámetros utilizados en el cálculo
 * @property {string} [parametros.nombre_categoria] - Nombre de la categoría del cliente
 * @property {number} [parametros.descuento_categoria] - Descuento por categoría del cliente
 * @property {string} parametros.nombre_metodo - Nombre del método financiero utilizado
 * @property {number} [parametros.comision_metodo] - Comisión del método financiero
 * @property {number} tc_final - Tipo de cambio final aplicado
 * @property {number} monto_origen - Monto en divisa de origen
 * @property {number} monto_destino - Monto resultante en divisa de destino
 */
export type SimulacionResponse = {
  operacion_cliente: "compra" | "venta";
  operacion_casa: "compra" | "venta";
  divisa_origen: string;
  divisa_destino: string;
  parametros: {
    nombre_categoria?: string;
    descuento_categoria?: number;
    nombre_metodo: string;
    comision_metodo?: number;
  };
  tc_final: number;
  monto_origen: number;
  monto_destino: number;
};

/**
 * @typedef {Object} MetodosDisponiblesResponse
 * @property {"compra"|"venta"} operacion_casa - Tipo de operación de la casa de cambio
 * @property {MetodoFinanciero[]} metodos - Lista de métodos financieros disponibles
 */
export type MetodosDisponiblesResponse = {
  operacion_casa: "compra" | "venta";
  metodos: MetodoFinanciero[];
};

export interface SimulacionRequestConInstancia {
  cliente_id: string;
  divisa_origen: number;
  divisa_destino: number;
  monto: number;
  detalle_metodo_id?: number;
  metodo_id?: number;
}

export interface InstanciaMetodo {
  id: number;
  alias: string;
  tipo_especifico: 'cuenta_bancaria' | 'billetera_digital' | 'tarjeta' | 'tarjeta_local' | null;
  detalles: {
    [key: string]: any;
  };
}

export interface MetodoClienteOrganizado {
  metodo_financiero: {
    id: number;
    nombre: string;
    nombre_display: string;
    comision_cobro_porcentaje: number;
    comision_pago_porcentaje: number;
  };
  instancias: InstanciaMetodo[];
}

export interface MetodosClienteResponse {
  operacion_casa: 'compra' | 'venta';
  metodos: {
    [nombre_metodo: string]: MetodoClienteOrganizado;
  };
}