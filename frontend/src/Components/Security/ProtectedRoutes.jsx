import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getHomePath, getSession } from "../../api/auth";

/**
 * Protects nested routes. Pass role (e.g. "ADMIN", "RecordOffice") for role-only pages.
 */
const ProtectedRoutes = ({ role }) => {
  const location = useLocation();
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && session.role !== role) {
    return <Navigate to={getHomePath(session)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoutes;
