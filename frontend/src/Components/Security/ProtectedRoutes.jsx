import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getSession, isAdmin } from "../../api/auth";

/**
 * Protects nested routes. Use role="ADMIN" for admin-only pages.
 */
const ProtectedRoutes = ({ role }) => {
  const location = useLocation();
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role === "ADMIN" && !isAdmin(session)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoutes;
