
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

export const DIVISAS = {
  ADD: "divisas.add_divisa",
  CHANGE: "divisas.change_divisa",
  DELETE: "divisas.delete_divisa",
  VIEW: "divisas.view_divisa",
} as const;

export const METODOS_FINANCIEROS = {
  ADD: "metodos_financieros.add_metodofinanciero",
  CHANGE: "metodos_financieros.change_metodofinanciero",
  DELETE: "metodos_financieros.delete_metodofinanciero",
  VIEW: "metodos_financieros.view_metodofinanciero",
} as const;

export const CONFIGURACIONES = {
  ADD: "configuraciones.add_configuracion",
  CHANGE: "configuraciones.change_configuracion",
  DELETE: "configuraciones.delete_configuracion",
  VIEW: "configuraciones.view_configuracion",
} as const;