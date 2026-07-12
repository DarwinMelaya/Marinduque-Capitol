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
    <>
      {/* Desktop sidebar — fixed while page content scrolls */}
      <aside className="relative hidden md:flex w-64 shrink-0 h-full p-3">
        <div className="absolute inset-3 rounded-2xl overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: "url('/img/bg.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#607796]/92 via-[#4d627c]/90 to-[#3f5168]/95" />
          <div className="absolute inset-0 backdrop-blur-xl bg-white/5 border border-white/20 rounded-2xl shadow-2xl" />
        </div>

        <div className="relative z-10 h-full w-full flex flex-col text-white rounded-2xl overflow-hidden">
          <div className="px-5 py-6 border-b border-white/15">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-[#a6a08a]/40 backdrop-blur-sm">
                <span
                  className="material-symbols-outlined text-[22px] text-[#ebe6d6]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  account_balance
                </span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#ebe6d6]/90">
                  DTRS Admin
                </p>
                <h1 className="text-sm font-bold leading-tight">
                  Marinduque Capitol
                </h1>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1.5">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 border ${
                    isActive
                      ? "bg-white/15 border-[#a6a08a]/45 text-white shadow-[0_0_18px_rgba(96,119,150,0.35)] backdrop-blur-sm"
                      : "bg-transparent border-transparent text-[#ebe6d6]/90 hover:bg-white/10 hover:border-white/15 hover:text-white"
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

          <div className="mx-3 mb-3 rounded-xl border border-white/15 bg-white/10 backdrop-blur-md p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold truncate">
                {session?.fullName || "Admin"}
              </p>
              <p className="text-xs text-[#ebe6d6]/80 truncate">
                {session?.email}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#607796]/80 hover:bg-[#4d627c] border border-[#a6a08a]/35 px-3 py-2 text-sm font-medium transition-all hover:shadow-[0_0_15px_rgba(96,119,150,0.45)]"
            >
              <span className="material-symbols-outlined text-[18px]">
                logout
              </span>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
        aria-label="Primary"
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/25 shadow-[0_-8px_30px_rgba(63,81,104,0.35)]">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{ backgroundImage: "url('/img/bg.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#607796]/95 via-[#4d627c]/95 to-[#3f5168]/95" />
          <div className="absolute inset-0 backdrop-blur-xl bg-white/5" />

          <div className="relative z-10 flex items-stretch justify-around gap-1 px-1 py-2 text-white">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-white/20 text-white shadow-[0_0_14px_rgba(235,230,214,0.25)]"
                      : "text-[#ebe6d6]/85 active:bg-white/10"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={
                        isActive
                          ? { fontVariationSettings: "'FILL' 1" }
                          : undefined
                      }
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-semibold tracking-wide text-[#ebe6d6]/85 active:bg-white/10"
            >
              <span className="material-symbols-outlined text-[22px]">
                logout
              </span>
              Sign out
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default AdminSidebar;
