import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  DOCUMENT_LOCATION,
  DOCUMENT_STATUS,
  forwardToBudgetOffice,
  listProvincialAdministratorDocuments,
  receiveAtProvincialAdministrator,
  returnToRecordOffice,
  statusLabel,
} from "../../api/documents";
import { getSession } from "../../api/auth";
import ViewRecord from "../../Components/Modals/RecordOffice/ViewRecord";

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const ProvincialAdministratorRecords = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receivingId, setReceivingId] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [tab, setTab] = useState("incoming");
  const [receiveTarget, setReceiveTarget] = useState(null);
  const [receiverName, setReceiverName] = useState("");
  const [returningId, setReturningId] = useState(null);
  const [forwardingId, setForwardingId] = useState(null);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const rows = await listProvincialAdministratorDocuments();
      setDocuments(rows);
    } catch (err) {
      toast.error(err.message || "Unable to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const incoming = useMemo(
    () => documents.filter((d) => d.status === DOCUMENT_STATUS.FORWARDED),
    [documents],
  );

  const received = useMemo(
    () =>
      documents.filter(
        (d) =>
          d.currentLocation === DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR,
      ),
    [documents],
  );

  const rows = tab === "incoming" ? incoming : received;

  const openReceive = (doc) => {
    const session = getSession();
    setReceiverName(session?.fullName || "");
    setReceiveTarget(doc);
  };

  const closeReceive = () => {
    if (receivingId) return;
    setReceiveTarget(null);
    setReceiverName("");
  };

  const handleReceive = async (event) => {
    event?.preventDefault();
    if (!receiveTarget) return;

    const name = receiverName.trim();
    if (!name) {
      toast.error("Please enter who received the document.");
      return;
    }

    setReceivingId(receiveTarget.id);
    try {
      const updated = await receiveAtProvincialAdministrator(
        receiveTarget.id,
        name,
      );
      toast.success(
        `Received by ${updated.receivedByName} — now at ${DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR}`,
      );
      setDocuments((prev) =>
        prev.map((row) => (row.id === updated.id ? updated : row)),
      );
      setViewingDoc((prev) => (prev?.id === updated.id ? updated : prev));
      setReceiveTarget(null);
      setReceiverName("");
    } catch (err) {
      toast.error(err.message || "Failed to receive document.");
    } finally {
      setReceivingId(null);
    }
  };

  const handleReturn = async (doc) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Return "${doc.subject}" back to ${DOCUMENT_LOCATION.RECORD_OFFICE}?`,
      )
    ) {
      return;
    }

    setReturningId(doc.id);
    try {
      const updated = await returnToRecordOffice(doc.id);
      toast.success(`Returned to ${DOCUMENT_LOCATION.RECORD_OFFICE}.`);
      setDocuments((prev) =>
        prev.map((row) => (row.id === updated.id ? updated : row)),
      );
      setViewingDoc((prev) => (prev?.id === updated.id ? updated : prev));
    } catch (err) {
      toast.error(err.message || "Failed to return document.");
    } finally {
      setReturningId(null);
    }
  };

  const handleForwardToBudget = async (doc) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Forward "${doc.subject}" to ${DOCUMENT_LOCATION.BUDGET_OFFICE}?`,
      )
    ) {
      return;
    }

    setForwardingId(doc.id);
    try {
      const updated = await forwardToBudgetOffice(doc.id);
      toast.success(`Forwarded to ${DOCUMENT_LOCATION.BUDGET_OFFICE}.`);
      setDocuments((prev) =>
        prev.map((row) => (row.id === updated.id ? updated : row)),
      );
      setViewingDoc((prev) => (prev?.id === updated.id ? updated : prev));
    } catch (err) {
      toast.error(err.message || "Failed to forward document.");
    } finally {
      setForwardingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a6a08a]">
          Provincial Administrator
        </p>
        <h1 className="text-2xl font-bold text-[#607796] mt-1">Records</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Receive forwarded documents from Record Office. After receive, status
          becomes Received and current location is Provincial Administrator.
        </p>
      </div>

      <div className="rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="inline-flex rounded-lg border border-[#607796]/15 p-1 bg-[#607796]/5">
            <button
              type="button"
              onClick={() => setTab("incoming")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === "incoming"
                  ? "bg-[#607796] text-white"
                  : "text-[#607796] hover:bg-white/70"
              }`}
            >
              Incoming ({incoming.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("received")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === "received"
                  ? "bg-[#607796] text-white"
                  : "text-[#607796] hover:bg-white/70"
              }`}
            >
              At this office ({received.length})
            </button>
          </div>
          <button
            type="button"
            onClick={loadDocuments}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#607796]/20 px-3 py-1.5 text-xs font-semibold text-[#607796] hover:bg-[#607796]/5"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-on-surface-variant py-6 text-center">
            Loading...
          </p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-6 text-center">
            {tab === "incoming"
              ? "No forwarded documents waiting to be received."
              : "No documents currently at Provincial Administrator."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#607796]/15 text-[11px] uppercase tracking-wider text-[#a6a08a]">
                  <th className="pb-2 pr-4 font-semibold">Code</th>
                  <th className="pb-2 pr-4 font-semibold">Subject</th>
                  <th className="pb-2 pr-4 font-semibold">Sender</th>
                  <th className="pb-2 pr-4 font-semibold">Date</th>
                  <th className="pb-2 pr-4 font-semibold">Status</th>
                  <th className="pb-2 pr-4 font-semibold">Location</th>
                  <th className="pb-2 pr-4 font-semibold">Received by</th>
                  <th className="pb-2 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-[#607796]/08 last:border-0"
                  >
                    <td className="py-3 pr-4 font-mono text-xs font-semibold text-[#607796]">
                      {doc.transactionCode}
                    </td>
                    <td className="py-3 pr-4 font-medium text-[#3f5168]">
                      {doc.subject}
                    </td>
                    <td className="py-3 pr-4 text-on-surface-variant">
                      {doc.sender}
                    </td>
                    <td className="py-3 pr-4 text-on-surface-variant">
                      {formatDate(doc.dateReceived)}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex rounded-md bg-[#607796]/10 px-2 py-1 text-xs font-semibold text-[#607796]">
                        {statusLabel(doc.status)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-on-surface-variant">
                      {doc.currentLocation}
                    </td>
                    <td className="py-3 pr-4 text-on-surface-variant">
                      {doc.receivedByName || "—"}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingDoc(doc)}
                          className="inline-flex items-center justify-center rounded-md p-1.5 text-[#607796] hover:bg-[#607796]/10"
                          title="View record & QR"
                          aria-label="View record"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            visibility
                          </span>
                        </button>
                        {doc.status === DOCUMENT_STATUS.FORWARDED && (
                          <button
                            type="button"
                            onClick={() => openReceive(doc)}
                            disabled={receivingId === doc.id}
                            className="inline-flex items-center gap-1 rounded-md bg-[#607796] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#4d627c] disabled:opacity-50"
                            title="Confirm receive"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              move_to_inbox
                            </span>
                            {receivingId === doc.id ? "Receiving..." : "Receive"}
                          </button>
                        )}
                        {doc.currentLocation ===
                          DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR && (
                          <button
                            type="button"
                            onClick={() => handleReturn(doc)}
                            disabled={returningId === doc.id}
                            className="inline-flex items-center gap-1 rounded-md border border-[#b8894a]/40 bg-[#b8894a]/10 px-2.5 py-1.5 text-xs font-semibold text-[#8a5f2b] hover:bg-[#b8894a]/20 disabled:opacity-50"
                            title="Return to Record Office"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              undo
                            </span>
                            {returningId === doc.id ? "Returning..." : "Return"}
                          </button>
                        )}
                        {doc.currentLocation ===
                          DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR && (
                          <button
                            type="button"
                            onClick={() => handleForwardToBudget(doc)}
                            disabled={forwardingId === doc.id}
                            className="inline-flex items-center gap-1 rounded-md bg-[#607796] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#4d627c] disabled:opacity-50"
                            title="Forward to Budget Office"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              send
                            </span>
                            {forwardingId === doc.id
                              ? "Forwarding..."
                              : "Forward to Budget"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ViewRecord
        open={Boolean(viewingDoc)}
        document={viewingDoc}
        onClose={() => setViewingDoc(null)}
      />

      {receiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleReceive}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-bold text-[#607796]">
              Receive document
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {receiveTarget.transactionCode} — {receiveTarget.subject}
            </p>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-[#a6a08a]">
              Received by
            </label>
            <input
              type="text"
              autoFocus
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="Full name of the person who received"
              className="mt-1 w-full rounded-md border border-[#607796]/25 px-3 py-2 text-sm text-[#3f5168] focus:border-[#607796] focus:outline-none"
            />

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeReceive}
                disabled={Boolean(receivingId)}
                className="rounded-md border border-[#607796]/20 px-3 py-1.5 text-xs font-semibold text-[#607796] hover:bg-[#607796]/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={Boolean(receivingId)}
                className="inline-flex items-center gap-1 rounded-md bg-[#607796] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4d627c] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  move_to_inbox
                </span>
                {receivingId ? "Receiving..." : "Confirm receive"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProvincialAdministratorRecords;
