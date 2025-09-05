import axios from "axios";
import { type UserProfileToken } from "../types/User";

// Usamos rutas relativas para que las peticiones pasen por el proxy de Nginx
const api = "/api";

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

export const registerAPI = async (
  username: string,
  email: string,
  first_name: string,
  password: string
) => {
  try {
    const data = await axios.post<UserProfileToken>(api + "/auth/register/", {
      username: username,
      email: email,
      first_name: first_name,
      password: password,
    });

    return data;
  } catch (err) {
    console.log("Error en el endpoint de registro: " + err);
  }
};

export const verifyEmailAPI = async (email: string, code: string) => {
  try {
    const data = await axios.post(api + "/auth/verify-email/", {
      email: email,
      code: code,
    });

    return data;
  } catch (err) {
    console.log("Error en el endpoint de verificacion" + err);
  }
};
