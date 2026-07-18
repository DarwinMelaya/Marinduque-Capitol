import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import {
  LandingPage,
  Login,
  SignUp,
  AdminDashboard,
  AdminRegistration,
  RecordDashboard,
  RecordRecording,
  ProvincialAdministratorDashboard,
  ProvincialAdministratorRecords,
  BudgetOfficeDashboard,
  BudgetOfficeRecords,
  GovernorOfficeDashboard,
  GovernorOfficeRecords,
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

        {/* Record Office — RecordOffice role only */}
        <Route element={<ProtectedRoutes role="RecordOffice" />}>
          <Route path="/record-office" element={<Layout />}>
            <Route index element={<RecordDashboard />} />
            <Route path="recording" element={<RecordRecording />} />
          </Route>
        </Route>

        {/* Provincial Administrator — ProvincialAdministrator role only */}
        <Route element={<ProtectedRoutes role="ProvincialAdministrator" />}>
          <Route path="/provincial-administrator" element={<Layout />}>
            <Route index element={<ProvincialAdministratorDashboard />} />
            <Route
              path="records"
              element={<ProvincialAdministratorRecords />}
            />
          </Route>
        </Route>

        {/* Budget Office — BudgetOffice role only */}
        <Route element={<ProtectedRoutes role="BudgetOffice" />}>
          <Route path="/budget-office" element={<Layout />}>
            <Route index element={<BudgetOfficeDashboard />} />
            <Route path="records" element={<BudgetOfficeRecords />} />
          </Route>
        </Route>

        {/* Governor Office — GovernorOffice role only */}
        <Route element={<ProtectedRoutes role="GovernorOffice" />}>
          <Route path="/governor-office" element={<Layout />}>
            <Route index element={<GovernorOfficeDashboard />} />
            <Route path="records" element={<GovernorOfficeRecords />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};
