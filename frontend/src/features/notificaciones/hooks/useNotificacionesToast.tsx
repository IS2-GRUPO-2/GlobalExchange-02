import { useEffect } from "react";
import { toast, type TypeOptions } from "react-toastify";
import { getNotificacionesCambioTasa } from "../services/notificacionService";
import type { NotificacionCambioTasa } from "../types/Notificacion";

const POLL_INTERVAL_MS = 5000;
const EVENT_ICONS: Record<NotificacionCambioTasa["tipo_evento"], string> = {
  suscripcion: "💱",
  transaccion_pendiente: "⚠️",
};

interface UseNotificacionesToastOptions {
  enabled: boolean;
}

export const useNotificacionesToast = ({ enabled }: UseNotificacionesToastOptions) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const fetchNotifications = async () => {
      if (cancelled) {
        return;
      }

      try {
        const notifications = await getNotificacionesCambioTasa();
        notifications.forEach(showToast);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn("Error al obtener notificaciones de cambio de tasa", error);
        }
      } finally {
        if (!cancelled) {
          timeoutId = setTimeout(fetchNotifications, POLL_INTERVAL_MS);
        }
      }
    };

    fetchNotifications();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [enabled]);
};

const showToast = (notification: NotificacionCambioTasa) => {
  const icono = EVENT_ICONS[notification.tipo_evento];

  const hasPositive =
    notification.tasa_compra.es_incremento || notification.tasa_venta.es_incremento;
  const hasNegative =
    notification.tasa_compra.es_decremento || notification.tasa_venta.es_decremento;

  let borderColor = "#2563eb";
  let background = "#f8fafc";
  let variant: TypeOptions = "info";

  if (hasPositive && !hasNegative) {
    borderColor = "#16a34a";
    background = "#ecfdf5";
    variant = "success";
  } else if (hasNegative && !hasPositive) {
    borderColor = "#dc2626";
    background = "#fef2f2";
    variant = "error";
  } else if (notification.tipo_evento === "transaccion_pendiente") {
    borderColor = "#f97316";
    background = "#fff7ed";
    variant = "warning";
  }

  toast(
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <div style={{ fontWeight: 600 }}>{notification.titulo}</div>
      <div style={{ fontSize: "0.9rem" }}>{notification.descripcion}</div>
      <div style={{ fontSize: "0.75rem", color: "#475569" }}>
  {`Compra Gs ${notification.tasa_compra.anterior} -> Gs ${notification.tasa_compra.nueva} `}
  {`(${notification.tasa_compra.variacion} Gs | ${notification.tasa_compra.variacion_porcentaje}%)`}
      </div>
      <div style={{ fontSize: "0.75rem", color: "#475569" }}>
  {`Venta Gs ${notification.tasa_venta.anterior} -> Gs ${notification.tasa_venta.nueva} `}
  {`(${notification.tasa_venta.variacion} Gs | ${notification.tasa_venta.variacion_porcentaje}%)`}
      </div>
    </div>,
    {
      toastId: `cambio-tasa-${notification.id}`,
      type: variant,
      icon: () => <span>{icono}</span>,
      autoClose: 6000,
      position: "top-right",
      style: {
        borderLeft: `4px solid ${borderColor}`,
        background,
        color: "#0f172a",
      },
      closeButton: true,
    }
  );
};
