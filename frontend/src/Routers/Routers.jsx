import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import {
  LandingPage,
  Login,
  SignUp,
  AdminDashboard,
  AdminRegistration,
} from "../pages";
import ProtectedRoutes from "../Components/Security/ProtectedRoutes";
import Layout from "../Components/Layout/Layout";

export const Routers = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Admin — ADMIN role only */}
        <Route element={<ProtectedRoutes role="ADMIN" />}>
          <Route path="/admin" element={<Layout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="registration" element={<AdminRegistration />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};
