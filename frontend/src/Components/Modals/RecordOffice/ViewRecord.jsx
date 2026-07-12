import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { generateQrWithLogo } from "../../../Utils/qrWithLogo";

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

const safeFileName = (code) =>
  String(code || "qr")
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .replace(/_+/g, "_");

/** Convert a PNG data URL to a JPG download via canvas. */
const downloadQrAsJpg = (pngDataUrl, fileName) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = window.document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas unavailable."));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);

        const jpgUrl = canvas.toDataURL("image/jpeg", 0.95);
        const link = window.document.createElement("a");
        link.href = jpgUrl;
        link.download = `${fileName}.jpg`;
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    image.onerror = () => reject(new Error("Failed to load QR image."));
    image.src = pngDataUrl;
  });

const ViewRecord = ({ open, document, onClose, onEdit }) => {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!open || !document?.transactionCode) {
      setQrDataUrl(null);
      return;
    }

    let cancelled = false;
    generateQrWithLogo(document.transactionCode, { size: 512 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl(null);
          toast.error("QR code could not be generated.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, document]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !document) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(document.transactionCode);
      toast.success("Transaction code copied.");
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  const handleDownloadJpg = async () => {
    if (!qrDataUrl) {
      toast.error("QR code is not ready yet.");
      return;
    }

    setDownloading(true);
    try {
      await downloadQrAsJpg(
        qrDataUrl,
        `QR-${safeFileName(document.transactionCode)}`,
      );
      toast.success("QR code downloaded as JPG.");
    } catch {
      toast.error("Could not download QR code.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 print:static print:p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-record-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1c2229]/45 backdrop-blur-sm print:hidden"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div
        id="view-record-slip"
        className="relative z-10 w-full max-w-md rounded-2xl border border-[#607796]/15 bg-white p-6 shadow-xl print:shadow-none print:border-0 print:max-w-none"
      >
        <div className="flex items-start justify-between gap-3 mb-5 print:mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a6a08a]">
              Document record
            </p>
            <h2
              id="view-record-title"
              className="mt-1 text-lg font-bold text-[#607796]"
            >
              Transaction slip
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#607796]/70 hover:bg-[#607796]/10 hover:text-[#607796] print:hidden"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-3">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR for ${document.transactionCode}`}
              className="w-52 rounded-lg border border-[#607796]/15 bg-white p-2"
            />
          ) : (
            <div className="flex h-52 w-52 items-center justify-center rounded-lg border border-[#607796]/15 bg-[#607796]/5 text-sm text-on-surface-variant">
              Generating QR…
            </div>
          )}
        </div>

        <dl className="mt-5 space-y-2.5 text-sm border-t border-[#607796]/12 pt-4">
          <div className="flex justify-between gap-3">
            <dt className="text-[#a6a08a]">Subject</dt>
            <dd className="text-right font-medium text-[#3f5168]">
              {document.subject}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#a6a08a]">Sender</dt>
            <dd className="text-right text-[#3f5168]">{document.sender}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#a6a08a]">Date received</dt>
            <dd className="text-right text-[#3f5168]">
              {formatDate(document.dateReceived)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#a6a08a]">Receiver</dt>
            <dd className="text-right text-[#3f5168]">{document.receiverName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#a6a08a]">Status</dt>
            <dd className="text-right">
              <span className="inline-flex rounded-md bg-[#607796]/10 px-2 py-0.5 text-xs font-semibold text-[#607796]">
                {document.status || "RECEIVED"}
              </span>
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#607796]/20 px-3 py-2 text-xs font-semibold text-[#607796] hover:bg-[#607796]/5"
          >
            <span className="material-symbols-outlined text-[16px]">
              content_copy
            </span>
            Copy code
          </button>
          <button
            type="button"
            onClick={handleDownloadJpg}
            disabled={!qrDataUrl || downloading}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#607796]/20 px-3 py-2 text-xs font-semibold text-[#607796] hover:bg-[#607796]/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px]">
              download
            </span>
            {downloading ? "Downloading..." : "Download JPG"}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#607796]/20 px-3 py-2 text-xs font-semibold text-[#607796] hover:bg-[#607796]/5"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Print
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(document)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#607796] px-3 py-2 text-xs font-semibold text-white hover:bg-[#4d627c] ml-auto"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit
            </button>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #view-record-slip,
          #view-record-slip * {
            visibility: visible !important;
          }
          #view-record-slip {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 24px !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ViewRecord;
