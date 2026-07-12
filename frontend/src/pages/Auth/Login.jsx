import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginWithCredentials } from "../../api/auth";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setError(null);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
      toast.success(`Welcome back, ${session.fullName}`);

      if (session.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
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
        <div className="flex justify-center mb-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 border border-white/25 backdrop-blur-sm drop-shadow-[0_0_15px_rgba(166,160,138,0.35)]">
            <span
              className="material-symbols-outlined text-[42px] text-[#ebe6d6]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_balance
            </span>
          </div>
        </div>

        <h1 className="text-center text-3xl sm:text-4xl font-extrabold mb-2 tracking-[0.18em] text-white bg-gradient-to-r from-[#607796]/85 to-[#4d627c]/85 px-6 py-3 rounded-xl backdrop-blur-md shadow-[0_0_25px_rgba(96,119,150,0.4)] border-2 border-white/30">
          DTRS
        </h1>
        <p className="text-center text-sm font-medium tracking-[0.2em] uppercase text-[#ebe6d6] mb-8">
          Marinduque Capitol
        </p>

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
