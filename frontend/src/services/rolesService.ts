import axios from "axios";
import type { Role } from "../types/Role";
import type { Permission } from "../types/Permission";

const ROLES_API = "/api/roles/";
const PERMISOS_API = "/api/permisos/";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  };
};

export const getRoles = (search?: string) => {
  const q = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  return axios.get<Role[]>(ROLES_API + q, getAuthHeaders());
};

export const getRole = (id: number) =>
  axios.get<Role>(`${ROLES_API}${id}/`, getAuthHeaders());

export const createRole = (data: Omit<Role, "id">) =>
  axios.post<Role>(ROLES_API, data, getAuthHeaders());

export const updateRole = (id: number, data: Partial<Omit<Role, "id">>) =>
  axios.put<Role>(`${ROLES_API}${id}/`, data, getAuthHeaders());

export const deleteRole = (id: number) =>
  axios.delete<void>(`${ROLES_API}${id}/`, getAuthHeaders());

export const getPermissions = () =>
  axios.get<Permission[]>(PERMISOS_API, getAuthHeaders());
