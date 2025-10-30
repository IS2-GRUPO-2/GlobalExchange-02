import type { LimiteDivisaFormData } from "../types/Limite";
import type { Denominacion, Divisa, PaginatedDivisas } from "../types/Divisa";
import axios from "axios";
const API_URL = "/api/divisas/";

interface GetDivisasParams {
  page?: number;
  search?: string;
  es_base?: boolean;
}

export const getDivisas = async (
  params: GetDivisasParams = {}
): Promise<PaginatedDivisas> => {
  try {
    const res = await axios.get<PaginatedDivisas>(API_URL, {
      params: {
        ...params,
        es_base: params.es_base !== undefined ? params.es_base : undefined,
      },
    });
    return res.data;
  } catch (err: any) {
    console.error("Error fetching divisas: ", err.res?.data || err.message);
    throw err;
  }
};

export const getDivisa = async (divisa_id: number): Promise<Divisa> => {
  try {
    const res = await axios.get<Divisa>(`${API_URL}${divisa_id}/`);
    return res.data;
  } catch (err: any) {
    console.error("Error fetching divisas: ", err);
    throw err;
  }
};

export const getDenominacionesOfDivisa = async (
  divisa_id: number
): Promise<Denominacion[]> => {
  try {
    const res = await axios.get<Denominacion[]>(
      `${API_URL}${divisa_id}/get_denominaciones/`
    );
    return res.data;
  } catch (err) {
    console.log("Error obteniendo denominaciones");
    throw err;
  }
};

export const createDivisa = async (divisaData: Divisa) => {
  try {
    const res = await axios.post<Divisa>(API_URL, divisaData);
    return res;
  } catch (err) {
    console.error("Error creating divisa: ", err);
    throw err;
  }
};

export const updateDivisa = async (divisaData: Divisa, divisa_id: number) => {
  try {
    const res = await axios.put<Divisa>(`${API_URL}${divisa_id}/`, divisaData);
    return res;
  } catch (err) {
    console.error("Error updating divisa: ", err);
    throw err;
  }
};

export const partialUpdateDivisa = async (
  divisaData: Partial<Divisa>,
  divisa_id: number
) => {
  try {
    const res = await axios.patch<Divisa>(
      `${API_URL}${divisa_id}/`,
      divisaData
    );
    return res;
  } catch (err) {
    console.error("Error updating divisa: ", err);
    throw err;
  }
};

export const deactivateDivisa = async (divisa_id: number) => {
  try {
    const res = await axios.delete<Divisa>(`${API_URL}${divisa_id}/`);
    return res;
  } catch (err) {
    console.error("Error deactivating divisa: ", err);
    throw err;
  }
};

export const createDenominacion = async (
  denominacion: number,
  divisa_id: number
) => {
  try {
    const res = await axios.post<Denominacion>(`/api/denominaciones/`, {
      denominacion: denominacion,
      divisa: divisa_id,
    });
    return res;
  } catch (err) {
    console.log("Error creando denominacion");
    throw err;
  }
};

export const deactivateDenominacion = async (denominacion_id: number) => {
  try {
    const res = await axios.delete<Denominacion>(
      `/api/denominaciones/${denominacion_id}/`
    );
    return res;
  } catch (err) {
    console.log("Error desactivando denominacion con id " + denominacion_id);
    throw err;
  }
};

export const updateDenominacion = async (
  denominacionData: Denominacion,
  denominacion_id: number
) => {
  try {
    const res = await axios.put<Denominacion>(
      `/api/denominaciones/${denominacion_id}/`,
      denominacionData
    );
    return res;
  } catch (err) {
    console.error("Error updating denominacion: ", err);
    throw err;
  }
};

export const getDivisasSinTasa = async (
  params: { page?: number; search?: string } = {}
) => {
  const res = await axios.get<PaginatedDivisas>("/api/divisas/sin_tasa/", {
    params,
  });
  return res.data;
};

export const getDivisasConTasa = async (
  params: { page?: number; search?: string } = {}
) => {
  const res = await axios.get<PaginatedDivisas>("/api/divisas/con_tasa/", {
    params,
  });
  return res.data;
};

export const getLimiteConfig = async () => {
  try {
    const res = await axios.get<LimiteDivisaFormData>("/api/limite-config/");
    return res.data;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const updateLimiteConfig = async (limite: LimiteDivisaFormData) => {
  try {
    const res = await axios.put<LimiteDivisaFormData>("/api/limite-config/", {
      limite_diario: limite.limite_diario,
      limite_mensual: limite.limite_mensual,
    });
    return res;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const validarDenominaciones = async (
  divisa_id: number,
  monto: number
): Promise<{ puede_acumular: boolean; divisa_id: number; monto: number }> => {
  try {
    const res = await axios.get(
      `${API_URL}${divisa_id}/validar_denominaciones/`,
      {
        params: { monto },
      }
    );
    return res.data;
  } catch (err) {
    console.error("Error validando denominaciones: ", err);
    throw err;
  }
};
