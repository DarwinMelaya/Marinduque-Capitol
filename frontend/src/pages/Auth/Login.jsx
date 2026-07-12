import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";
import toast from "react-hot-toast";
import supabase from "../../Utils/supabaseClient";
import { AuthLayout, fieldClass, labelClass } from "./AuthLayout";

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
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, password_hash")
        .eq("email", form.email.trim().toLowerCase())
        .maybeSingle();

      if (error) {
        toast.error(error.message || "Unable to sign in.");
        return;
      }

      if (!profile) {
        toast.error("Invalid email or password.");
        return;
      }

      const valid = await bcrypt.compare(form.password, profile.password_hash);
      if (!valid) {
        toast.error("Invalid email or password.");
        return;
      }

      localStorage.setItem(
        "dtrs_session",
        JSON.stringify({
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          role: profile.role,
        }),
      );

      toast.success(`Welcome back, ${profile.full_name}`);
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Secure Document System Access"
      description="Sign in with your authorized credentials to access the Government Document Tracking System for Marinduque Capitol."
      highlights={[
        {
          icon: "shield_lock",
          title: "Protected Access",
          body: "Only verified personnel with active accounts can enter the document tracking workspace.",
        },
        {
          icon: "policy",
          title: "Audit Ready",
          body: "Sign-in activity is monitored to maintain compliance and document integrity.",
        },
      ]}
    >
      <div className="md:hidden mb-6 flex justify-between items-center">
        <span className="text-xl font-bold text-primary">DTRS</span>
        <span className="material-symbols-outlined text-primary">login</span>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-primary mb-1">Sign In</h2>
        <p className="text-sm text-on-surface-variant">
          Enter your work credentials to continue.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="group flex flex-col gap-1">
          <label className={labelClass} htmlFor="login_email">
            Work Email
          </label>
          <input
            id="login_email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="j.doe@agency.gov"
            className={fieldClass}
            autoComplete="email"
            required
          />
        </div>

        <div className="group flex flex-col gap-1 relative">
          <label className={labelClass} htmlFor="login_password">
            Password
          </label>
          <input
            id="login_password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={`${fieldClass} pr-12`}
            autoComplete="current-password"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-on-primary py-3.5 px-6 text-sm font-semibold tracking-wide rounded hover:bg-[#0a5c30] active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>
              Signing in...
              <span className="material-symbols-outlined animate-spin text-[18px]">
                progress_activity
              </span>
            </>
          ) : (
            <>
              Sign In
              <span className="material-symbols-outlined text-[18px]">login</span>
            </>
          )}
        </button>

        <div className="pt-4 text-center">
          <p className="text-sm text-on-surface-variant">
            Need access?{" "}
            <Link
              to="/signup"
              className="font-semibold text-primary hover:underline"
            >
              Request an account
            </Link>
          </p>
        </div>
      </form>

      <footer className="mt-8 text-center">
        <p className="text-xs text-on-surface-variant">
          Authorized use only. Unauthorized access is prohibited.
        </p>
      </footer>
    </AuthLayout>
  );
};

export default Login;
