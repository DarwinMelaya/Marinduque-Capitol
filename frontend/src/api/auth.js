import bcrypt from "bcryptjs";
import supabase from "../Utils/supabaseClient";

const SESSION_KEY = "dtrs_session";

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

export const isAdmin = (session = getSession()) =>
  session?.role === "ADMIN";

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
