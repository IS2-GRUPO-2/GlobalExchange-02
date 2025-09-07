import axios from "axios";

const API_URL = "/api/me/permissions/"; // endpoint backend que devuelve { perms: string[] }

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: token ? `Bearer ${token}` : "" } };
};

export const getMyPerms = () =>
  axios.get<{ perms: string[] }>(API_URL, getAuthHeaders());