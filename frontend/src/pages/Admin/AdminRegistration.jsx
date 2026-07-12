import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  OFFICE_ROLES,
  createUser,
  listUsers,
  roleLabel,
} from "../../api/users";

const emptyForm = {
  fullName: "",
  email: "",
  password: "",
  role: "",
};

const inputClass =
  "mt-1 block w-full rounded-md border border-[#607796]/25 bg-white px-3 py-2.5 text-sm text-[#3f5168] placeholder:text-[#a6a08a]/80 focus:outline-none focus:ring-2 focus:ring-[#607796]/40 focus:border-[#607796]";

const AdminRegistration = () => {
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const rows = await listUsers();
      setUsers(rows);
    } catch (err) {
      toast.error(err.message || "Unable to load accounts.");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (e) => {
    setError(null);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const created = await createUser(form);
      toast.success(`Account created for ${created.fullName}`);
      setForm(emptyForm);
      setShowPassword(false);
      setUsers((prev) => [created, ...prev]);
    } catch (err) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a6a08a]">
          Accounts
        </p>
        <h1 className="text-2xl font-bold text-[#607796] mt-1">Registration</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Create user accounts and assign an office role.
        </p>
      </div>

      <div className="rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#607796]/10 border border-[#a6a08a]/30">
            <span className="material-symbols-outlined text-[#607796]">
              person_add
            </span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#3f5168]">
              Create account
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Register a new user and assign them to Budget Office, Governor&apos;s
              Office, Provincial Administrator, or Record Office.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="fullName"
                className="text-xs font-semibold uppercase tracking-wider text-[#a6a08a]"
              >
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className={inputClass}
                placeholder="Juan Dela Cruz"
                value={form.fullName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-[#a6a08a]"
              >
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={inputClass}
                placeholder="name@marinduque.gov.ph"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-[#a6a08a]"
              >
                Temporary password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  className={`${inputClass} pr-11`}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 top-1 flex items-center pr-3 text-[#607796]/70 hover:text-[#607796]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="role"
                className="text-xs font-semibold uppercase tracking-wider text-[#a6a08a]"
              >
                Office role
              </label>
              <select
                id="role"
                name="role"
                required
                className={`${inputClass} appearance-none cursor-pointer`}
                value={form.role}
                onChange={handleChange}
              >
                <option value="">Select role</option>
                {OFFICE_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md bg-[#607796] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4d627c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">
                person_add
              </span>
              {loading ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#3f5168]">
              Registered accounts
            </h2>
            <p className="mt-0.5 text-sm text-on-surface-variant">
              {loadingUsers
                ? "Loading accounts..."
                : `${users.length} account${users.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={loadUsers}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#607796]/20 px-3 py-1.5 text-xs font-semibold text-[#607796] hover:bg-[#607796]/5"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refresh
          </button>
        </div>

        {loadingUsers ? (
          <p className="text-sm text-on-surface-variant py-6 text-center">
            Loading...
          </p>
        ) : users.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-6 text-center">
            No accounts yet. Create the first user above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#607796]/15 text-[11px] uppercase tracking-wider text-[#a6a08a]">
                  <th className="pb-2 pr-4 font-semibold">Name</th>
                  <th className="pb-2 pr-4 font-semibold">Email</th>
                  <th className="pb-2 font-semibold">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[#607796]/08 last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-[#3f5168]">
                      {user.fullName}
                    </td>
                    <td className="py-3 pr-4 text-on-surface-variant">
                      {user.email}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex rounded-md bg-[#607796]/10 px-2 py-1 text-xs font-semibold text-[#607796]">
                        {roleLabel(user.role)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRegistration;
