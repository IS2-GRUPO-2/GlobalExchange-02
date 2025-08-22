import { createBrowserRouter } from "react-router";
import App from "../App";
import ClientesPage from "../pages/ClientesPage";
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import RegisterPage from "../pages/RegisterPage";
import RolesPage from "../pages/RolesPage";

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
    ],
  },
]);
