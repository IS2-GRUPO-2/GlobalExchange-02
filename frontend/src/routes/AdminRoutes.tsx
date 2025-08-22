import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

type Props = { children: React.ReactNode };

const AdminRoutes = ({ children }: Props) => {
  const location = useLocation();
  const { isLoggedIn, user } = useAuth();
  return isLoggedIn() && user?.is_staff ? (
    <>{children}</>
  ) : (
    <Navigate to="/" state={{ from: location }} replace />
  );
};

export default AdminRoutes;
