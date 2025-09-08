import { createBrowserRouter } from "react-router";
import App from "../App";
import UsuariosPage from "../pages/UsuariosPage";
import ClientesPage from "../pages/ClientesPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import RolesPage from "../pages/RolesPage";
import MainMenuPage from "../pages/MenuPage";
import DivisasPage from "../pages/DivisasPage";
import MetodosFinancierosPage from "../pages/MetodosFinancierosPage";
import MetodosFinancierosClientePage from "../pages/MetodosFinancierosClientePage";
import ConfiguracionesPage from "../pages/ConfiguracionesPage";
import CategoriaClientePage from "../pages/CategoriaClientePage";
import {
  CATEGORIAS_CLIENTE,
  CLIENTES,
  DIVISAS,
  ROLES,
  TASAS,
  USUARIOS,
} from "../types/perms";
import CotizacionesPage from "../pages/CotizacionesPage";
import RequireAuth from "./RequiereAuth";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // RUTAS PÚBLICAS DE ESTA MANERA
      { path: "", element: <MainMenuPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },

      // RUTAS QUE SOLO REQUIEREN LOGIN
      {
        path: "billeteras",
        element: (
          <RequireAuth>
            <MetodosFinancierosClientePage />,
          </RequireAuth>
        ),
      },
      {
        path: "metodos-financieros",
        element: (
          <RequireAuth>
            <MetodosFinancierosPage />
          </RequireAuth>
        ),
      },

      // RUTAS QUE REQUIEREN LOGIN Y PERMISOS
      {
        path: "roles",
        element: (
          <RequireAuth anyOf={[ROLES.VIEW]}>
            <RolesPage />
          </RequireAuth>
        ),
      },
      {
        path: "clientes",
        element: (
          <RequireAuth anyOf={[CLIENTES.VIEW]}>
            <ClientesPage />
          </RequireAuth>
        ),
      },
      {
        path: "usuarios",
        element: (
          <RequireAuth anyOf={[USUARIOS.VIEW]}>
            <UsuariosPage />
          </RequireAuth>
        ),
      },
      {
        path: "divisas",
        element: (
          <RequireAuth anyOf={[DIVISAS.VIEW]}>
            <DivisasPage />
          </RequireAuth>
        ),
      },
      {
        path: "categorias-clientes",
        element: (
          <RequireAuth anyOf={[CATEGORIAS_CLIENTE.VIEW]}>
            <CategoriaClientePage />
          </RequireAuth>
        ),
      },
      {
        path: "cotizaciones",
        element: (
          <RequireAuth anyOf={[TASAS.VIEW]}>
            <CotizacionesPage />,
          </RequireAuth>
        ),
      },
      {
        path: "configuraciones",
        element: (
          <RequireAuth
            anyOf={[
              DIVISAS.VIEW,
              ROLES.VIEW,
              CATEGORIAS_CLIENTE.VIEW,
              TASAS.VIEW,
              USUARIOS.VIEW,
              CLIENTES.VIEW,
            ]}
          >
            <ConfiguracionesPage />
          </RequireAuth>
        ),
      },
    ],
  },
]);
