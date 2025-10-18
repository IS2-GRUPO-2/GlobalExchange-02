/**
 * @fileoverview Tipos de datos para clientes y categorías de clientes
 */

/**
 * @typedef {Object} Cliente
 * @property {string} id - ID único del cliente
 * @property {string} nombre - Nombre completo del cliente
 * @property {boolean} is_persona_fisica - Indica si es persona física (true) o jurídica (false)
 * @property {string} id_categoria - ID de la categoría del cliente
 * @property {CategoriaCliente} [categoria] - Objeto de categoría del cliente (opcional)
 * @property {string} [cedula] - Cédula de identidad (para personas físicas)
 * @property {string} correo - Correo electrónico del cliente
 * @property {string} telefono - Número de teléfono
 * @property {string} direccion - Dirección física del cliente
 * @property {boolean} is_active - Estado activo/inactivo del cliente
 * @property {string} [ruc] - RUC (para personas jurídicas)
 */
export type Cliente = {
  id: string;
  nombre: string;
  is_persona_fisica: boolean;
  id_categoria: string;
  categoria?: CategoriaCliente;
  cedula?: string;
  correo: string;
  telefono: string;
  direccion: string;
  is_active: boolean;
  ruc?: string;
  gasto_diario: string;
  gasto_mensual: string;
};

/**
 * @typedef {Object} CategoriaCliente
 * @property {string} id - ID único de la categoría
 * @property {string} nombre - Nombre de la categoría
 * @property {string} descripcion - Descripción de la categoría
 * @property {number} descuento - Porcentaje de descuento aplicable (0-100)
 * @property {boolean} is_active - Estado activo/inactivo de la categoría
 */
export type CategoriaCliente = {
  id: string;
  nombre: string;
  descripcion: string;
  descuento: number;
  is_active: boolean;
};

export type PaginatedCliente = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Cliente[];
};
