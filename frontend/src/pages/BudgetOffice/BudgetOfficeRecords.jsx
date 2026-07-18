import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  DOCUMENT_LOCATION,
  DOCUMENT_STATUS,
  forwardToGovernorOffice,
  listBudgetOfficeDocuments,
  statusLabel,
} from "../../api/documents";
import { formatDate, replaceById, upsertById } from "../../Utils/documentHelpers";
import RecieveModal from "../../Components/Modals/BudgetOffice/RecieveModal";

const BudgetOfficeRecords = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanOpen, setScanOpen] = useState(false);
  const [forwardingId, setForwardingId] = useState(null);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const rows = await listBudgetOfficeDocuments();
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

  const handleReceived = (updated) => {
    setDocuments((prev) => upsertById(prev, updated));
  };

  const handleForwardToGovernor = async (doc) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Forward "${doc.subject}" to ${DOCUMENT_LOCATION.GOVERNOR_OFFICE}?`,
      )
    ) {
      return;
    }

    setForwardingId(doc.id);
    try {
      const updated = await forwardToGovernorOffice(doc.id);
      toast.success(`Forwarded to ${DOCUMENT_LOCATION.GOVERNOR_OFFICE}.`);
      setDocuments((prev) => replaceById(prev, updated));
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
          Budget Office
        </p>
        <h1 className="text-2xl font-bold text-[#607796] mt-1">Records</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Documents currently at the Budget Office.
        </p>
      </div>

      <div className="rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-[#3f5168]">
            At this office ({documents.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setScanOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#607796] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4d627c]"
            >
              <span className="material-symbols-outlined text-[16px]">
                qr_code_scanner
              </span>
              Scan / receive
            </button>
            <button
              type="button"
              onClick={loadDocuments}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#607796]/20 px-3 py-1.5 text-xs font-semibold text-[#607796] hover:bg-[#607796]/5"
            >
              <span className="material-symbols-outlined text-[16px]">
                refresh
              </span>
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="py-6 text-center text-sm text-on-surface-variant">
            Loading...
          </p>
        ) : documents.length === 0 ? (
          <p className="py-6 text-center text-sm text-on-surface-variant">
            No documents at Budget Office.
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
                  <th className="pb-2 pr-4 font-semibold">Received by</th>
                  <th className="pb-2 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
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
                      {doc.receivedByName || "—"}
                    </td>
                    <td className="py-3 text-right">
                      {doc.status === DOCUMENT_STATUS.PROCESSING && (
                        <button
                          type="button"
                          onClick={() => handleForwardToGovernor(doc)}
                          disabled={forwardingId === doc.id}
                          className="inline-flex items-center gap-1 rounded-md bg-[#607796] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#4d627c] disabled:opacity-50"
                          title="Forward to Governor Office"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            send
                          </span>
                          {forwardingId === doc.id
                            ? "Forwarding..."
                            : "Forward to Governor"}
                        </button>
                      )}
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
        onReceived={handleReceived}
      />
    </div>
  );
};

export default BudgetOfficeRecords;
