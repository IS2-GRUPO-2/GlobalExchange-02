/**
 * @fileoverview Punto de entrada principal de la aplicación React
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/Routes.tsx";

/**
 * Inicializa y monta la aplicación React en el DOM
 * 
 * @description
 * - Configura React en modo estricto para desarrollo
 * - Inicializa el RouterProvider con la configuración de rutas
 * - Monta la aplicación en el elemento con id "root"
 * 
 * @example
 * // El root element debe existir en index.html
 * <div id="root"></div>
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
