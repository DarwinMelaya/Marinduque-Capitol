import { getSession } from "../../api/auth";

const AdminDashboard = () => {
  const session = getSession();

  const cards = [
    {
      label: "Role",
      value: session?.role || "ADMIN",
      icon: "admin_panel_settings",
    },
    {
      label: "Email",
      value: session?.email || "—",
      icon: "mail",
    },
    {
      label: "System",
      value: "DTRS",
      icon: "account_balance",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a6a08a]">
          Overview
        </p>
        <h1 className="text-2xl font-bold text-[#607796] mt-1">
          Admin Dashboard
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Welcome back, {session?.fullName || "Administrator"}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-wider text-[#a6a08a] font-semibold">
                {card.label}
              </p>
              <span className="material-symbols-outlined text-[#607796] text-[22px]">
                {card.icon}
              </span>
            </div>
            <p className="mt-3 text-lg font-semibold text-[#3f5168] break-all">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#a6a08a]/30 bg-gradient-to-r from-[#607796]/10 to-[#a6a08a]/15 p-5">
        <h2 className="text-sm font-semibold text-[#607796]">
          Government of Marinduque
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Document Tracking System — secure workspace for authorized capitol
          personnel.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
