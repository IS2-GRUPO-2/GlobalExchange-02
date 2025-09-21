/**
 * @fileoverview Tipos de datos para clientes y categorías de clientes
 */

/**
 * @typedef {Object} Cliente
 * @property {string} idCliente - ID único del cliente
 * @property {string} nombre - Nombre completo del cliente
 * @property {boolean} isPersonaFisica - Indica si es persona física (true) o jurídica (false)
 * @property {string} idCategoria - ID de la categoría del cliente
 * @property {CategoriaCliente} [categoria] - Objeto de categoría del cliente (opcional)
 * @property {string} [cedula] - Cédula de identidad (para personas físicas)
 * @property {string} correo - Correo electrónico del cliente
 * @property {string} telefono - Número de teléfono
 * @property {string} direccion - Dirección física del cliente
 * @property {boolean} isActive - Estado activo/inactivo del cliente
 * @property {string} [ruc] - RUC (para personas jurídicas)
 */
export type Cliente = {
  idCliente: string;
  nombre: string;
  isPersonaFisica: boolean;
  idCategoria: string;
  categoria?: CategoriaCliente;
  cedula?: string;
  correo: string;
  telefono: string;
  direccion: string;
  isActive: boolean;
  ruc?: string;
};

/**
 * @typedef {Object} CategoriaCliente
 * @property {string} idCategoria - ID único de la categoría
 * @property {string} nombre - Nombre de la categoría
 * @property {string} descripcion - Descripción de la categoría
 * @property {number} descuento - Porcentaje de descuento aplicable (0-100)
 */
export type CategoriaCliente = {
  idCategoria: string;
  nombre: string;
  descripcion: string;
  descuento: number;
};

export type PaginatedCliente = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Cliente[];
};
