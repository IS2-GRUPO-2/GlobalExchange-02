import { createBrowserRouter } from "react-router";
import App from "../App";
import UsuariosPage from "../pages/UsuariosPage";
import ClientesPage from "../pages/ClientesPage";
import LoginPage from "../pages/LoginPage";
// import ProtectedRoute from "./ProtectedRoute"; // Esta importación no se usa
import RegisterPage from "../pages/RegisterPage";
import RolesPage from "../pages/RolesPage";
import MainMenuPage from "../pages/MenuPage";
import AdminRoutes from "./AdminRoutes";
import DivisasPage from "../pages/DivisasPage";
import MetodosFinancierosPage from "../pages/MetodosFinancierosPage";
import MetodosFinancierosClientePage from "../pages/MetodosFinancierosClientePage";
import RequirePerm from "./RequierePerm";
import { CLIENTES, ROLES, USUARIOS } from "../types/perms";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "landing",
        element: <MainMenuPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "roles",
        element: (
          <RequirePerm anyOf={[ROLES.VIEW, ROLES.ADD, ROLES.CHANGE, ROLES.DELETE]}>
            <RolesPage />
          </RequirePerm>
        ),
      },
      {
        path: "clientes",
        element: (
          <RequirePerm anyOf={[CLIENTES.VIEW, CLIENTES.ADD, CLIENTES.CHANGE, CLIENTES.DELETE]}>
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
          <RequirePerm anyOf={[USUARIOS.VIEW, USUARIOS.ADD, USUARIOS.CHANGE, USUARIOS.DELETE]}>
            <UsuariosPage />
          </RequirePerm>
        ),
      },
      {
        path: "divisas",
        element: (
          <AdminRoutes>
            <DivisasPage />
          </AdminRoutes>
        ),
      },
      {
        path: "metodos-financieros",
        element: (
          <AdminRoutes>
            <MetodosFinancierosPage />
          </AdminRoutes>
        ),
      },
      {
        path: "billeteras",
        element: (
          <MetodosFinancierosClientePage />
        ),
      },
    ],
  },
]);
