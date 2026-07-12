import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

const Layout = () => {
  return (
    <div className="min-h-screen flex bg-background text-on-surface font-sans">
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
