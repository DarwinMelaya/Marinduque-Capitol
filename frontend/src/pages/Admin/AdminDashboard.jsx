import { getSession } from "../../api/auth";

const AdminDashboard = () => {
  const session = getSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Welcome back, {session?.fullName || "Administrator"}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded border border-outline-variant bg-surface p-5">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">
            Role
          </p>
          <p className="mt-2 text-lg font-semibold text-primary">
            {session?.role || "ADMIN"}
          </p>
        </div>
        <div className="rounded border border-outline-variant bg-surface p-5">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">
            Email
          </p>
          <p className="mt-2 text-lg font-semibold break-all">
            {session?.email || "—"}
          </p>
        </div>
        <div className="rounded border border-outline-variant bg-surface p-5">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">
            System
          </p>
          <p className="mt-2 text-lg font-semibold">DTRS</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
