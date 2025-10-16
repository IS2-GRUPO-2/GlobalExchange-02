import axios from 'axios';
import {
  type NotificacionTasaUsuario,
  type NotificacionTasaCliente,
} from '../types/Notificacion';

const API_URL = '/api/notificaciones'

// Obtener token del localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

const normalizeNotificacionTasa = (data: any) => ({
  ...data,
  divisas_suscritas: Array.isArray(data.divisas_suscritas)
    ? data.divisas_suscritas
    : [],
  divisas_detalle: Array.isArray(data.divisas_detalle)
    ? data.divisas_detalle
    : [],
});

// ===================================================
// NOTIFICACIONES TASA DE USUARIO
// ===================================================

export const getNotificacionTasaUsuario = async (): Promise<NotificacionTasaUsuario> => {
  const response = await axios.get(
    `${API_URL}/tasa/usuario/`,
    getAuthHeader()
  );
  return normalizeNotificacionTasa(response.data);
};

export const updateNotificacionTasaUsuario = async (
  data: Partial<NotificacionTasaUsuario>
): Promise<NotificacionTasaUsuario> => {
  const response = await axios.patch(
    `${API_URL}/tasa/usuario/`,
    data,
    getAuthHeader()
  );
  return normalizeNotificacionTasa(response.data);
};

// ===================================================
// NOTIFICACIONES TASA DE CLIENTE
// ===================================================

export const getNotificacionTasaCliente = async (): Promise<NotificacionTasaCliente> => {
  const response = await axios.get(
    `${API_URL}/tasa/cliente/`,
    getAuthHeader()
  );
  return normalizeNotificacionTasa(response.data);
};

export const updateNotificacionTasaCliente = async (
  data: Partial<NotificacionTasaCliente>
): Promise<NotificacionTasaCliente> => {
  const response = await axios.patch(
    `${API_URL}/tasa/cliente/`,
    data,
    getAuthHeader()
  );
  return normalizeNotificacionTasa(response.data);
};