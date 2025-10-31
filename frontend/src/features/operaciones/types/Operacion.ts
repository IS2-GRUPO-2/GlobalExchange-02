/**
 * @fileoverview Tipos de datos para simulaciones de operaciones.
 */


/**
 * @typedef {Object} CalcularOperacionResponse
 * @property {"compra"|"venta"} op_perspectiva_casa - Tipo de operación desde perspectiva de la casa de cambio
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
export type CalcularOperacionResponse = {
  op_perspectiva_casa: "compra" | "venta";
  divisa_origen: string;
  divisa_destino: string;
  parametros: {
    nombre_categoria?: string | null;
    descuento_categoria?: number | null;
    nombre_metodo: string;
    comision_metodo?: number;
  };
  tc_final: number;
  monto_origen: number;
  monto_destino: number;
};


export interface OperacionRequest {
  cliente_id?: string;
  divisa_origen: number;
  divisa_destino: number;
  monto: number;
  op_perspectiva_casa: "compra" | "venta";
  detalle_metodo_id?: number;
  metodo_id?: number;
}