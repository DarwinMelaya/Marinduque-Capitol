import supabase from "../Utils/supabaseClient";
import { getSession } from "./auth";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const randomSegment = (length = 6) => {
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
};

/** Format: DTRS-YYYYMMDD-XXXXXX — unique tracking code for QR / inter-office receive. */
export const generateTransactionCode = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `DTRS-${y}${m}${d}-${randomSegment(6)}`;
};

const mapDocument = (row) => ({
  id: row.id,
  subject: row.subject,
  sender: row.sender,
  dateReceived: row.date_received,
  receiverName: row.receiver_name,
  transactionCode: row.transaction_code,
  status: row.status,
  recordedById: row.recorded_by_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const listDocuments = async () => {
  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, subject, sender, date_received, receiver_name, transaction_code, status, recorded_by_id, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load documents.");
  }

  return (data ?? []).map(mapDocument);
};

export const getDocumentByCode = async (transactionCode) => {
  const code = transactionCode?.trim().toUpperCase();
  if (!code) {
    throw new Error("Transaction code is required.");
  }

  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, subject, sender, date_received, receiver_name, transaction_code, status, recorded_by_id, created_at, updated_at",
    )
    .eq("transaction_code", code)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to look up document.");
  }

  return data ? mapDocument(data) : null;
};

export const createDocument = async ({
  subject,
  sender,
  dateReceived,
  receiverName,
}) => {
  const trimmedSubject = subject?.trim();
  const trimmedSender = sender?.trim();
  const trimmedReceiver = receiverName?.trim();

  if (!trimmedSubject || !trimmedSender || !dateReceived || !trimmedReceiver) {
    throw new Error("Please fill in all required fields.");
  }

  const session = getSession();
  const maxAttempts = 5;
  let lastError = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const transactionCode = generateTransactionCode(new Date(dateReceived));

    const { data, error } = await supabase
      .from("documents")
      .insert({
        subject: trimmedSubject,
        sender: trimmedSender,
        date_received: dateReceived,
        receiver_name: trimmedReceiver,
        transaction_code: transactionCode,
        status: "RECEIVED",
        recorded_by_id: session?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .select(
        "id, subject, sender, date_received, receiver_name, transaction_code, status, recorded_by_id, created_at, updated_at",
      )
      .single();

    if (!error) {
      return mapDocument(data);
    }

    // Unique violation on transaction_code — retry with a new code
    if (error.code === "23505") {
      lastError = error;
      continue;
    }

    throw new Error(error.message || "Failed to record document.");
  }

  throw new Error(
    lastError?.message ||
      "Could not generate a unique transaction code. Please try again.",
  );
};

export const updateDocument = async (
  id,
  { subject, sender, dateReceived, receiverName },
) => {
  if (!id) {
    throw new Error("Document id is required.");
  }

  const trimmedSubject = subject?.trim();
  const trimmedSender = sender?.trim();
  const trimmedReceiver = receiverName?.trim();

  if (!trimmedSubject || !trimmedSender || !dateReceived || !trimmedReceiver) {
    throw new Error("Please fill in all required fields.");
  }

  const { data, error } = await supabase
    .from("documents")
    .update({
      subject: trimmedSubject,
      sender: trimmedSender,
      date_received: dateReceived,
      receiver_name: trimmedReceiver,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(
      "id, subject, sender, date_received, receiver_name, transaction_code, status, recorded_by_id, created_at, updated_at",
    )
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update document.");
  }

  return mapDocument(data);
};
