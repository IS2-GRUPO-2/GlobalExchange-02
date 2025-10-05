/**
 * Formatea un número al estilo español: 1.000.000,45
 * @param num - Número a formatear
 * @param decimales - Cantidad de decimales a mostrar (por defecto 2)
 * @returns String formateado con punto para miles y coma para decimales
 */
export const formatNumber = (num: number, decimales: number = 2): string => {
  return num.toLocaleString('es-ES', { 
    minimumFractionDigits: decimales, 
    maximumFractionDigits: decimales 
  });
};
