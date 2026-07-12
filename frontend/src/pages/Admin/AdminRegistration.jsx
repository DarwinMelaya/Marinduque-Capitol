const AdminRegistration = () => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a6a08a]">
          Accounts
        </p>
        <h1 className="text-2xl font-bold text-[#607796] mt-1">Registration</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Manage access requests and registered accounts.
        </p>
      </div>

      <div className="rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#607796]/10 border border-[#a6a08a]/30">
            <span className="material-symbols-outlined text-[#607796]">
              person_add
            </span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#3f5168]">
              Access requests
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Registration review tools will appear here. New sign-ups from the
              public form can be reviewed and approved by administrators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegistration;
