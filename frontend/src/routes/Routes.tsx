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
          <AdminRoutes>
            <RolesPage />
          </AdminRoutes>
        ),
      },
      {
        path: "clientes",
        element: (
          <AdminRoutes>
            <ClientesPage />
          </AdminRoutes>
        ),
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "usuarios",
        element: (
          <AdminRoutes>
            <UsuariosPage />
          </AdminRoutes>
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
    ],
  },
]);
