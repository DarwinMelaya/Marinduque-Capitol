import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getSession, logout } from "../../api/auth";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/admin/registration", label: "Registration", icon: "person_add" },
];

const AdminSidebar = () => {
  const navigate = useNavigate();
  const session = getSession();

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully.");
    navigate("/login");
  };

  return (
    <aside className="w-64 shrink-0 min-h-screen bg-primary text-on-primary flex flex-col">
      <div className="px-6 py-6 border-b border-white/15">
        <p className="text-xs uppercase tracking-widest text-primary-fixed/80">
          DTRS Admin
        </p>
        <h1 className="text-lg font-bold mt-1">Marinduque Capitol</h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-primary-fixed/90 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/15 space-y-3">
        <div>
          <p className="text-sm font-semibold truncate">
            {session?.fullName || "Admin"}
          </p>
          <p className="text-xs text-primary-fixed/80 truncate">
            {session?.email}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded bg-white/10 hover:bg-white/20 px-3 py-2 text-sm font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
