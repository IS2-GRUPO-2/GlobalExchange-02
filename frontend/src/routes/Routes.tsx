import { createBrowserRouter } from "react-router";
import App from "../App";
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
    ],
  },
]);
