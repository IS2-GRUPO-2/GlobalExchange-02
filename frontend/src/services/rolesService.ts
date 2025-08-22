import { api } from "./api";
import type { Role } from "../types/Role";
import type { Permission } from "../types/Permission";

export const RolesService = {
  list: () => api.get<Role[]>("/roles/"),
  get: (id: number) => api.get<Role>(`/roles/${id}/`),
  create: (payload: Omit<Role, "id">) => api.post<Role>("/roles/", payload),
  update: (id: number, payload: Partial<Omit<Role, "id">>) =>
    api.patch<Role>(`/roles/${id}/`, payload),
  remove: (id: number) => api.del<void>(`/roles/${id}/`),
};

export const PermisosService = {
  list: () => api.get<Permission[]>("/permisos/"),
};
