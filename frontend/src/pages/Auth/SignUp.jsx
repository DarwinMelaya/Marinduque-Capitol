import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";
import toast from "react-hot-toast";
import supabase from "../../Utils/supabaseClient";
import { AuthLayout, fieldClass, labelClass } from "./AuthLayout";

const OFFICES = [
  { value: "records", label: "Central Records Management" },
  { value: "legal", label: "Office of Legal Counsel" },
  { value: "it", label: "Security Operations Center (SOC)" },
  { value: "admin", label: "Administrative Services" },
  { value: "oversight", label: "Oversight & Compliance" },
];

const SignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    employeeId: "",
    office: "",
    email: "",
    password: "",
    reason: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.fullName.trim() ||
      !form.employeeId.trim() ||
      !form.office ||
      !form.email.trim() ||
      !form.password ||
      !form.reason.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const passwordHash = await bcrypt.hash(form.password, 10);

      const { data, error } = await supabase
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

      if (error) {
        if (error.code === "23505") {
          toast.error("An account with this email already exists.");
        } else {
          toast.error(error.message || "Failed to create account.");
        }
        return;
      }

      toast.success(`Access request submitted for ${data.email}`);
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Secure Document Access Registration"
      description="Access to the Government Document Tracking System is restricted to authorized personnel only. Please complete the registration request for administrative review."
      highlights={[
        {
          icon: "verified_user",
          title: "Verified Identity",
          body: "Employee IDs are cross-referenced with the central HR database for authentication.",
        },
        {
          icon: "gavel",
          title: "Compliance Standards",
          body: "All tracking activities are logged under strict Federal Information Security protocols.",
        },
      ]}
    >
      <div className="md:hidden mb-6 flex justify-between items-center">
        <span className="text-xl font-bold text-primary">DTRS</span>
        <span className="material-symbols-outlined text-primary">security</span>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-primary mb-1">
          Request Access
        </h2>
        <p className="text-sm text-on-surface-variant">
          Provide your institutional credentials to create an account.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="group flex flex-col gap-1">
            <label className={labelClass} htmlFor="full_name">
              Full Name
            </label>
            <input
              id="full_name"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              placeholder="John R. Doe"
              className={fieldClass}
              required
            />
          </div>
          <div className="group flex flex-col gap-1">
            <label className={labelClass} htmlFor="employee_id">
              Employee ID
            </label>
            <input
              id="employee_id"
              name="employeeId"
              type="text"
              value={form.employeeId}
              onChange={handleChange}
              placeholder="ID-8842-X"
              className={fieldClass}
              required
            />
          </div>
        </div>

        <div className="group flex flex-col gap-1">
          <label className={labelClass} htmlFor="office">
            Office / Department
          </label>
          <select
            id="office"
            name="office"
            value={form.office}
            onChange={handleChange}
            className={`${fieldClass} appearance-none cursor-pointer`}
            required
          >
            <option value="">Select your department</option>
            {OFFICES.map((office) => (
              <option key={office.value} value={office.value}>
                {office.label}
              </option>
            ))}
          </select>
        </div>

        <div className="group flex flex-col gap-1">
          <label className={labelClass} htmlFor="email">
            Work Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="j.doe@agency.gov"
            className={fieldClass}
            required
          />
        </div>

        <div className="group flex flex-col gap-1 relative">
          <label className={labelClass} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={`${fieldClass} pr-12`}
            minLength={8}
            required
          />
          <button
            type="button"
            className="absolute right-4 bottom-2.5 text-on-surface-variant hover:text-primary transition-colors"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>

        <div className="group flex flex-col gap-1">
          <label className={labelClass} htmlFor="reason">
            Reason for Access
          </label>
          <textarea
            id="reason"
            name="reason"
            value={form.reason}
            onChange={handleChange}
            placeholder="Explain your primary duties and why system access is required for your role..."
            rows={3}
            className={`${fieldClass} resize-none`}
            required
          />
          <span className="text-xs text-on-surface-variant italic">
            This justification will be logged for security auditing.
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-on-primary py-3.5 px-6 text-sm font-semibold tracking-wide rounded hover:bg-[#0a5c30] active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>
              Processing Request...
              <span className="material-symbols-outlined animate-spin text-[18px]">
                progress_activity
              </span>
            </>
          ) : (
            <>
              Submit Request
              <span className="material-symbols-outlined text-[18px]">send</span>
            </>
          )}
        </button>

        <div className="pt-4 text-center">
          <Link
            to="/login"
            className="text-sm text-on-surface-variant hover:text-primary transition-colors inline-flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Back to Login
          </Link>
        </div>
      </form>

      <footer className="mt-8 text-center">
        <p className="text-xs text-on-surface-variant">
          By submitting this request, you agree to the{" "}
          <a className="underline hover:text-primary" href="#">
            System Terms of Use
          </a>{" "}
          and{" "}
          <a className="underline hover:text-primary" href="#">
            Privacy Policy
          </a>
          .
        </p>
      </footer>
    </AuthLayout>
  );
};

export default SignUp;
