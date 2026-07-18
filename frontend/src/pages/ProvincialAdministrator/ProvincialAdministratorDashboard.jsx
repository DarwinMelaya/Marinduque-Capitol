import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  DOCUMENT_LOCATION,
  DOCUMENT_STATUS,
  listProvincialAdministratorDocuments,
  receiveAtProvincialAdministrator,
} from "../../api/documents";
import { upsertById } from "../../Utils/documentHelpers";
import { useReceiveFlow } from "../../hooks/useReceiveFlow";
import RecieveModal from "../../Components/Modals/ProvincialAdministrato/RecieveModal";
import ReceiveConfirmModal from "../../Components/Modals/ReceiveConfirmModal";

const ProvincialAdministratorDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receiveOpen, setReceiveOpen] = useState(false);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listProvincialAdministratorDocuments();
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

  const stats = useMemo(() => {
    const atOffice = documents.filter(
      (d) =>
        d.currentLocation === DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR,
    ).length;
    return {
      pending: pendingDocuments.length,
      atOffice,
      total: documents.length,
    };
  }, [documents, pendingDocuments]);

  const cards = [
    {
      label: "Awaiting receive",
      value: stats.pending,
      icon: "inbox",
      hint: "Forwarded from Record Office",
    },
    {
      label: "At this office",
      value: stats.atOffice,
      icon: "location_on",
      hint: "Current location: Provincial Administrator",
    },
    {
      label: "In queue",
      value: stats.total,
      icon: "folder_open",
      hint: "Pending + received here",
    },
  ];

  const handleReceived = (updated) => {
    setDocuments((prev) => upsertById(prev, updated));
  };

  const receive = useReceiveFlow({
    receiveFn: receiveAtProvincialAdministrator,
    onReceived: handleReceived,
    successMessage: (doc) => `Received by ${doc.receivedByName} — Under Review`,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a6a08a]">
            Provincial Administrator
          </p>
          <h1 className="text-2xl font-bold text-[#607796] mt-1">Dashboard</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Incoming documents from Record Office and items currently at this
            office.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setReceiveOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[#607796] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4d627c]"
          >
            <span className="material-symbols-outlined text-[18px]">
              qr_code_scanner
            </span>
            Scan / receive
          </button>
          <Link
            to="/provincial-administrator/records"
            className="inline-flex items-center gap-2 rounded-md border border-[#607796]/20 bg-white/70 px-4 py-2.5 text-sm font-semibold text-[#607796] hover:bg-[#607796]/5"
          >
            <span className="material-symbols-outlined text-[18px]">
              folder_open
            </span>
            Open records
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#607796]/10 border border-[#a6a08a]/30">
          <span className="material-symbols-outlined text-[#607796] text-[28px]">
            document_scanner
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-[#3f5168]">
            Receive arriving document
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Open the camera to scan the QR, or type the transaction code. On
            confirm, status becomes Received and location becomes Provincial
            Administrator.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReceiveOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-[#607796]/20 px-4 py-2.5 text-sm font-semibold text-[#607796] hover:bg-[#607796]/5 shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">
            photo_camera
          </span>
          Open scanner
        </button>
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
                <p className="mt-1 text-xs text-on-surface-variant">{card.hint}</p>
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
              Forwarded from Record Office, awaiting your receive.
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

      <RecieveModal
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        onReceived={handleReceived}
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
            <span className="font-semibold text-[#3f5168]">Under Review</span>,
            location becomes Provincial Administrator, and the date/time is
            recorded.
          </>
        }
      />
    </div>
  );
};

export default ProvincialAdministratorDashboard;
