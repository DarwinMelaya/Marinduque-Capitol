import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";
import toast from "react-hot-toast";
import supabase from "../../Utils/supabaseClient";

const OFFICES = [
  { value: "records", label: "Central Records Management" },
  { value: "legal", label: "Office of Legal Counsel" },
  { value: "it", label: "Security Operations Center (SOC)" },
  { value: "admin", label: "Administrative Services" },
  { value: "oversight", label: "Oversight & Compliance" },
];

const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!password) return { score: 0, label: "", color: "bg-white/20" };
  if (score <= 1) return { score, label: "Weak", color: "bg-red-400" };
  if (score === 2) return { score, label: "Fair", color: "bg-[#a6a08a]" };
  if (score === 3) return { score, label: "Good", color: "bg-[#607796]/80" };
  return { score, label: "Strong", color: "bg-[#607796]" };
};

const inputClass =
  "peer mt-1 block w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-md text-white placeholder-transparent backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#a6a08a]/60 focus:border-transparent";

const labelClass =
  "absolute left-3 -top-6 text-sm text-white/90 peer-placeholder-shown:text-base peer-placeholder-shown:text-white/50 peer-placeholder-shown:top-2.5 transition-all peer-focus:-top-6 peer-focus:text-sm peer-focus:text-[#ebe6d6]";

const SignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    employeeId: "",
    office: "",
    email: "",
    password: "",
    reason: "",
  });

  const strength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password],
  );

  const handleChange = (e) => {
    setError(null);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (
      !form.fullName.trim() ||
      !form.employeeId.trim() ||
      !form.office ||
      !form.email.trim() ||
      !form.password ||
      !form.reason.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const passwordHash = await bcrypt.hash(form.password, 10);

      const { data, error: insertError } = await supabase
        .from("profiles")
        .insert({
          full_name: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          password_hash: passwordHash,
          role: "ADMIN",
          updated_at: new Date().toISOString(),
        })
        .select("id, email, full_name, role")
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          setError("An account with this email already exists.");
        } else {
          setError(insertError.message || "Failed to create account.");
        }
        return;
      }

      toast.success(`Access request submitted for ${data.email}`);
      navigate("/login");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative px-4 py-10"
      style={{ backgroundImage: "url('/img/bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-[#2a3648]/55" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#607796]/45 via-black/40 to-[#a6a08a]/25" />

      <div className="relative z-10 max-w-lg w-full p-8 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl auth-fade-up max-h-[95vh] overflow-y-auto">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/img/logo.png"
            alt="Lalawigan ng Marinduque"
            className="h-20 w-auto drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]"
          />
          <h1 className="mt-3 text-center text-base sm:text-lg font-extrabold tracking-[0.12em] text-white">
            GOVERNMENT OF MARINDUQUE
          </h1>
          <p className="mt-1 text-center text-xs font-semibold tracking-[0.18em] uppercase text-[#ebe6d6]">
            Request Access · DTRS
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-300/40 text-red-100 px-4 py-3 rounded-md text-sm backdrop-blur-sm">
            {error}
          </div>
        )}

        <form className="space-y-7" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
            <div className="relative">
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className={inputClass}
                placeholder="Full name"
                value={form.fullName}
                onChange={handleChange}
              />
              <label htmlFor="fullName" className={labelClass}>
                Full Name
              </label>
            </div>
            <div className="relative">
              <input
                id="employeeId"
                name="employeeId"
                type="text"
                required
                className={inputClass}
                placeholder="Employee ID"
                value={form.employeeId}
                onChange={handleChange}
              />
              <label htmlFor="employeeId" className={labelClass}>
                Employee ID
              </label>
            </div>
          </div>

          <div className="relative">
            <select
              id="office"
              name="office"
              required
              className={`${inputClass} appearance-none cursor-pointer`}
              value={form.office}
              onChange={handleChange}
            >
              <option value="" className="text-slate-800">
                Select your department
              </option>
              {OFFICES.map((office) => (
                <option
                  key={office.value}
                  value={office.value}
                  className="text-slate-800"
                >
                  {office.label}
                </option>
              ))}
            </select>
            <label htmlFor="office" className={labelClass}>
              Office / Department
            </label>
          </div>

          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              required
              className={inputClass}
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
            <label htmlFor="email" className={labelClass}>
              Work Email
            </label>
          </div>

          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              className={`${inputClass} pr-11`}
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 top-1 flex items-center pr-3 text-white/70 hover:text-[#ebe6d6]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            {form.password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((level) => (
                    <span
                      key={level}
                      className={`h-1 flex-1 rounded-full ${
                        strength.score >= level
                          ? strength.color
                          : "bg-white/20"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-white/70">
                  Strength: {strength.label}
                </p>
              </div>
            )}
          </div>

          <div className="relative">
            <textarea
              id="reason"
              name="reason"
              required
              rows={3}
              className={`${inputClass} resize-none peer-placeholder-shown:top-3`}
              placeholder="Reason"
              value={form.reason}
              onChange={handleChange}
            />
            <label htmlFor="reason" className={labelClass}>
              Reason for Access
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-white/20 rounded-md text-sm font-semibold text-white bg-[#607796]/85 hover:bg-[#4d627c]/95 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_0_18px_rgba(96,119,150,0.55)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/75">
          <Link
            to="/login"
            className="font-semibold text-[#ebe6d6] hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
