import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";
import toast from "react-hot-toast";
import supabase from "../../Utils/supabaseClient";
import { AuthField, AuthLayout } from "./AuthLayout";

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

  if (!password) {
    return { score: 0, label: "", color: "bg-outline-variant" };
  }
  if (score <= 1) {
    return { score, label: "Weak", color: "bg-error" };
  }
  if (score === 2) {
    return { score, label: "Fair", color: "bg-amber-500" };
  }
  if (score === 3) {
    return { score, label: "Good", color: "bg-primary/70" };
  }
  return { score, label: "Strong", color: "bg-primary" };
};

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

  const strength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password],
  );

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
      title="Request secure system access."
      description="Registration is limited to authorized Marinduque Capitol personnel. Complete the form for administrative review."
      formTitle="Create access request"
      formSubtitle="Provide your institutional details to register an admin account."
      highlights={[
        {
          icon: "verified_user",
          title: "Verified Identity",
          body: "Employee IDs are validated against institutional records.",
        },
        {
          icon: "gavel",
          title: "Compliance First",
          body: "Access justifications are retained for security auditing.",
        },
      ]}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthField
            id="full_name"
            name="fullName"
            label="Full Name"
            icon="badge"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Juan Dela Cruz"
            required
          />
          <AuthField
            id="employee_id"
            name="employeeId"
            label="Employee ID"
            icon="fingerprint"
            value={form.employeeId}
            onChange={handleChange}
            placeholder="ID-8842-X"
            required
          />
        </div>

        <AuthField
          id="office"
          name="office"
          label="Office / Department"
          icon="apartment"
          as="select"
          value={form.office}
          onChange={handleChange}
          required
        >
          <option value="">Select your department</option>
          {OFFICES.map((office) => (
            <option key={office.value} value={office.value}>
              {office.label}
            </option>
          ))}
        </AuthField>

        <AuthField
          id="email"
          name="email"
          label="Work Email"
          icon="mail"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="name@marinduque.gov.ph"
          required
        />

        <div>
          <AuthField
            id="password"
            name="password"
            label="Password"
            icon="lock"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
            minLength={8}
            required
            rightSlot={
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-primary"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            }
          />
          {form.password && (
            <div className="mt-2.5 space-y-1.5">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((level) => (
                  <span
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      strength.score >= level
                        ? strength.color
                        : "bg-outline-variant/50"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[11px] font-medium text-on-surface-variant">
                Strength: {strength.label}
              </p>
            </div>
          )}
        </div>

        <AuthField
          id="reason"
          name="reason"
          label="Reason for Access"
          icon="description"
          as="textarea"
          value={form.reason}
          onChange={handleChange}
          placeholder="Describe your role and why DTRS access is required..."
          rows={3}
          required
        />
        <p className="-mt-2 text-[11px] italic text-on-surface-variant">
          This justification is retained for security auditing.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="auth-btn-shine mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold tracking-wide text-white shadow-[0_12px_28px_-12px_rgba(13,114,59,0.65)] transition-transform active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              Submitting request
              <span className="material-symbols-outlined animate-spin text-[18px]">
                progress_activity
              </span>
            </>
          ) : (
            <>
              Submit access request
              <span className="material-symbols-outlined text-[18px]">send</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-7 border-t border-outline-variant/60 pt-5 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-[#0a5c30]"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          Back to sign in
        </Link>
        <p className="mt-4 text-[11px] leading-relaxed text-on-surface-variant/80">
          By submitting, you agree to the System Terms of Use and Privacy
          Policy.
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
