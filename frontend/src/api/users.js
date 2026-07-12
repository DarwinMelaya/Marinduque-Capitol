import bcrypt from "bcryptjs";
import supabase from "../Utils/supabaseClient";

export const OFFICE_ROLES = [
  { value: "BudgetOffice", label: "Budget Office" },
  { value: "GovernorOffice", label: "Governor's Office" },
  { value: "ProvincialAdministrator", label: "Provincial Administrator" },
  { value: "RecordOffice", label: "Record Office" },
];

const ASSIGNABLE_ROLES = new Set(OFFICE_ROLES.map((r) => r.value));

export const roleLabel = (role) =>
  OFFICE_ROLES.find((r) => r.value === role)?.label || role;

export const listUsers = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load accounts.");
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    createdAt: row.created_at,
  }));
};

export const createUser = async ({ fullName, email, password, role }) => {
  const trimmedName = fullName?.trim();
  const trimmedEmail = email?.trim().toLowerCase();

  if (!trimmedName || !trimmedEmail || !password || !role) {
    throw new Error("Please fill in all required fields.");
  }

  if (!ASSIGNABLE_ROLES.has(role)) {
    throw new Error("Please select a valid office role.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      full_name: trimmedName,
      email: trimmedEmail,
      password_hash: passwordHash,
      role,
      updated_at: new Date().toISOString(),
    })
    .select("id, email, full_name, role, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("An account with this email already exists.");
    }
    throw new Error(error.message || "Failed to create account.");
  }

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    role: data.role,
    createdAt: data.created_at,
  };
};
