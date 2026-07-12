import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className="min-h-screen flex relative text-on-surface font-sans">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/img/bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-[#e8ecf0]/88" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#607796]/10 via-transparent to-[#a6a08a]/15" />

      <div className="relative z-10 flex w-full min-h-screen">
        <AdminSidebar />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-6 md:p-8">
            <Navbar />
            <div className="rounded-2xl border border-white/50 bg-white/55 backdrop-blur-md shadow-[0_8px_30px_rgba(96,119,150,0.12)] p-6 md:p-8 min-h-[calc(100vh-8rem)]">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
