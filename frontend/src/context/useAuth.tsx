import React from "react";
import type { User, DecodedToken } from "../types/User";
import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  loginAPI,
  refreshTokenAPI,
  registerAPI,
} from "../services/authService";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { getUsuario } from "../services/usuarioService";

type UserContextType = {
  user: User | null;
  token: string | null;
  refresh: string | null;
  loginUser: (username: string, password: string) => void;
  registerUser: (
    username: string,
    email: string,
    first_name: string,
    password: string
  ) => Promise<boolean>;
  logout: () => void;
  isLoggedIn: () => boolean;
};

type Props = { children: React.ReactNode };

const UserContext = createContext<UserContextType>({} as UserContextType);

export const UserProvider = ({ children }: Props) => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refreshToken = async () => {
    if (!refresh) return null;
    try {
      const res = await refreshTokenAPI(refresh);
      localStorage.setItem("token", res!.data.access); // store it
      setToken(res!.data.access); // update state
      axios.defaults.headers.common["Authorization"] = `Bearer ${
        res!.data.access
      }`; // update axios
      return res!.data.access; // return it for immediate use
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const refresh = localStorage.getItem("refresh");

    if (user && token && refresh) {
      setUser(JSON.parse(user));
      setToken(token);
      setRefresh(refresh);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401) {
          if (originalRequest.url.includes("/refresh")) {
            logout();
            return Promise.reject(error);
          }
          const newToken = await refreshToken();
          if (newToken) {
            error.config.headers["Authorization"] = `Bearer ${newToken}`;
            return axios(error.config); // retry the failed request
          }
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [refresh]);

  const loginUser = async (username: string, password: string) => {
    await loginAPI(username, password)
      .then(async (res) => {
        if (res) {
          localStorage.setItem("token", res?.data.access);
          localStorage.setItem("refresh", res?.data.refresh);
          const userObj = jwtDecode<DecodedToken>(res?.data.access);
          const headers = {
            headers: {
              Authorization: `Bearer ${res?.data.access}`,
            },
          };
          const user = await getUsuario(userObj.user_id, headers);

          console.log(userObj);
          localStorage.setItem("user", JSON.stringify(user.data));
          setToken(res?.data.access!);
          setRefresh(res?.data.refresh!);
          setUser(user.data);
          navigate("/");
        }
      })
      .catch((e) => console.log("error en useAuth" + e));
  };

  const registerUser = async (
    username: string,
    email: string,
    first_name: string,
    password: string
  ): Promise<boolean> => {
    let success = false;
    const res = await registerAPI(username, email, first_name, password);
    if (res) {
      success = true;
      console.log(res);
    }

    return success;
  };

  const isLoggedIn = () => {
    console.log("datos usuario: " + user);
    console.log("User logged in: " + !!user);
    return !!user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refresh");
    setUser(null);
    setToken("");
    setRefresh("");
    navigate("/login");
  };

  return (
    <UserContext.Provider
      value={{
        loginUser,
        registerUser,
        user,
        token,
        refresh,
        logout,
        isLoggedIn,
      }}
    >
      {isReady ? children : null}
    </UserContext.Provider>
  );
};

export const useAuth = () => React.useContext(UserContext);
