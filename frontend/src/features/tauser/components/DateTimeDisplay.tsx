import { useState, useEffect } from "react";
import { getFormattedDateTime } from "../../../utils/date";

export default function DateTimeDisplay() {
  // Estado para la fecha y hora actuales
  const [fechaHora, setFechaHora] = useState(new Date());
  
  // Actualizar fecha y hora cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setFechaHora(new Date());
    }, 1000 * 60); // Actualizar cada minuto
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="absolute bottom-8 text-sm text-gray-600">
      {getFormattedDateTime(fechaHora).formattedDate},{" "}
      {getFormattedDateTime(fechaHora).formattedTime}
    </div>
  );
}