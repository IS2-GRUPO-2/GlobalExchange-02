/**
 * Funciones de utilidad para el manejo de fechas y horas
 */

/**
 * Formatea una fecha en el formato localizado para español
 * @param date - La fecha a formatear
 * @returns La fecha formateada como string (ejemplo: "12 DE OCTUBRE DE 2025")
 */
export const formatDate = (date: Date): string => {
  return date
    .toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
};

/**
 * Formatea la hora en el formato localizado para español
 * @param date - La fecha de la que se extraerá la hora
 * @returns La hora formateada como string (ejemplo: "14:30 H")
 */
export const formatTime = (date: Date): string => {
  return `${date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  })} H`;
};

/**
 * Devuelve la fecha y hora actual formateada
 * @param date - La fecha a formatear
 * @returns Objeto con fecha y hora formateadas
 */
export const getFormattedDateTime = (date: Date = new Date()) => {
  return {
    formattedDate: formatDate(date),
    formattedTime: formatTime(date),
  };
};
