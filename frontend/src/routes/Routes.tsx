import { createBrowserRouter } from "react-router";
import App from "../App";
import UsuariosPage from "../pages/UsuariosPage";
import ClientesPage from "../pages/ClientesPage";
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import RegisterPage from "../pages/RegisterPage";
import RolesPage from "../pages/RolesPage";
import MainMenuPage from "../pages/MenuPage";
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
          <ProtectedRoute>
            <RolesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "clientes",
        element: (
          <ProtectedRoute>
            <ClientesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "usuarios",
        element: (
          <ProtectedRoute>
            <UsuariosPage />
          </ProtectedRoute>  
        ),
      },
    ],
  },
]);
