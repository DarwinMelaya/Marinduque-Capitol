import { Outlet } from "react-router-dom";
import {
  getSession,
  isBudgetOffice,
  isGovernorOffice,
  isProvincialAdministrator,
  isRecordOffice,
} from "../../api/auth";
import AdminSidebar from "./AdminSidebar";
import RecordSidebar from "./RecordSidebar";
import ProvincialAdministratorSidebar from "./ProvincialAdministratorSidebar";
import BudgetOfficeSidebar from "./BudgetOfficeSidebar";
import GovernorOfficeSidebar from "./GovernorOfficeSidebar";
import Navbar from "./Navbar";

const Layout = () => {
  const session = getSession();

  let Sidebar = AdminSidebar;
  if (isRecordOffice(session)) Sidebar = RecordSidebar;
  else if (isProvincialAdministrator(session)) {
    Sidebar = ProvincialAdministratorSidebar;
  } else if (isBudgetOffice(session)) {
    Sidebar = BudgetOfficeSidebar;
  } else if (isGovernorOffice(session)) {
    Sidebar = GovernorOfficeSidebar;
  }

  return (
    <div className="h-dvh overflow-hidden flex relative text-on-surface font-sans">
      <div
        className="pointer-events-none fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/img/bg.jpg')" }}
      />
      <div className="pointer-events-none fixed inset-0 bg-[#e8ecf0]/88" />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#607796]/10 via-transparent to-[#a6a08a]/15" />

      <div className="relative z-10 flex w-full h-full flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 min-w-0 h-full overflow-y-auto overscroll-contain pb-28 md:pb-0">
          <div className="sticky top-0 z-30 px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-3 bg-[#e8ecf0]/80 backdrop-blur-md">
            <Navbar />
          </div>
          <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
            <div className="rounded-2xl border border-white/50 bg-white/55 backdrop-blur-md shadow-[0_8px_30px_rgba(96,119,150,0.12)] p-4 sm:p-6 md:p-8 min-h-[calc(100dvh-10rem)]">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
