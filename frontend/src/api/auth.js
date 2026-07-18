import bcrypt from "bcryptjs";
import supabase from "../Utils/supabaseClient";

const SESSION_KEY = "dtrs_session";
const REMEMBER_KEY = "dtrs_remembered";

export const getSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setSession = (session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const getRememberedCredentials = () => {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.email) return null;
    return {
      email: parsed.email,
      password: parsed.password || "",
    };
  } catch {
    return null;
  }
};

export const setRememberedCredentials = ({ email, password }) => {
  localStorage.setItem(
    REMEMBER_KEY,
    JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  );
};

export const clearRememberedCredentials = () => {
  localStorage.removeItem(REMEMBER_KEY);
};

export const isAdmin = (session = getSession()) =>
  session?.role === "ADMIN";

export const isRecordOffice = (session = getSession()) =>
  session?.role === "RecordOffice";

export const isProvincialAdministrator = (session = getSession()) =>
  session?.role === "ProvincialAdministrator";

export const isBudgetOffice = (session = getSession()) =>
  session?.role === "BudgetOffice";

export const isGovernorOffice = (session = getSession()) =>
  session?.role === "GovernorOffice";

export const getHomePath = (session = getSession()) => {
  if (!session) return "/login";
  if (session.role === "ADMIN") return "/admin";
  if (session.role === "RecordOffice") return "/record-office";
  if (session.role === "ProvincialAdministrator") {
    return "/provincial-administrator";
  }
  if (session.role === "BudgetOffice") return "/budget-office";
  if (session.role === "GovernorOffice") return "/governor-office";
  return "/";
};

export const loginWithCredentials = async (email, password) => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, password_hash")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to sign in.");
  }

  if (!profile) {
    throw new Error("Invalid email or password.");
  }

  const valid = await bcrypt.compare(password, profile.password_hash);
  if (!valid) {
    throw new Error("Invalid email or password.");
  }

  const session = {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
  };

  setSession(session);
  return session;
};

export const logout = () => {
  clearSession();
};
