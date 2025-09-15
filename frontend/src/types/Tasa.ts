/**
 * @fileoverview Tipos de datos para tasas de cambio y cotizaciones
 */

/**
 * @typedef {Object} Tasa
 * @property {number} id - ID único de la tasa
 * @property {number} [divisa] - ID de la divisa asociada
 * @property {string} precioBase - Precio base de la divisa como string
 * @property {string} comisionBaseCompra - Comisión base para operaciones de compra
 * @property {string} comisionBaseVenta - Comisión base para operaciones de venta
 * @property {boolean} activo - Estado activo/inactivo de la tasa
 * @property {string|number} [tasaCompra] - Tasa calculada para compra
 * @property {string|number} [tasaVenta] - Tasa calculada para venta
 * @property {string} [fechaCreacion] - Fecha de creación de la tasa
 * @property {string} [fechaActualizacion] - Fecha de última actualización
 */
export interface Tasa {
  id?: number;
  divisa?: number;
  precioBase: string;
  comisionBaseCompra: string;
  comisionBaseVenta: string;
  activo: boolean;
  tasaCompra?: string | number;
  tasaVenta?: string | number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export type TasaCreate = Omit<Tasa, 'id'> & { divisa: number };
