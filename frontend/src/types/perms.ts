export const CLIENTES = {
  ADD: "clientes.add_cliente",
  CHANGE: "clientes.change_cliente",
  DELETE: "clientes.delete_cliente",
  VIEW: "clientes.view_cliente",
} as const;

export const USUARIOS = {
  ADD: "usuarios.add_user",
  CHANGE: "usuarios.change_user",
  DELETE: "usuarios.delete_user",
  VIEW: "usuarios.view_user",
  ASSIGN_CLIENTS: "usuarios.can_assign_clients",
  ASSIGN_ROLES: "usuarios.can_assign_roles",
} as const;

export const ROLES = {
  ADD: "auth.add_group",
  CHANGE: "auth.change_group",
  DELETE: "auth.delete_group",
  VIEW: "auth.view_group",
} as const;

export const PERMISOS = {
  ADD: "auth.add_permission",
  CHANGE: "auth.change_permission",
  DELETE: "auth.delete_permission",
  VIEW: "auth.view_permission",
} as const;

export const CATEGORIAS_CLIENTE = {
  ADD: "clientes.add_categoriacliente",
  CHANGE: "clientes.change_categoriacliente",
  DELETE: "clientes.delete_categoriacliente",
  VIEW: "clientes.view_categoriacliente",
} as const;

export const TASAS = {
  ADD: "cotizaciones.add_tasa",
  CHANGE: "cotizaciones.change_tasa",
  DELETE: "cotizaciones.delete_tasa",
  VIEW: "cotizaciones.view_tasa",
} as const;

export const DENOMINACIONES = {
  ADD: "divisas.add_denominacion",
  CHANGE: "divisas.change_denominacion",
  DELETE: "divisas.delete_denominacion",
  VIEW: "divisas.view_denominacion",
} as const;

export const DIVISAS = {
  ADD: "divisas.add_divisa",
  CHANGE: "divisas.change_divisa",
  DELETE: "divisas.delete_divisa",
  VIEW: "divisas.view_divisa",
} as const;

export const BANCOS = {
  ADD: "operaciones.add_banco",
  CHANGE: "operaciones.change_banco",
  DELETE: "operaciones.delete_banco",
  VIEW: "operaciones.view_banco",
} as const;

export const BILLETERAS_DIGITALES = {
  ADD: "operaciones.add_billeteradigital",
  CHANGE: "operaciones.change_billeteradigital",
  DELETE: "operaciones.delete_billeteradigital",
  VIEW: "operaciones.view_billeteradigital",
} as const;

export const BILLETERAS_DIGITALES_CATALOGO = {
  ADD: "operaciones.add_billeteradigitalcatalogo",
  CHANGE: "operaciones.change_billeteradigitalcatalogo",
  DELETE: "operaciones.delete_billeteradigitalcatalogo",
  VIEW: "operaciones.view_billeteradigitalcatalogo",
} as const;

export const CHEQUES = {
  ADD: "operaciones.add_cheque",
  CHANGE: "operaciones.change_cheque",
  DELETE: "operaciones.delete_cheque",
  VIEW: "operaciones.view_cheque",
} as const;

export const CUENTAS_BANCARIAS = {
  ADD: "operaciones.add_cuentabancaria",
  CHANGE: "operaciones.change_cuentabancaria",
  DELETE: "operaciones.delete_cuentabancaria",
  VIEW: "operaciones.view_cuentabancaria",
} as const;

export const METODOS_FINANCIEROS = {
  ADD: "operaciones.add_metodofinanciero",
  CHANGE: "operaciones.change_metodofinanciero",
  DELETE: "operaciones.delete_metodofinanciero",
  VIEW: "operaciones.view_metodofinanciero",
} as const;

export const METODOS_FINANCIEROS_DETALLE = {
  ADD: "operaciones.add_metodofinancierodetalle",
  CHANGE: "operaciones.change_metodofinancierodetalle",
  DELETE: "operaciones.delete_metodofinancierodetalle",
  VIEW: "operaciones.view_metodofinancierodetalle",
} as const;

export const TARJETAS = {
  ADD: "operaciones.add_tarjeta",
  CHANGE: "operaciones.change_tarjeta",
  DELETE: "operaciones.delete_tarjeta",
  VIEW: "operaciones.view_tarjeta",
} as const;

export const SIMULACION = {
  USE: "operaciones.can_use_simulacion",
} as const;