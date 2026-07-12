import supabase from "../Utils/supabaseClient";
import { getSession } from "./auth";

export const DOCUMENT_STATUS = {
  RECEIVED: "RECEIVED",
  FORWARDED: "FORWARDED",
};

export const DOCUMENT_LOCATION = {
  RECORD_OFFICE: "Record Office",
  PROVINCIAL_ADMINISTRATOR: "Provincial Administrator",
};

export const statusLabel = (status) => {
  if (status === DOCUMENT_STATUS.FORWARDED) return "Forwarded";
  if (status === DOCUMENT_STATUS.RECEIVED) return "Received";
  return status || "—";
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const DOCUMENT_SELECT =
  "id, subject, sender, date_received, receiver_name, transaction_code, status, current_location, recorded_by_id, created_at, updated_at";

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
  currentLocation: row.current_location,
  recordedById: row.recorded_by_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const listDocuments = async () => {
  const { data, error } = await supabase
    .from("documents")
    .select(DOCUMENT_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load documents.");
  }

  return (data ?? []).map(mapDocument);
};

/** Documents forwarded to PA and awaiting receive, plus those already at PA. */
export const listProvincialAdministratorDocuments = async () => {
  const { data, error } = await supabase
    .from("documents")
    .select(DOCUMENT_SELECT)
    .or(
      `status.eq.${DOCUMENT_STATUS.FORWARDED},current_location.eq."${DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR}"`,
    )
    .order("updated_at", { ascending: false });

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
    .select(DOCUMENT_SELECT)
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
        status: DOCUMENT_STATUS.RECEIVED,
        current_location: DOCUMENT_LOCATION.RECORD_OFFICE,
        recorded_by_id: session?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .select(DOCUMENT_SELECT)
      .single();

    if (!error) {
      return mapDocument(data);
    }

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
    .select(DOCUMENT_SELECT)
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update document.");
  }

  return mapDocument(data);
};

/** Record Office → Provincial Administrator (awaiting PA receive). */
export const forwardToProvincialAdministrator = async (id) => {
  if (!id) {
    throw new Error("Document id is required.");
  }

  const { data: existing, error: fetchError } = await supabase
    .from("documents")
    .select(DOCUMENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message || "Unable to load document.");
  }

  if (!existing) {
    throw new Error("Document not found.");
  }

  if (existing.status === DOCUMENT_STATUS.FORWARDED) {
    throw new Error("Document is already forwarded to Provincial Administrator.");
  }

  if (
    existing.current_location === DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR
  ) {
    throw new Error("Document is already at Provincial Administrator.");
  }

  const { data, error } = await supabase
    .from("documents")
    .update({
      status: DOCUMENT_STATUS.FORWARDED,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(DOCUMENT_SELECT)
    .single();

  if (error) {
    throw new Error(error.message || "Failed to forward document.");
  }

  return mapDocument(data);
};

/** Provincial Administrator confirms receipt of a forwarded document. */
export const receiveAtProvincialAdministrator = async (id) => {
  if (!id) {
    throw new Error("Document id is required.");
  }

  const { data: existing, error: fetchError } = await supabase
    .from("documents")
    .select(DOCUMENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message || "Unable to load document.");
  }

  if (!existing) {
    throw new Error("Document not found.");
  }

  if (existing.status !== DOCUMENT_STATUS.FORWARDED) {
    throw new Error("Only forwarded documents can be received.");
  }

  const { data, error } = await supabase
    .from("documents")
    .update({
      status: DOCUMENT_STATUS.RECEIVED,
      current_location: DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(DOCUMENT_SELECT)
    .single();

  if (error) {
    throw new Error(error.message || "Failed to receive document.");
  }

  return mapDocument(data);
};
