import { createBrowserRouter } from "react-router";
import App from "../App";
import UsuariosPage from "../pages/UsuariosPage";
import ClientesPage from "../pages/ClientesPage";
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "./ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "login",
        element: <LoginPage />,
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
