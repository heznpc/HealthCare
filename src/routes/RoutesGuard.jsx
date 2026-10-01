import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";

const RouteGuard = ({ children, requiredRole }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/signin" />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/forbidden" />;

  return children;
};

export default RouteGuard;
