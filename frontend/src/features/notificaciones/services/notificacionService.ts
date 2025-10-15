import axios from 'axios';
import {
  type PreferenciaNotificacionUsuario,
  type PreferenciaNotificacionCliente,
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

const normalizePreferencias = (data: any) => ({
  ...data,
  divisas_suscritas: Array.isArray(data.divisas_suscritas)
    ? data.divisas_suscritas
    : [],
  divisas_detalle: Array.isArray(data.divisas_detalle)
    ? data.divisas_detalle
    : [],
});

// ===================================================
// PREFERENCIAS DE USUARIO
// ===================================================

export const getPreferenciasUsuario = async (): Promise<PreferenciaNotificacionUsuario> => {
  const response = await axios.get(
    `${API_URL}/preferencias/usuario/`,
    getAuthHeader()
  );
  return normalizePreferencias(response.data);
};

export const updatePreferenciasUsuario = async (
  data: Partial<PreferenciaNotificacionUsuario>
): Promise<PreferenciaNotificacionUsuario> => {
  const response = await axios.patch(
    `${API_URL}/preferencias/usuario/`,
    data,
    getAuthHeader()
  );
  return normalizePreferencias(response.data);
};

// ===================================================
// PREFERENCIAS DE CLIENTE
// ===================================================

export const getPreferenciasCliente = async (): Promise<PreferenciaNotificacionCliente> => {
  const response = await axios.get(
    `${API_URL}/preferencias/cliente/`,
    getAuthHeader()
  );
  return normalizePreferencias(response.data);
};

export const updatePreferenciasCliente = async (
  data: Partial<PreferenciaNotificacionCliente>
): Promise<PreferenciaNotificacionCliente> => {
  const response = await axios.patch(
    `${API_URL}/preferencias/cliente/`,
    data,
    getAuthHeader()
  );
  return normalizePreferencias(response.data);
};