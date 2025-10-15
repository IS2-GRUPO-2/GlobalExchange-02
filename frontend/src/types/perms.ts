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
  ADD: "metodos_financieros.add_banco",
  CHANGE: "metodos_financieros.change_banco",
  DELETE: "metodos_financieros.delete_banco",
  VIEW: "metodos_financieros.view_banco",
} as const;

export const BILLETERAS_DIGITALES = {
  ADD: "metodos_financieros.add_billeteradigital",
  CHANGE: "metodos_financieros.change_billeteradigital",
  DELETE: "metodos_financieros.delete_billeteradigital",
  VIEW: "metodos_financieros.view_billeteradigital",
} as const;

export const BILLETERAS_DIGITALES_CATALOGO = {
  ADD: "metodos_financieros.add_billeteradigitalcatalogo",
  CHANGE: "metodos_financieros.change_billeteradigitalcatalogo",
  DELETE: "metodos_financieros.delete_billeteradigitalcatalogo",
  VIEW: "metodos_financieros.view_billeteradigitalcatalogo",
} as const;

export const CHEQUES = {
  ADD: "metodos_financieros.add_cheque",
  CHANGE: "metodos_financieros.change_cheque",
  DELETE: "metodos_financieros.delete_cheque",
  VIEW: "metodos_financieros.view_cheque",
} as const;

export const CUENTAS_BANCARIAS = {
  ADD: "metodos_financieros.add_cuentabancaria",
  CHANGE: "metodos_financieros.change_cuentabancaria",
  DELETE: "metodos_financieros.delete_cuentabancaria",
  VIEW: "metodos_financieros.view_cuentabancaria",
} as const;

export const METODOS_FINANCIEROS = {
  ADD: "metodos_financieros.add_metodofinanciero",
  CHANGE: "metodos_financieros.change_metodofinanciero",
  DELETE: "metodos_financieros.delete_metodofinanciero",
  VIEW: "metodos_financieros.view_metodofinanciero",
} as const;

export const METODOS_FINANCIEROS_DETALLE = {
  ADD: "metodos_financieros.add_metodofinancierodetalle",
  CHANGE: "metodos_financieros.change_metodofinancierodetalle",
  DELETE: "metodos_financieros.delete_metodofinancierodetalle",
  VIEW: "metodos_financieros.view_metodofinancierodetalle",
} as const;

export const TARJETAS = {
  ADD: "metodos_financieros.add_tarjeta",
  CHANGE: "metodos_financieros.change_tarjeta",
  DELETE: "metodos_financieros.delete_tarjeta",
  VIEW: "metodos_financieros.view_tarjeta",
} as const;

export const TARJETAS_CATALOGO = {
  ADD: "metodos_financieros.add_tarjetacatalogo",
  CHANGE: "metodos_financieros.change_tarjetacatalogo",
  DELETE: "metodos_financieros.delete_tarjetacatalogo",
  VIEW: "metodos_financieros.view_tarjetacatalogo",
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


export const NOTIFICACIONES = {
  VIEW: "notificaciones.view_preferencianotificacionusuario",
  CHANGE: "notificaciones.change_preferencianotificacionusuario",
  VIEW_CLIENTE: "notificaciones.view_preferencianotificacioncliente",
  CHANGE_CLIENTE: "notificaciones.change_preferencianotificacioncliente",
} as const;