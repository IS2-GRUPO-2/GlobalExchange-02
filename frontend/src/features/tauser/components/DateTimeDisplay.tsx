import { useState, useEffect } from "react";
import { getFormattedDateTime } from "../../../utils/date";
import clsx from "clsx";

type Props = {
  className?: string;
};

export default function DateTimeDisplay({ className }: Props) {
  const [fechaHora, setFechaHora] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setFechaHora(new Date());
    }, 1000 * 60);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={clsx("text-sm text-gray-600", className)}>
      {getFormattedDateTime(fechaHora).formattedDate},{" "}
      {getFormattedDateTime(fechaHora).formattedTime}
    </div>
  );
}
