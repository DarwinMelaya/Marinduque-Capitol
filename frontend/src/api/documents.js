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

const STATUS_LABELS = {
  [DOCUMENT_STATUS.RECEIVED]: "Received",
  [DOCUMENT_STATUS.FORWARDED]: "Forwarded",
  [DOCUMENT_STATUS.UNDER_REVIEW]: "Under Review",
  [DOCUMENT_STATUS.RETURNED]: "Returned",
  [DOCUMENT_STATUS.PROCESSING]: "Processing",
  [DOCUMENT_STATUS.FOR_SIGNATURE]: "For Signature",
  [DOCUMENT_STATUS.APPROVED]: "Approved",
  [DOCUMENT_STATUS.COMPLETED]: "Completed",
};

export const statusLabel = (status) => STATUS_LABELS[status] || status || "—";

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

/** Await a Supabase query and throw a friendly error if it failed. */
const run = async (query, fallbackMessage) => {
  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
  return data;
};

const requireId = (id) => {
  if (!id) {
    throw new Error("Document id is required.");
  }
};

const documents = () => supabase.from("documents").select(DOCUMENT_SELECT);

/** Load a single document by id or throw if it does not exist. */
const fetchDocumentRow = async (id) => {
  const row = await run(
    documents().eq("id", id).maybeSingle(),
    "Unable to load document.",
  );
  if (!row) {
    throw new Error("Document not found.");
  }
  return row;
};

/** Apply a partial update (updated_at is always refreshed) and return the mapped row. */
const applyUpdate = async (id, patch, fallbackMessage) => {
  const data = await run(
    supabase
      .from("documents")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(DOCUMENT_SELECT)
      .single(),
    fallbackMessage,
  );
  return mapDocument(data);
};

/**
 * Shared workflow transition: validate id, load the current row, run a guard
 * against it, then apply the update. Keeps every office hand-off consistent.
 */
const transition = async (id, { guard, patch, fallbackMessage }) => {
  requireId(id);
  const existing = await fetchDocumentRow(id);
  guard?.(existing);
  return applyUpdate(id, patch, fallbackMessage);
};

/** Transition performed by a signed-in user confirming receipt of a document. */
const receiveTransition = async (
  id,
  receivedByName,
  { guard, status, location, fallbackMessage },
) => {
  requireId(id);
  const trimmedReceiver = receivedByName?.trim();
  if (!trimmedReceiver) {
    throw new Error("Please enter who received the document.");
  }

  const existing = await fetchDocumentRow(id);
  guard(existing);

  const session = getSession();
  if (!session?.id) {
    throw new Error("You must be signed in to receive a document.");
  }

  return applyUpdate(
    id,
    {
      status,
      current_location: location,
      received_by_id: session.id,
      received_by_name: trimmedReceiver,
      received_at: new Date().toISOString(),
    },
    fallbackMessage,
  );
};

const listMapped = async (query) => {
  const data = await run(query, "Unable to load documents.");
  return (data ?? []).map(mapDocument);
};

export const listDocuments = () =>
  listMapped(documents().order("created_at", { ascending: false }));

/** Documents forwarded to PA and awaiting receive, plus those already at PA. */
export const listProvincialAdministratorDocuments = () =>
  listMapped(
    documents()
      .or(
        `and(status.eq.${DOCUMENT_STATUS.FORWARDED},current_location.eq."${DOCUMENT_LOCATION.RECORD_OFFICE}"),current_location.eq."${DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR}"`,
      )
      .order("updated_at", { ascending: false }),
  );

/** Documents forwarded to Budget Office and awaiting receive, plus those already there. */
export const listBudgetOfficeDocuments = () =>
  listMapped(
    documents()
      .eq("current_location", DOCUMENT_LOCATION.BUDGET_OFFICE)
      .order("updated_at", { ascending: false }),
  );

/** Documents forwarded to Governor Office and awaiting receive, plus those already there. */
export const listGovernorOfficeDocuments = () =>
  listMapped(
    documents()
      .eq("current_location", DOCUMENT_LOCATION.GOVERNOR_OFFICE)
      .order("updated_at", { ascending: false }),
  );

export const getDocumentByCode = async (transactionCode) => {
  const code = transactionCode?.trim().toUpperCase();
  if (!code) {
    throw new Error("Transaction code is required.");
  }

  const data = await run(
    documents().eq("transaction_code", code).maybeSingle(),
    "Unable to look up document.",
  );

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
  requireId(id);

  const trimmedSubject = subject?.trim();
  const trimmedSender = sender?.trim();
  const trimmedReceiver = receiverName?.trim();

  if (!trimmedSubject || !trimmedSender || !dateReceived || !trimmedReceiver) {
    throw new Error("Please fill in all required fields.");
  }

  return applyUpdate(
    id,
    {
      subject: trimmedSubject,
      sender: trimmedSender,
      date_received: dateReceived,
      receiver_name: trimmedReceiver,
    },
    "Failed to update document.",
  );
};

/** Record Office → Provincial Administrator (awaiting PA receive). */
export const forwardToProvincialAdministrator = (id) =>
  transition(id, {
    guard: (existing) => {
      if (existing.status === DOCUMENT_STATUS.FORWARDED) {
        throw new Error(
          "Document is already forwarded to Provincial Administrator.",
        );
      }
      if (
        existing.current_location === DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR
      ) {
        throw new Error("Document is already at Provincial Administrator.");
      }
    },
    patch: { status: DOCUMENT_STATUS.FORWARDED },
    fallbackMessage: "Failed to forward document.",
  });

/** Provincial Administrator confirms receipt of a forwarded document. */
export const receiveAtProvincialAdministrator = (id, receivedByName) =>
  receiveTransition(id, receivedByName, {
    guard: (existing) => {
      if (existing.status !== DOCUMENT_STATUS.FORWARDED) {
        throw new Error("Only forwarded documents can be received.");
      }
    },
    status: DOCUMENT_STATUS.UNDER_REVIEW,
    location: DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR,
    fallbackMessage: "Failed to receive document.",
  });

/** Provincial Administrator returns a received document back to Record Office. */
export const returnToRecordOffice = (id) =>
  transition(id, {
    guard: (existing) => {
      if (
        existing.current_location !==
        DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR
      ) {
        throw new Error(
          "Only documents currently at Provincial Administrator can be returned.",
        );
      }
    },
    patch: {
      status: DOCUMENT_STATUS.RETURNED,
      current_location: DOCUMENT_LOCATION.RECORD_OFFICE,
    },
    fallbackMessage: "Failed to return document.",
  });

/** Provincial Administrator → Budget Office (awaiting Budget Office receive). */
export const forwardToBudgetOffice = (id) =>
  transition(id, {
    guard: (existing) => {
      if (
        existing.current_location !==
        DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR
      ) {
        throw new Error(
          "Only documents at Provincial Administrator can be forwarded to Budget Office.",
        );
      }
    },
    patch: {
      status: DOCUMENT_STATUS.FORWARDED,
      current_location: DOCUMENT_LOCATION.BUDGET_OFFICE,
    },
    fallbackMessage: "Failed to forward document.",
  });

/** Budget Office confirms receipt of a forwarded document (starts processing). */
export const receiveAtBudgetOffice = (id, receivedByName) =>
  receiveTransition(id, receivedByName, {
    guard: (existing) => {
      if (
        existing.status !== DOCUMENT_STATUS.FORWARDED ||
        existing.current_location !== DOCUMENT_LOCATION.BUDGET_OFFICE
      ) {
        throw new Error(
          "Only documents forwarded to Budget Office can be received.",
        );
      }
    },
    status: DOCUMENT_STATUS.PROCESSING,
    location: DOCUMENT_LOCATION.BUDGET_OFFICE,
    fallbackMessage: "Failed to receive document.",
  });

/** Budget Office → Governor Office (awaiting Governor Office receive). */
export const forwardToGovernorOffice = (id) =>
  transition(id, {
    guard: (existing) => {
      if (existing.current_location !== DOCUMENT_LOCATION.BUDGET_OFFICE) {
        throw new Error(
          "Only documents at Budget Office can be forwarded to Governor Office.",
        );
      }
    },
    patch: {
      status: DOCUMENT_STATUS.FORWARDED,
      current_location: DOCUMENT_LOCATION.GOVERNOR_OFFICE,
    },
    fallbackMessage: "Failed to forward document.",
  });

/** Governor Office confirms receipt of a forwarded document (queues for signature). */
export const receiveAtGovernorOffice = (id, receivedByName) =>
  receiveTransition(id, receivedByName, {
    guard: (existing) => {
      if (
        existing.status !== DOCUMENT_STATUS.FORWARDED ||
        existing.current_location !== DOCUMENT_LOCATION.GOVERNOR_OFFICE
      ) {
        throw new Error(
          "Only documents forwarded to Governor Office can be received.",
        );
      }
    },
    status: DOCUMENT_STATUS.FOR_SIGNATURE,
    location: DOCUMENT_LOCATION.GOVERNOR_OFFICE,
    fallbackMessage: "Failed to receive document.",
  });

/** Governor signs the document (For Signature → Approved). */
export const signAtGovernorOffice = (id) =>
  transition(id, {
    guard: (existing) => {
      if (
        existing.status !== DOCUMENT_STATUS.FOR_SIGNATURE ||
        existing.current_location !== DOCUMENT_LOCATION.GOVERNOR_OFFICE
      ) {
        throw new Error("Only documents for signature can be signed.");
      }
    },
    patch: { status: DOCUMENT_STATUS.APPROVED },
    fallbackMessage: "Failed to sign document.",
  });

/** Release: Record Office receives the signed document (Approved → Completed). */
export const receiveSignedAtRecordOffice = (id) =>
  transition(id, {
    guard: (existing) => {
      if (existing.status !== DOCUMENT_STATUS.APPROVED) {
        throw new Error("Only approved (signed) documents can be released.");
      }
    },
    patch: {
      status: DOCUMENT_STATUS.COMPLETED,
      current_location: DOCUMENT_LOCATION.RECORD_OFFICE,
    },
    fallbackMessage: "Failed to release document.",
  });
