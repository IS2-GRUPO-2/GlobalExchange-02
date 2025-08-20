import axios from "axios";
import { type UserProfileToken } from "../types/User";

const api = "http://localhost:8000/api";

export const loginAPI = async (username: string, password: string) => {
  try {
    const data = await axios.post<UserProfileToken>(api + "/token/", {
      username: username,
      password: password,
    });

    return data;
  } catch (err) {
    console.log("error en peticion para inicio de sesion " + err);
  }
};

export const refreshTokenAPI = async (refresh_token: string) => {
  try {
    const data = await axios.post<UserProfileToken>(api + "/token/refresh/", {
      refresh: refresh_token,
    });

    return data;
  } catch (err) {
    console.log("error al refrescar token" + err);
  }
};
