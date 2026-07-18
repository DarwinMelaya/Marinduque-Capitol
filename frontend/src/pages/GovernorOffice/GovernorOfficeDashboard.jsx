import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  DOCUMENT_STATUS,
  listGovernorOfficeDocuments,
  receiveAtGovernorOffice,
  signAtGovernorOffice,
} from "../../api/documents";
import { upsertById } from "../../Utils/documentHelpers";
import { useReceiveFlow } from "../../hooks/useReceiveFlow";
import RecieveModal from "../../Components/Modals/GovernorOffice/RecieveModal";
import ReceiveConfirmModal from "../../Components/Modals/ReceiveConfirmModal";

const GovernorOfficeDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signingId, setSigningId] = useState(null);
  const [scanOpen, setScanOpen] = useState(false);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listGovernorOfficeDocuments();
      setDocuments(rows);
    } catch (err) {
      toast.error(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const pendingDocuments = useMemo(
    () => documents.filter((d) => d.status === DOCUMENT_STATUS.FORWARDED),
    [documents],
  );

  const forSignatureDocuments = useMemo(
    () => documents.filter((d) => d.status === DOCUMENT_STATUS.FOR_SIGNATURE),
    [documents],
  );

  const approvedCount = useMemo(
    () => documents.filter((d) => d.status === DOCUMENT_STATUS.APPROVED).length,
    [documents],
  );

  const cards = [
    {
      label: "Awaiting receive",
      value: pendingDocuments.length,
      icon: "inbox",
      hint: "Forwarded from Budget Office",
    },
    {
      label: "For signature",
      value: forSignatureDocuments.length,
      icon: "draw",
      hint: "Received, waiting for the Governor",
    },
    {
      label: "Approved",
      value: approvedCount,
      icon: "verified",
      hint: "Signed and ready for release",
    },
  ];

  const upsert = (updated) => {
    setDocuments((prev) => upsertById(prev, updated));
  };

  const receive = useReceiveFlow({
    receiveFn: receiveAtGovernorOffice,
    onReceived: upsert,
    successMessage: (doc) => `Received by ${doc.receivedByName} — For Signature`,
  });

  const handleSign = async (doc) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Sign and approve "${doc.subject}"?`)
    ) {
      return;
    }

    setSigningId(doc.id);
    try {
      const updated = await signAtGovernorOffice(doc.id);
      toast.success("Document signed — Approved.");
      upsert(updated);
    } catch (err) {
      toast.error(err.message || "Failed to sign document.");
    } finally {
      setSigningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a6a08a]">
            Governor Office
          </p>
          <h1 className="text-2xl font-bold text-[#607796] mt-1">Dashboard</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Receive documents forwarded from Budget Office and sign them for
            approval.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setScanOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[#607796] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4d627c]"
          >
            <span className="material-symbols-outlined text-[18px]">
              qr_code_scanner
            </span>
            Scan / receive
          </button>
          <Link
            to="/governor-office/records"
            className="inline-flex items-center gap-2 rounded-md border border-[#607796]/20 bg-white/70 px-4 py-2.5 text-sm font-semibold text-[#607796] hover:bg-[#607796]/5"
          >
            <span className="material-symbols-outlined text-[18px]">
              folder_open
            </span>
            Open records
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a6a08a]">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-[#3f5168]">
                  {loading ? "—" : card.value}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {card.hint}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#607796]/10 border border-[#a6a08a]/30">
                <span className="material-symbols-outlined text-[#607796]">
                  {card.icon}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#3f5168]">
              Pending Documents
            </h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Forwarded from Budget Office, awaiting your receive.
            </p>
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
          <p className="py-6 text-center text-sm text-on-surface-variant">
            Loading...
          </p>
        ) : pendingDocuments.length === 0 ? (
          <p className="py-6 text-center text-sm text-on-surface-variant">
            No pending documents.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#607796]/15 text-[11px] uppercase tracking-wider text-[#a6a08a]">
                  <th className="pb-2 pr-4 font-semibold">Code</th>
                  <th className="pb-2 pr-4 font-semibold">Subject</th>
                  <th className="pb-2 pr-4 font-semibold">Sender</th>
                  <th className="pb-2 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingDocuments.map((doc) => (
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
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => receive.open(doc)}
                        disabled={receive.isReceiving(doc.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-[#607796] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#4d627c] disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          move_to_inbox
                        </span>
                        {receive.isReceiving(doc.id) ? "Receiving..." : "Receive"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[#3f5168] mb-4">
          For Signature
        </h2>

        {loading ? (
          <p className="py-6 text-center text-sm text-on-surface-variant">
            Loading...
          </p>
        ) : forSignatureDocuments.length === 0 ? (
          <p className="py-6 text-center text-sm text-on-surface-variant">
            No documents waiting for signature.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#607796]/15 text-[11px] uppercase tracking-wider text-[#a6a08a]">
                  <th className="pb-2 pr-4 font-semibold">Code</th>
                  <th className="pb-2 pr-4 font-semibold">Subject</th>
                  <th className="pb-2 pr-4 font-semibold">Received by</th>
                  <th className="pb-2 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {forSignatureDocuments.map((doc) => (
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
                      {doc.receivedByName || "—"}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSign(doc)}
                        disabled={signingId === doc.id}
                        className="inline-flex items-center gap-1 rounded-md bg-[#2f7a4d] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#276641] disabled:opacity-50"
                        title="Sign and approve"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          draw
                        </span>
                        {signingId === doc.id ? "Signing..." : "Sign & approve"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RecieveModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onReceived={upsert}
      />

      <ReceiveConfirmModal
        document={receive.target}
        receiverName={receive.receiverName}
        onReceiverNameChange={receive.setReceiverName}
        onSubmit={receive.confirm}
        onCancel={receive.close}
        submitting={receive.submitting}
        statusNote={
          <>
            On confirm: status becomes{" "}
            <span className="font-semibold text-[#3f5168]">For Signature</span>{" "}
            and the date/time is recorded.
          </>
        }
      />
    </div>
  );
};

export default GovernorOfficeDashboard;
