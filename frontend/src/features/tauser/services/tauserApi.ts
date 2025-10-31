import axios from "axios";

export const tauserApi = axios.create({
  baseURL: "/api",
});

export const TAUSER_TOKEN_KEY = "tauser_token";
export const TAUSER_REFRESH_KEY = "tauser_refresh";
export const TAUSER_USER_KEY = "tauser_user";

export const setTauserAuthToken = (token: string) => {
  tauserApi.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const clearTauserAuthToken = () => {
  delete tauserApi.defaults.headers.common.Authorization;
};
