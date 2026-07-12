import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getSession, logout } from "../../api/auth";

const NAV_ITEMS = [
  { to: "/record-office", label: "Dashboard", icon: "dashboard", end: true },
  {
    to: "/record-office/recording",
    label: "Recording",
    icon: "description",
  },
];

const RecordSidebar = () => {
  const navigate = useNavigate();
  const session = getSession();

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully.");
    navigate("/login");
  };

  return (
    <aside className="relative w-64 shrink-0 min-h-screen p-3">
      <div className="absolute inset-3 rounded-2xl overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('/img/bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#607796]/92 via-[#4d627c]/90 to-[#3f5168]/95" />
        <div className="absolute inset-0 backdrop-blur-xl bg-white/5 border border-white/20 rounded-2xl shadow-2xl" />
      </div>

      <div className="relative z-10 h-full min-h-[calc(100vh-1.5rem)] flex flex-col text-white rounded-2xl overflow-hidden">
        <div className="px-5 py-6 border-b border-white/15">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-[#a6a08a]/40 backdrop-blur-sm">
              <span
                className="material-symbols-outlined text-[22px] text-[#ebe6d6]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                folder_managed
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#ebe6d6]/90">
                Record Office
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
              {session?.fullName || "Record Officer"}
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
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default RecordSidebar;
