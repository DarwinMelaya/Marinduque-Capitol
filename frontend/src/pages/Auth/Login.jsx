import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginWithCredentials } from "../../api/auth";
import { AuthField, AuthLayout } from "./AuthLayout";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password) {
      toast.error("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const session = await loginWithCredentials(form.email, form.password);
      toast.success(`Welcome back, ${session.fullName}`);

      if (session.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Govern documents with confidence."
      description="Sign in to the Marinduque Capitol Document Tracking System using your authorized institutional credentials."
      formTitle="Welcome back"
      formSubtitle="Enter your work email and password to continue."
      highlights={[
        {
          icon: "shield_lock",
          title: "Protected Access",
          body: "Only verified personnel with active accounts can enter the workspace.",
        },
        {
          icon: "policy",
          title: "Audit Ready",
          body: "Sign-in activity is monitored to protect document integrity.",
        },
      ]}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthField
          id="login_email"
          name="email"
          label="Work Email"
          icon="mail"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="name@marinduque.gov.ph"
          autoComplete="email"
          required
        />

        <AuthField
          id="login_password"
          name="password"
          label="Password"
          icon="lock"
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={handleChange}
          placeholder="Enter your password"
          autoComplete="current-password"
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

        <div className="flex items-center justify-between pt-1 text-xs">
          <label className="inline-flex cursor-pointer items-center gap-2 text-on-surface-variant">
            <input
              type="checkbox"
              className="size-3.5 rounded border-outline-variant text-primary focus:ring-primary/30"
            />
            Remember this device
          </label>
          <button
            type="button"
            className="font-semibold text-primary transition-colors hover:text-[#0a5c30]"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="auth-btn-shine mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold tracking-wide text-white shadow-[0_12px_28px_-12px_rgba(13,114,59,0.65)] transition-transform active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              Signing you in
              <span className="material-symbols-outlined animate-spin text-[18px]">
                progress_activity
              </span>
            </>
          ) : (
            <>
              Sign in to DTRS
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 border-t border-outline-variant/60 pt-6 text-center">
        <p className="text-sm text-on-surface-variant">
          Need an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-primary underline-offset-4 transition-colors hover:underline"
          >
            Request access
          </Link>
        </p>
        <p className="mt-4 text-[11px] leading-relaxed text-on-surface-variant/80">
          Authorized use only. Unauthorized access attempts are logged.
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
