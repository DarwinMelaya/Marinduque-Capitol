import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  DOCUMENT_LOCATION,
  DOCUMENT_STATUS,
  listProvincialAdministratorDocuments,
} from "../../api/documents";
import RecieveModal from "../../Components/Modals/ProvincialAdministrato/RecieveModal";

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

  const stats = useMemo(() => {
    const pending = documents.filter(
      (d) => d.status === DOCUMENT_STATUS.FORWARDED,
    ).length;
    const atOffice = documents.filter(
      (d) =>
        d.currentLocation === DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR,
    ).length;
    return { pending, atOffice, total: documents.length };
  }, [documents]);

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
    setDocuments((prev) => {
      const exists = prev.some((d) => d.id === updated.id);
      if (exists) {
        return prev.map((d) => (d.id === updated.id ? updated : d));
      }
      return [updated, ...prev];
    });
  };

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

      <RecieveModal
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        onReceived={handleReceived}
      />
    </div>
  );
};

export default ProvincialAdministratorDashboard;
