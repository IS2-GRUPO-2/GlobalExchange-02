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

export const LIMITES_DIVISA_CONFIG = {
  CHANGE: "divisas.change_limiteconfig",
  VIEW: "divisas.view_limiteconfig",
};

export const BANCOS = {
  ADD: "financiero.add_banco",
  CHANGE: "financiero.change_banco",
  DELETE: "financiero.delete_banco",
  VIEW: "financiero.view_banco",
} as const;

export const BILLETERAS_DIGITALES = {
  ADD: "financiero.add_billeteradigital",
  CHANGE: "financiero.change_billeteradigital",
  DELETE: "financiero.delete_billeteradigital",
  VIEW: "financiero.view_billeteradigital",
} as const;

export const BILLETERAS_DIGITALES_CATALOGO = {
  ADD: "financiero.add_billeteradigitalcatalogo",
  CHANGE: "financiero.change_billeteradigitalcatalogo",
  DELETE: "financiero.delete_billeteradigitalcatalogo",
  VIEW: "financiero.view_billeteradigitalcatalogo",
} as const;

export const CHEQUES = {
  ADD: "financiero.add_cheque",
  CHANGE: "financiero.change_cheque",
  DELETE: "financiero.delete_cheque",
  VIEW: "financiero.view_cheque",
} as const;

export const CUENTAS_BANCARIAS = {
  ADD: "financiero.add_cuentabancaria",
  CHANGE: "financiero.change_cuentabancaria",
  DELETE: "financiero.delete_cuentabancaria",
  VIEW: "financiero.view_cuentabancaria",
} as const;

export const METODOS_FINANCIEROS = {
  ADD: "financiero.add_metodofinanciero",
  CHANGE: "financiero.change_metodofinanciero",
  DELETE: "financiero.delete_metodofinanciero",
  VIEW: "financiero.view_metodofinanciero",
} as const;

export const METODOS_FINANCIEROS_DETALLE = {
  ADD: "financiero.add_metodofinancierodetalle",
  CHANGE: "financiero.change_metodofinancierodetalle",
  DELETE: "financiero.delete_metodofinancierodetalle",
  VIEW: "financiero.view_metodofinancierodetalle",
} as const;

export const TARJETAS = {
  ADD: "financiero.add_tarjeta",
  CHANGE: "financiero.change_tarjeta",
  DELETE: "financiero.delete_tarjeta",
  VIEW: "financiero.view_tarjeta",
} as const;

export const TARJETAS_CATALOGO = {
  ADD: "financiero.add_tarjetacatalogo",
  CHANGE: "financiero.change_tarjetacatalogo",
  DELETE: "financiero.delete_tarjetacatalogo",
  VIEW: "financiero.view_tarjetacatalogo",
} as const;


export const TAUSER = {
  ADD: "tauser.add_tauser",
  CHANGE: "tauser.change_tauser",
  DELETE: "tauser.delete_tauser",
  VIEW: "tauser.view_tauser",
} as const;

export const TRANSACCIONES = {
  ADD: "operaciones.add_transaccion",
  CHANGE: "operaciones.change_transaccion",
  DELETE: "operaciones.delete_transaccion",
  VIEW: "operaciones.view_transaccion",
} as const;

export const OPERACION = {
  USE: "operaciones.can_use_operacion",
} as const;