import supabase from "../Utils/supabaseClient";
import { getSession } from "./auth";

export const DOCUMENT_STATUS = {
  RECEIVED: "RECEIVED",
  FORWARDED: "FORWARDED",
  UNDER_REVIEW: "UNDER_REVIEW",
  RETURNED: "RETURNED",
  PROCESSING: "PROCESSING",
  FOR_SIGNATURE: "FOR_SIGNATURE",
  APPROVED: "APPROVED",
  COMPLETED: "COMPLETED",
};

export const DOCUMENT_LOCATION = {
  RECORD_OFFICE: "Record Office",
  PROVINCIAL_ADMINISTRATOR: "Provincial Administrator",
  BUDGET_OFFICE: "Budget Office",
  GOVERNOR_OFFICE: "Governor Office",
};

export const statusLabel = (status) => {
  if (status === DOCUMENT_STATUS.FORWARDED) return "Forwarded";
  if (status === DOCUMENT_STATUS.RECEIVED) return "Received";
  if (status === DOCUMENT_STATUS.UNDER_REVIEW) return "Under Review";
  if (status === DOCUMENT_STATUS.RETURNED) return "Returned";
  if (status === DOCUMENT_STATUS.PROCESSING) return "Processing";
  if (status === DOCUMENT_STATUS.FOR_SIGNATURE) return "For Signature";
  if (status === DOCUMENT_STATUS.APPROVED) return "Approved";
  if (status === DOCUMENT_STATUS.COMPLETED) return "Completed";
  return status || "—";
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const DOCUMENT_SELECT =
  "id, subject, sender, date_received, receiver_name, transaction_code, status, current_location, recorded_by_id, received_by_id, received_by_name, received_at, created_at, updated_at";

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
  receivedById: row.received_by_id,
  receivedByName: row.received_by_name,
  receivedAt: row.received_at,
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
      `and(status.eq.${DOCUMENT_STATUS.FORWARDED},current_location.eq."${DOCUMENT_LOCATION.RECORD_OFFICE}"),current_location.eq."${DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR}"`,
    )
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load documents.");
  }

  return (data ?? []).map(mapDocument);
};

/** Documents forwarded to Budget Office and awaiting receive, plus those already there. */
export const listBudgetOfficeDocuments = async () => {
  const { data, error } = await supabase
    .from("documents")
    .select(DOCUMENT_SELECT)
    .eq("current_location", DOCUMENT_LOCATION.BUDGET_OFFICE)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load documents.");
  }

  return (data ?? []).map(mapDocument);
};

/** Documents forwarded to Governor Office and awaiting receive, plus those already there. */
export const listGovernorOfficeDocuments = async () => {
  const { data, error } = await supabase
    .from("documents")
    .select(DOCUMENT_SELECT)
    .eq("current_location", DOCUMENT_LOCATION.GOVERNOR_OFFICE)
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
export const receiveAtProvincialAdministrator = async (id, receivedByName) => {
  if (!id) {
    throw new Error("Document id is required.");
  }

  const trimmedReceiver = receivedByName?.trim();
  if (!trimmedReceiver) {
    throw new Error("Please enter who received the document.");
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

  const session = getSession();
  if (!session?.id) {
    throw new Error("You must be signed in to receive a document.");
  }

  const { data, error } = await supabase
    .from("documents")
    .update({
      status: DOCUMENT_STATUS.UNDER_REVIEW,
      current_location: DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR,
      received_by_id: session.id,
      received_by_name: trimmedReceiver,
      received_at: new Date().toISOString(),
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

/** Provincial Administrator returns a received document back to Record Office. */
export const returnToRecordOffice = async (id) => {
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

  if (
    existing.current_location !== DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR
  ) {
    throw new Error(
      "Only documents currently at Provincial Administrator can be returned.",
    );
  }

  const { data, error } = await supabase
    .from("documents")
    .update({
      status: DOCUMENT_STATUS.RETURNED,
      current_location: DOCUMENT_LOCATION.RECORD_OFFICE,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(DOCUMENT_SELECT)
    .single();

  if (error) {
    throw new Error(error.message || "Failed to return document.");
  }

  return mapDocument(data);
};

/** Provincial Administrator → Budget Office (awaiting Budget Office receive). */
export const forwardToBudgetOffice = async (id) => {
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

  if (
    existing.current_location !== DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR
  ) {
    throw new Error(
      "Only documents at Provincial Administrator can be forwarded to Budget Office.",
    );
  }

  const { data, error } = await supabase
    .from("documents")
    .update({
      status: DOCUMENT_STATUS.FORWARDED,
      current_location: DOCUMENT_LOCATION.BUDGET_OFFICE,
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

/** Budget Office confirms receipt of a forwarded document (starts processing). */
export const receiveAtBudgetOffice = async (id, receivedByName) => {
  if (!id) {
    throw new Error("Document id is required.");
  }

  const trimmedReceiver = receivedByName?.trim();
  if (!trimmedReceiver) {
    throw new Error("Please enter who received the document.");
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

  if (
    existing.status !== DOCUMENT_STATUS.FORWARDED ||
    existing.current_location !== DOCUMENT_LOCATION.BUDGET_OFFICE
  ) {
    throw new Error("Only documents forwarded to Budget Office can be received.");
  }

  const session = getSession();
  if (!session?.id) {
    throw new Error("You must be signed in to receive a document.");
  }

  const { data, error } = await supabase
    .from("documents")
    .update({
      status: DOCUMENT_STATUS.PROCESSING,
      current_location: DOCUMENT_LOCATION.BUDGET_OFFICE,
      received_by_id: session.id,
      received_by_name: trimmedReceiver,
      received_at: new Date().toISOString(),
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

/** Budget Office → Governor Office (awaiting Governor Office receive). */
export const forwardToGovernorOffice = async (id) => {
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

  if (existing.current_location !== DOCUMENT_LOCATION.BUDGET_OFFICE) {
    throw new Error(
      "Only documents at Budget Office can be forwarded to Governor Office.",
    );
  }

  const { data, error } = await supabase
    .from("documents")
    .update({
      status: DOCUMENT_STATUS.FORWARDED,
      current_location: DOCUMENT_LOCATION.GOVERNOR_OFFICE,
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

/** Governor Office confirms receipt of a forwarded document (queues for signature). */
export const receiveAtGovernorOffice = async (id, receivedByName) => {
  if (!id) {
    throw new Error("Document id is required.");
  }

  const trimmedReceiver = receivedByName?.trim();
  if (!trimmedReceiver) {
    throw new Error("Please enter who received the document.");
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

  if (
    existing.status !== DOCUMENT_STATUS.FORWARDED ||
    existing.current_location !== DOCUMENT_LOCATION.GOVERNOR_OFFICE
  ) {
    throw new Error(
      "Only documents forwarded to Governor Office can be received.",
    );
  }

  const session = getSession();
  if (!session?.id) {
    throw new Error("You must be signed in to receive a document.");
  }

  const { data, error } = await supabase
    .from("documents")
    .update({
      status: DOCUMENT_STATUS.FOR_SIGNATURE,
      current_location: DOCUMENT_LOCATION.GOVERNOR_OFFICE,
      received_by_id: session.id,
      received_by_name: trimmedReceiver,
      received_at: new Date().toISOString(),
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

/** Governor signs the document (For Signature → Approved). */
export const signAtGovernorOffice = async (id) => {
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

  if (
    existing.status !== DOCUMENT_STATUS.FOR_SIGNATURE ||
    existing.current_location !== DOCUMENT_LOCATION.GOVERNOR_OFFICE
  ) {
    throw new Error("Only documents for signature can be signed.");
  }

  const { data, error } = await supabase
    .from("documents")
    .update({
      status: DOCUMENT_STATUS.APPROVED,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(DOCUMENT_SELECT)
    .single();

  if (error) {
    throw new Error(error.message || "Failed to sign document.");
  }

  return mapDocument(data);
};

/** Release: Record Office receives the signed document (Approved → Completed). */
export const receiveSignedAtRecordOffice = async (id) => {
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

  if (existing.status !== DOCUMENT_STATUS.APPROVED) {
    throw new Error("Only approved (signed) documents can be released.");
  }

  const { data, error } = await supabase
    .from("documents")
    .update({
      status: DOCUMENT_STATUS.COMPLETED,
      current_location: DOCUMENT_LOCATION.RECORD_OFFICE,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(DOCUMENT_SELECT)
    .single();

  if (error) {
    throw new Error(error.message || "Failed to release document.");
  }

  return mapDocument(data);
};
