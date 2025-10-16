/**
 * Formatea un número al estilo español: 1.000.000,45
 * @param num - Número a formatear
 * @param decimales - Cantidad de decimales a mostrar (por defecto 2)
 * @returns String formateado con punto para miles y coma para decimales
 */
export const formatNumber = (num: number, decimales: number = 2): string => {
  // Intentar primero con toLocaleString
  const formatted = num.toLocaleString('es-ES', { 
    minimumFractionDigits: decimales, 
    maximumFractionDigits: decimales 
  });
  
  // Si toLocaleString no funciona correctamente (solo muestra coma sin puntos)
  // usar formateo manual
  if (!formatted.includes('.') && Math.abs(num) >= 1000) {
    // Formateo manual para garantizar puntos de miles
    const parts = num.toFixed(decimales).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decimalPart = parts[1];
    return `${integerPart},${decimalPart}`;
  }
  
  return formatted;
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
