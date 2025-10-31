import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { jwtDecode } from "jwt-decode";
import type { User, DecodedToken } from "../../usuario/types/User";
import {
  loginAPI,
  refreshTokenAPI,
  verifyMfaLoginAPI,
} from "../../../services/authService";
import {
  TAUSER_REFRESH_KEY,
  TAUSER_TOKEN_KEY,
  TAUSER_USER_KEY,
  clearTauserAuthToken,
  setTauserAuthToken,
  tauserApi,
} from "../services/tauserApi";

type TauserAuthContextValue = {
  user: User | null;
  token: string | null;
  refresh: string | null;
  mfaRequired: boolean;
  tempToken: string | null;
  loginTauser: (username: string, password: string) => Promise<void>;
  verifyMfaTauser: (code: string) => Promise<void>;
  logoutTauser: () => void;
  isLoggedIn: () => boolean;
};

const TauserAuthContext = createContext<TauserAuthContextValue | undefined>(undefined);

const persistUser = (user: User | null) => {
  if (user) {
    sessionStorage.setItem(TAUSER_USER_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(TAUSER_USER_KEY);
  }
};

export const TauserAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const logoutTauser = useCallback(() => {
    sessionStorage.removeItem(TAUSER_TOKEN_KEY);
    sessionStorage.removeItem(TAUSER_REFRESH_KEY);
    persistUser(null);
    clearTauserAuthToken();
    setToken(null);
    setRefresh(null);
    setUser(null);
    setMfaRequired(false);
    setTempToken(null);
  }, []);

  const fetchUserProfile = useCallback(async (accessToken: string) => {
    try {
      const decoded = jwtDecode<DecodedToken>(accessToken);
      const userId = Number(decoded.user_id);
      const res = await tauserApi.get<User>(`/usuarios/${userId}/`);
      setUser(res.data);
      persistUser(res.data);
      return res.data;
    } catch (error) {
      logoutTauser();
      throw error;
    }
  }, [logoutTauser]);

  const storeSession = useCallback(async (access: string, refreshToken: string) => {
    sessionStorage.setItem(TAUSER_TOKEN_KEY, access);
    sessionStorage.setItem(TAUSER_REFRESH_KEY, refreshToken);
    setTauserAuthToken(access);
    setToken(access);
    setRefresh(refreshToken);
    await fetchUserProfile(access);
  }, [fetchUserProfile]);

  const loginTauser = useCallback(async (username: string, password: string) => {
    try {
      const res = await loginAPI(username, password, "tauser");
      if (!res) {
        throw new Error("No se recibió respuesta del servidor");
      }

      if (res.data.mfa_required) {
        setMfaRequired(true);
        setTempToken(res.data.temp_token ?? null);
        return;
      }

      if (res.data.access && res.data.refresh) {
        await storeSession(res.data.access, res.data.refresh);
        setMfaRequired(false);
        setTempToken(null);
        return;
      }

      throw new Error("Respuesta de autenticación inválida");
    } catch (error) {
      setMfaRequired(false);
      setTempToken(null);
      throw error;
    }
  }, [storeSession]);

  const verifyMfaTauser = useCallback(async (code: string) => {
    if (!tempToken) {
      throw new Error("Sesión expirada. Inicie nuevamente.");
    }

    try {
      const res = await verifyMfaLoginAPI(tempToken, code);
      if (!res || !res.data.access || !res.data.refresh) {
        throw new Error("Respuesta de verificación inválida");
      }

      await storeSession(res.data.access, res.data.refresh);
      setMfaRequired(false);
      setTempToken(null);
    } catch (error) {
      throw error;
    }
  }, [storeSession, tempToken]);

  const refreshAccessToken = useCallback(async () => {
    if (!refresh) {
      return null;
    }

    try {
      const res = await refreshTokenAPI(refresh);
      if (!res || !res.data.access || !res.data.refresh) {
        throw new Error("No se pudo refrescar el token");
      }

      sessionStorage.setItem(TAUSER_TOKEN_KEY, res.data.access);
      sessionStorage.setItem(TAUSER_REFRESH_KEY, res.data.refresh);
      setTauserAuthToken(res.data.access);
      setToken(res.data.access);
      setRefresh(res.data.refresh);
      return res.data.access;
    } catch (error) {
      logoutTauser();
      return null;
    }
  }, [logoutTauser, refresh]);

  useEffect(() => {
    const storedToken = sessionStorage.getItem(TAUSER_TOKEN_KEY);
    const storedRefresh = sessionStorage.getItem(TAUSER_REFRESH_KEY);
    const storedUser = sessionStorage.getItem(TAUSER_USER_KEY);

    if (storedToken && storedRefresh) {
      setTauserAuthToken(storedToken);
      setToken(storedToken);
      setRefresh(storedRefresh);

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser) as User;
          setUser(parsed);
        } catch {
          persistUser(null);
        }
      } else {
        fetchUserProfile(storedToken).catch(() => {
          logoutTauser();
        });
      }
    }

    setReady(true);
  }, [fetchUserProfile, logoutTauser]);

  useEffect(() => {
    const interceptor = tauserApi.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error.response?.status;
        const originalRequest = error.config;

        if (status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const newToken = await refreshAccessToken();

          if (newToken) {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${newToken}`,
            };
            return tauserApi(originalRequest);
          }
        }

        if (status === 401) {
          logoutTauser();
        }

        return Promise.reject(error);
      },
    );

    return () => {
      tauserApi.interceptors.response.eject(interceptor);
    };
  }, [logoutTauser, refreshAccessToken]);

  const value = useMemo<TauserAuthContextValue>(() => ({
    user,
    token,
    refresh,
    mfaRequired,
    tempToken,
    loginTauser,
    verifyMfaTauser,
    logoutTauser,
    isLoggedIn: () => Boolean(token && user),
  }), [loginTauser, logoutTauser, mfaRequired, refresh, tempToken, token, user, verifyMfaTauser]);

  if (!ready) {
    return null;
  }

  return (
    <TauserAuthContext.Provider value={value}>
      {children}
    </TauserAuthContext.Provider>
  );
};

export const useTauserAuth = () => {
  const context = useContext(TauserAuthContext);
  if (!context) {
    throw new Error("useTauserAuth debe usarse dentro de un TauserAuthProvider");
  }
  return context;
};
