import { createBrowserRouter } from "react-router";
import App from "../App";
import UsuariosPage from "../pages/UsuariosPage";
import ClientesPage from "../pages/ClientesPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import RolesPage from "../pages/RolesPage";
import MainMenuPage from "../pages/MenuPage";
import AdminRoutes from "./AdminRoutes";
import DivisasPage from "../pages/DivisasPage";
import MetodosFinancierosPage from "../pages/MetodosFinancierosPage";
import MetodosFinancierosClientePage from "../pages/MetodosFinancierosClientePage";
import ConfiguracionesPage from "../pages/ConfiguracionesPage";
import CategoriaClientePage from "../pages/CategoriaClientePage";
import RequirePerm from "./RequierePerm";
import { CLIENTES, METODOS_FINANCIEROS, ROLES, USUARIOS, CONFIGURACIONES } from "../types/perms";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "",
        element: <MainMenuPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "roles",
        element: (
          <RequirePerm anyOf={[ROLES.VIEW]}>
            <RolesPage />
          </RequirePerm>
        ),
      },
      {
        path: "clientes",
        element: (
          <RequirePerm anyOf={[CLIENTES.VIEW]}>
            <ClientesPage />
          </RequirePerm>
        ),
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "usuarios",
        element: (
          <RequirePerm anyOf={[USUARIOS.VIEW]}>
            <UsuariosPage />
          </RequirePerm>
        ),
      },
      {
        path: "divisas",
        element: (
          <RequirePerm anyOf={[USUARIOS.VIEW]}>
            <DivisasPage />
          </RequirePerm>
        ),
      },
      {
        path: "metodos-financieros",
        element: (
          <RequirePerm anyOf={[METODOS_FINANCIEROS.VIEW]}>
            <MetodosFinancierosPage />
          </RequirePerm>
        ),
      },
      {
        path: "configuraciones",
        element: (
          <RequirePerm anyOf={[CONFIGURACIONES.VIEW]}>
            <ConfiguracionesPage />
          </RequirePerm>
        ),
      },
      {
        path: "metodos-financieros-cliente",
        element: (
          <RequirePerm anyOf={[METODOS_FINANCIEROS.VIEW]}>
            <MetodosFinancierosClientePage />
          </RequirePerm>
        ),
      },
      {
        path: "categorias-clientes",
        element: (
          <AdminRoutes>
            <CategoriaClientePage />
          </AdminRoutes>
        ),
      },
    ],
  },
]);
