const BudgetOfficeRecords = () => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a6a08a]">
          Budget Office
        </p>
        <h1 className="text-2xl font-bold text-[#607796] mt-1">Records</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Documents routed to the Budget Office.
        </p>
      </div>

      <div className="rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-6 shadow-sm">
        <p className="py-6 text-center text-sm text-on-surface-variant">
          No documents yet.
        </p>
      </div>
    </div>
  );
};

export default BudgetOfficeRecords;
