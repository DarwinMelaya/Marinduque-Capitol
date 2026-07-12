import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  clearRememberedCredentials,
  getHomePath,
  getRememberedCredentials,
  loginWithCredentials,
  setRememberedCredentials,
} from "../../api/auth";

const loadInitialForm = () => {
  const remembered = getRememberedCredentials();
  if (!remembered) {
    return { email: "", password: "", rememberMe: false };
  }
  return {
    email: remembered.email,
    password: remembered.password,
    rememberMe: true,
  };
};

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(loadInitialForm);

  const handleChange = (e) => {
    setError(null);
    const { name, type, checked, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const session = await loginWithCredentials(form.email, form.password);

      if (form.rememberMe) {
        setRememberedCredentials({
          email: form.email,
          password: form.password,
        });
      } else {
        clearRememberedCredentials();
      }

      toast.success(`Welcome back, ${session.fullName}`);
      navigate(getHomePath(session), { replace: true });
    } catch (err) {
      setError(err.message || "Invalid email or password");
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

      <div className="relative z-10 max-w-md w-full p-8 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl auth-fade-up">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/img/logo.png"
            alt="Lalawigan ng Marinduque"
            className="h-24 w-auto drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]"
          />
          <h1 className="mt-4 text-center text-lg sm:text-xl font-extrabold tracking-[0.12em] text-white">
            GOVERNMENT OF MARINDUQUE
          </h1>
          <p className="mt-1 text-center text-xs font-semibold tracking-[0.22em] uppercase text-[#ebe6d6]">
            DTRS · Document Tracking System
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-300/40 text-red-100 px-4 py-3 rounded-md text-sm backdrop-blur-sm">
            {error}
          </div>
        )}

        <form className="mt-2 space-y-8" onSubmit={handleSubmit}>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="peer mt-1 block w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-md text-white placeholder-transparent backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#a6a08a]/60 focus:border-transparent"
              placeholder="Enter email"
              value={form.email}
              onChange={handleChange}
            />
            <label
              htmlFor="email"
              className="absolute left-3 -top-6 text-sm text-white/90 peer-placeholder-shown:text-base peer-placeholder-shown:text-white/50 peer-placeholder-shown:top-2.5 transition-all peer-focus:-top-6 peer-focus:text-sm peer-focus:text-[#ebe6d6]"
            >
              Work Email
            </label>
          </div>

          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              className="peer mt-1 block w-full px-3 py-2.5 pr-11 bg-white/10 border border-white/20 rounded-md text-white placeholder-transparent backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#a6a08a]/60 focus:border-transparent"
              placeholder="Enter password"
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
            <label
              htmlFor="password"
              className="absolute left-3 -top-6 text-sm text-white/90 peer-placeholder-shown:text-base peer-placeholder-shown:text-white/50 peer-placeholder-shown:top-2.5 transition-all peer-focus:-top-6 peer-focus:text-sm peer-focus:text-[#ebe6d6]"
            >
              Password
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 -mt-3">
            <label
              htmlFor="rememberMe"
              className="inline-flex items-center gap-2 cursor-pointer select-none text-sm text-white/85"
            >
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={form.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 rounded border-white/30 bg-white/10 text-[#607796] focus:ring-[#a6a08a]/60 focus:ring-offset-0"
              />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-white/20 rounded-md text-sm font-semibold text-white bg-[#607796]/85 hover:bg-[#4d627c]/95 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_0_18px_rgba(96,119,150,0.55)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/75">
          Need access?{" "}
          <Link
            to="/signup"
            className="font-semibold text-[#ebe6d6] hover:text-white transition-colors"
          >
            Request an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
