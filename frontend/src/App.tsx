/**
 * @fileoverview Componente principal de la aplicación GlobalExchange
 */

import "./App.css";
import { UserProvider } from "./context/useAuth";
import { Outlet, useLocation } from "react-router";
import Navbar from "./components/Navbar";
import { ToastContainer } from "react-toastify";
import { AuthZProvider } from "./context/AuthZContext";

/** Rutas donde se oculta la barra de navegación */
const HIDE_NAV_ROUTES = ["/login", "/register","/Register","/Login", "/tauser"];

/**
 * Componente principal de la aplicación
 * @component App
 * @returns {JSX.Element} Aplicación completa con proveedores de contexto
 * 
 * @description
 * - Configura proveedores de contexto de autenticación y autorización
 * - Maneja la visibilidad de la navbar según la ruta actual
 * - Configura notificaciones toast globales
 * - Renderiza el outlet para las rutas hijas
 * 
 * @providers
 * - UserProvider: Manejo de autenticación de usuarios
 * - AuthZProvider: Manejo de autorización y permisos
 * 
 * @example
 * // Se usa automáticamente en el RouterProvider
 * <RouterProvider router={router} />
 */
function App() {
  const { pathname } = useLocation();
  const hideNavbar = HIDE_NAV_ROUTES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  return (
    <UserProvider>
      <AuthZProvider>
        <ToastContainer 
          position="top-right"
          autoClose={1000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          limit={2}
          theme="light"
        />
        {!hideNavbar && <Navbar />}
        <Outlet />
      </AuthZProvider>
    </UserProvider>
  );
}

export default App;
