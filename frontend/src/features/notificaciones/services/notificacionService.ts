import axios from 'axios';
import {
  type PreferenciaNotificacionUsuario,
  type PreferenciaNotificacionCliente,
} from '../types/Notificacion';

const API_URL = import.meta.env.VITE_API_URL;

// Obtener token del localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// ===================================================
// PREFERENCIAS DE USUARIO
// ===================================================

export const getPreferenciasUsuario = async (): Promise<PreferenciaNotificacionUsuario> => {
  const response = await axios.get(
    `${API_URL}/notificaciones/preferencias/usuario/`,
    getAuthHeader()
  );
  return response.data;
};

export const updatePreferenciasUsuario = async (
  data: Partial<PreferenciaNotificacionUsuario>
): Promise<PreferenciaNotificacionUsuario> => {
  const response = await axios.put(
    `${API_URL}/notificaciones/preferencias/usuario/`,
    data,
    getAuthHeader()
  );
  return response.data;
};

// ===================================================
// PREFERENCIAS DE CLIENTE
// ===================================================

export const getPreferenciasCliente = async (): Promise<PreferenciaNotificacionCliente> => {
  const response = await axios.get(
    `${API_URL}/notificaciones/preferencias/cliente/`,
    getAuthHeader()
  );
  return response.data;
};

export const updatePreferenciasCliente = async (
  data: Partial<PreferenciaNotificacionCliente>
): Promise<PreferenciaNotificacionCliente> => {
  const response = await axios.put(
    `${API_URL}/notificaciones/preferencias/cliente/`,
    data,
    getAuthHeader()
  );
  return response.data;
};