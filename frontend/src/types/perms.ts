
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