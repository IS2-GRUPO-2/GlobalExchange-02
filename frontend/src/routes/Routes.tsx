import { createBrowserRouter } from "react-router";
import App from "../App";
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "./ProtectedRoute";
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
        element: <RolesPage />,
      },
    ],
  },
]);
