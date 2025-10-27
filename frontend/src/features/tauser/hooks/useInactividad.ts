import { useEffect, useRef } from "react";

const DEFAULT_EVENTS = ["mousemove", "keydown", "click", "touchstart"];

export const useTauserInactividad = (
  enabled: boolean,
  onTimeout: () => void,
  timeoutMs = 30000
) => {
  const callbackRef = useRef(onTimeout);
  callbackRef.current = onTimeout;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let timer: number | null = window.setTimeout(() => callbackRef.current(), timeoutMs);

    const reset = () => {
      if (timer) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(() => callbackRef.current(), timeoutMs);
    };

    DEFAULT_EVENTS.forEach((event) => window.addEventListener(event, reset, { passive: true }));

    return () => {
      DEFAULT_EVENTS.forEach((event) => window.removeEventListener(event, reset));
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [enabled, timeoutMs]);
};
