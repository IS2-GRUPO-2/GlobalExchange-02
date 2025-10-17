import { createBrowserRouter } from "react-router";
import App from "../App";
import UsuariosPage from "../features/usuario/pages/UsuariosPage";
import ClientesPage from "../features/clientes/pages/ClientesPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import RolesPage from "../features/roles/pages/RolesPage";
import MainMenuPage from "../pages/MenuPage";
import DivisasPage from "../features/divisas/pages/DivisasPage";
import MetodosFinancierosPage from "../features/metodos_financieros/Pages/MetodosFinancierosPage";
import MetodosFinancierosClientePage from "../features/metodos_financieros/Pages/MetodosFinancierosClientePage";
import ConfiguracionesPage from "../pages/ConfiguracionesPage";
import CategoriaClientePage from "../features/categoria_clientes/pages/CategoriaClientesPage";
import SecuritySettingsPage from "../pages/SecuritySettingsPage";
import {
  CATEGORIAS_CLIENTE,
  CLIENTES,
  DIVISAS,
  METODOS_FINANCIEROS,
  ROLES,
  TASAS,
  USUARIOS,
  METODOS_FINANCIEROS_DETALLE,
  TAUSER,
  OPERACION,
} from "../types/perms";
import CotizacionesPage from "../features/cotizaciones/pages/CotizacionesPage";
import RequireAuth from "./RequiereAuth";

import OperacionPage from "../features/operaciones/pages/OperacionPage";
import ConfiguracionTauserPage from "../features/tauser/pages/ConfiguracionTauserPage";
import HistorialPage from "../pages/HistorialPage";
import SimuladorTransaccionBancariaPage from "../features/operaciones/pages/SimuladorTransaccionBancariaPage";

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
        path: "metodos-financieros-cliente",
        element: (
          <RequireAuth>
            <MetodosFinancierosClientePage />
          </RequireAuth>
        ),
      },

      {
        path: "historial-transacciones",
        element: (
          <RequireAuth>
            <HistorialPage />
          </RequireAuth>
        ),
      },

      {
        path: "settings/security",
        element: (
          <RequireAuth>
            <SecuritySettingsPage />
          </RequireAuth>
        ),
      },

      {
        path: "checkout/success",
        element: (
          <RequireAuth>
            <CheckoutSuccess />
          </RequireAuth>
        ),
      },

      {
        path: "checkout/cancel",
        element: (
          <RequireAuth>
            <CheckoutCancel />
          </RequireAuth>
        ),
      },

      // RUTAS QUE REQUIEREN LOGIN Y PERMISOS
      {
        path: "metodos-financieros",
        element: (
          <RequireAuth anyOf={[METODOS_FINANCIEROS.VIEW]}>
            <MetodosFinancierosPage />
          </RequireAuth>
        ),
      },
      {
        path: "roles",
        element: (
          <RequireAuth anyOf={[ROLES.VIEW]}>
            <RolesPage />
          </RequireAuth>
        ),
      },

      {
        path: "operaciones",
        element: (
          <RequireAuth anyOf={[OPERACION.USE]}>
            <OperacionPage />
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
            <CotizacionesPage />
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
              METODOS_FINANCIEROS_DETALLE.VIEW,
              TAUSER.VIEW,
            ]}
          >
            <ConfiguracionesPage />
          </RequireAuth>
        ),
      },
      {
        path: "configuracion-tausers",
        element: (
          <RequireAuth anyOf={[TAUSER.VIEW]}>
            <ConfiguracionTauserPage />
          </RequireAuth>
        ),
      },
      {
        path: "simulador-transaccion-bancaria",
        element: (
          <RequireAuth anyOf={[OPERACION.USE]}>
            <SimuladorTransaccionBancariaPage />
          </RequireAuth>
        ),
      },
    ],
  },
]);
