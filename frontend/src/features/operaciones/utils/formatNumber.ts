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

/**
 * Formatea un input de texto para mostrar el número con puntos como separadores de miles
 * pero SIN usar comas (solo puntos). Ejemplo: 1000000 → 1.000.000
 * @param value - String a formatear
 * @returns String formateado solo con puntos
 */
export const formatInputNumber = (value: string): string => {
  if (value === "") return "";

  // Sanitizar: mantener solo dígitos
  const sanitized = value.replace(/[^0-9]/g, "");
  
  if (sanitized === "") return "";

  // Formatear con puntos como separadores de miles
  const formatted = sanitized.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return formatted;
};

/**
 * Desformatea un input de texto eliminando los puntos separadores
 * para obtener el número puro. Ejemplo: 1.000.000 → 1000000
 * @param value - String formateado a desformatear
 * @returns String sin formato (solo dígitos)
 */
export const unformatInputNumber = (value: string): string => {
  if (value === "") return "";

  // Remover todos los puntos separadores
  const unformatted = value.replace(/\./g, "");

  return unformatted;
};
