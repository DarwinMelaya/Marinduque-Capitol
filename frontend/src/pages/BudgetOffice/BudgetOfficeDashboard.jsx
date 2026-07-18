import { Link } from "react-router-dom";

const BudgetOfficeDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a6a08a]">
            Budget Office
          </p>
          <h1 className="text-2xl font-bold text-[#607796] mt-1">Dashboard</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Documents routed to the Budget Office and items currently under your
            review.
          </p>
        </div>
        <Link
          to="/budget-office/records"
          className="inline-flex items-center gap-2 rounded-md border border-[#607796]/20 bg-white/70 px-4 py-2.5 text-sm font-semibold text-[#607796] hover:bg-[#607796]/5"
        >
          <span className="material-symbols-outlined text-[18px]">
            folder_open
          </span>
          Open records
        </Link>
      </div>

      <div className="rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#607796]/10 border border-[#a6a08a]/30">
          <span className="material-symbols-outlined text-[#607796] text-[28px]">
            payments
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-[#3f5168]">
            Welcome to the Budget Office workspace
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Review and process documents forwarded for budget action.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BudgetOfficeDashboard;
