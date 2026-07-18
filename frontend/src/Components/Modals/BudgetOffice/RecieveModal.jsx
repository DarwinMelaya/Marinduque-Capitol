import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Html5Qrcode } from "html5-qrcode";
import {
  DOCUMENT_LOCATION,
  DOCUMENT_STATUS,
  getDocumentByCode,
  receiveAtBudgetOffice,
  statusLabel,
} from "../../../api/documents";
import { getSession } from "../../../api/auth";
import { formatDate } from "../../../Utils/documentHelpers";

const SCANNER_REGION_ID = "budget-receive-qr-reader";

const inputClass =
  "mt-1 block w-full rounded-md border border-[#607796]/25 bg-white px-3 py-2.5 text-sm font-mono uppercase tracking-wide text-[#3f5168] placeholder:text-[#a6a08a]/80 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#607796]/40 focus:border-[#607796]";

const normalizeCode = (raw) => {
  const text = String(raw || "").trim();
  const match = text.match(/DTRS-[A-Z0-9-]+/i);
  return (match ? match[0] : text).toUpperCase();
};

const isInsecureLanHost = () => {
  if (typeof window === "undefined") return false;
  if (window.isSecureContext) return false;
  const host = window.location.hostname;
  return host !== "localhost" && host !== "127.0.0.1";
};

const cameraBlockedMessage = (err) => {
  if (isInsecureLanHost()) {
    return (
      "Camera is blocked on HTTP LAN addresses (e.g. http://192.168.x.x). " +
      "Open this app with HTTPS instead (https://…:5173), accept the certificate warning, then try again."
    );
  }
  if (!window.isSecureContext) {
    return "Camera needs a secure page (HTTPS or localhost). Switch to HTTPS and try again.";
  }
  const msg = err?.message || String(err || "");
  if (/NotAllowedError|Permission/i.test(msg)) {
    return "Camera permission was denied. Allow camera access in the browser, then try again.";
  }
  if (/NotFoundError|no camera/i.test(msg)) {
    return "No camera was found on this device. Enter the transaction code manually.";
  }
  return (
    msg ||
    "Unable to open camera. Allow camera access or enter the code manually."
  );
};

const pickCameraId = async () => {
  const cameras = await Html5Qrcode.getCameras();
  if (!cameras?.length) {
    throw new Error("No camera was found on this device.");
  }
  const back = cameras.find((c) =>
    /back|rear|environment|world/i.test(c.label || ""),
  );
  return (back || cameras[cameras.length - 1] || cameras[0]).id;
};

const RecieveModal = ({ open, onClose, onReceived }) => {
  const [mode, setMode] = useState("scan"); // scan | code
  const [code, setCode] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [error, setError] = useState(null);
  const [foundDoc, setFoundDoc] = useState(null);
  const [receiverName, setReceiverName] = useState("");
  const [cameraError, setCameraError] = useState(null);
  const [scanning, setScanning] = useState(false);

  const scannerRef = useRef(null);
  const handlingScanRef = useRef(false);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      await scanner.clear();
    } catch {
      // Camera may already be stopped
    }
  }, []);

  const lookupCode = useCallback(async (rawCode) => {
    const transactionCode = normalizeCode(rawCode);
    if (!transactionCode) {
      setError("Enter or scan a transaction code.");
      return;
    }

    setLookingUp(true);
    setError(null);
    setFoundDoc(null);

    try {
      const doc = await getDocumentByCode(transactionCode);
      if (!doc) {
        setError(`No document found for ${transactionCode}.`);
        return;
      }
      setFoundDoc(doc);
      setCode(doc.transactionCode);
      setReceiverName(getSession()?.fullName || "");
    } catch (err) {
      setError(err.message || "Unable to look up document.");
    } finally {
      setLookingUp(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError(null);

    if (isInsecureLanHost() || !window.isSecureContext) {
      setScanning(false);
      setCameraError(cameraBlockedMessage());
      return;
    }

    await stopScanner();

    const region = window.document.getElementById(SCANNER_REGION_ID);
    if (!region) {
      setCameraError("Scanner view is not ready yet. Try again.");
      return;
    }

    const scanner = new Html5Qrcode(SCANNER_REGION_ID);
    scannerRef.current = scanner;

    try {
      const cameraId = await pickCameraId();
      await scanner.start(
        cameraId,
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          if (handlingScanRef.current) return;
          handlingScanRef.current = true;
          try {
            await stopScanner();
            await lookupCode(decodedText);
            toast.success("QR code scanned.");
          } finally {
            handlingScanRef.current = false;
          }
        },
        () => {},
      );
      setScanning(true);
    } catch (err) {
      setScanning(false);
      setCameraError(cameraBlockedMessage(err));
      try {
        await scanner.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
  }, [lookupCode, stopScanner]);

  useEffect(() => {
    if (!open) {
      stopScanner();
      setMode("scan");
      setCode("");
      setFoundDoc(null);
      setReceiverName("");
      setError(null);
      setCameraError(null);
      handlingScanRef.current = false;
      return undefined;
    }

    const onKeyDown = (e) => {
      if (e.key === "Escape" && !receiving) onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, receiving, stopScanner]);

  useEffect(() => {
    if (!open || mode !== "scan" || foundDoc) {
      stopScanner();
      return undefined;
    }

    const timer = window.setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      window.clearTimeout(timer);
      stopScanner();
    };
  }, [open, mode, foundDoc, startScanner, stopScanner]);

  if (!open) return null;

  const canReceive =
    foundDoc?.status === DOCUMENT_STATUS.FORWARDED &&
    foundDoc?.currentLocation === DOCUMENT_LOCATION.BUDGET_OFFICE;

  const handleManualLookup = async (e) => {
    e.preventDefault();
    await lookupCode(code);
  };

  const handleReceive = async () => {
    if (!foundDoc || !canReceive) return;
    const name = receiverName.trim();
    if (!name) {
      setError("Please enter who received the document.");
      return;
    }
    setReceiving(true);
    setError(null);
    try {
      const updated = await receiveAtBudgetOffice(foundDoc.id, name);
      toast.success(`Received by ${updated.receivedByName} — Processing`);
      onReceived?.(updated);
      onClose?.();
    } catch (err) {
      setError(err.message || "Failed to receive document.");
    } finally {
      setReceiving(false);
    }
  };

  const handleClearFound = () => {
    setFoundDoc(null);
    setReceiverName("");
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-receive-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1c2229]/45 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={() => !receiving && onClose?.()}
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[#607796]/15 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a6a08a]">
              Incoming document
            </p>
            <h2
              id="budget-receive-modal-title"
              className="mt-1 text-lg font-bold text-[#607796]"
            >
              Scan or enter code
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Scan the QR on the document, or type the transaction code to
              receive it for processing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => !receiving && onClose?.()}
            className="rounded-lg p-1.5 text-[#607796]/70 hover:bg-[#607796]/10 hover:text-[#607796]"
            aria-label="Close"
            disabled={receiving}
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="inline-flex rounded-lg border border-[#607796]/15 p-1 bg-[#607796]/5 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode("scan");
              setError(null);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
              mode === "scan"
                ? "bg-[#607796] text-white"
                : "text-[#607796] hover:bg-white/70"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              photo_camera
            </span>
            Scan QR
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("code");
              setError(null);
              stopScanner();
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
              mode === "code"
                ? "bg-[#607796] text-white"
                : "text-[#607796] hover:bg-white/70"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              dialpad
            </span>
            Enter code
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!foundDoc && mode === "scan" && (
          <div className="space-y-3">
            <div
              id={SCANNER_REGION_ID}
              className="overflow-hidden rounded-xl border border-[#607796]/20 bg-black/90 min-h-[260px]"
            />
            {cameraError ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-2">
                <p>{cameraError}</p>
                {isInsecureLanHost() && (
                  <p className="font-mono text-xs break-all text-[#3f5168]">
                    Use:{" "}
                    {`https://${window.location.hostname}:${window.location.port || "5173"}`}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setMode("code")}
                  className="block text-xs font-semibold text-[#607796] underline"
                >
                  Enter code instead
                </button>
              </div>
            ) : (
              <p className="text-center text-xs text-on-surface-variant">
                {scanning
                  ? "Point the camera at the document QR code…"
                  : "Starting camera…"}
              </p>
            )}
          </div>
        )}

        {!foundDoc && mode === "code" && (
          <form className="space-y-4" onSubmit={handleManualLookup}>
            <div>
              <label
                htmlFor="budget-receive-code"
                className="text-xs font-semibold uppercase tracking-wider text-[#a6a08a]"
              >
                Transaction code
              </label>
              <input
                id="budget-receive-code"
                name="code"
                type="text"
                required
                autoFocus
                className={inputClass}
                placeholder="DTRS-20260712-XXXXXX"
                value={code}
                onChange={(e) => {
                  setError(null);
                  setCode(e.target.value.toUpperCase());
                }}
              />
            </div>
            <button
              type="submit"
              disabled={lookingUp || !code.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#607796] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4d627c] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">
                search
              </span>
              {lookingUp ? "Looking up..." : "Look up document"}
            </button>
          </form>
        )}

        {foundDoc && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#607796]/15 bg-[#607796]/5 p-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-[#a6a08a]">Code</span>
                <span className="font-mono font-semibold text-[#3f5168]">
                  {foundDoc.transactionCode}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#a6a08a]">Subject</span>
                <span className="text-right font-medium text-[#3f5168]">
                  {foundDoc.subject}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#a6a08a]">Sender</span>
                <span className="text-right text-[#3f5168]">
                  {foundDoc.sender}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#a6a08a]">Date</span>
                <span className="text-right text-[#3f5168]">
                  {formatDate(foundDoc.dateReceived)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#a6a08a]">Status</span>
                <span className="inline-flex rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-[#607796]">
                  {statusLabel(foundDoc.status)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#a6a08a]">Location</span>
                <span className="text-right text-[#3f5168]">
                  {foundDoc.currentLocation}
                </span>
              </div>
            </div>

            {!canReceive && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {foundDoc.currentLocation === DOCUMENT_LOCATION.BUDGET_OFFICE
                  ? "This document is already at the Budget Office."
                  : "This document has not been forwarded to the Budget Office yet."}
              </div>
            )}

            {canReceive && (
              <div>
                <label
                  htmlFor="budget-received-by"
                  className="text-xs font-semibold uppercase tracking-wider text-[#a6a08a]"
                >
                  Received by
                </label>
                <input
                  id="budget-received-by"
                  type="text"
                  value={receiverName}
                  onChange={(e) => {
                    setError(null);
                    setReceiverName(e.target.value);
                  }}
                  placeholder="Full name of the person who received"
                  className="mt-1 block w-full rounded-md border border-[#607796]/25 bg-white px-3 py-2.5 text-sm text-[#3f5168] placeholder:text-[#a6a08a]/80 focus:outline-none focus:ring-2 focus:ring-[#607796]/40 focus:border-[#607796]"
                />
                <p className="mt-1.5 text-xs text-on-surface-variant">
                  Status becomes Processing and the date/time is recorded on
                  confirm.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={handleClearFound}
                disabled={receiving}
                className="rounded-md border border-[#607796]/20 px-4 py-2.5 text-sm font-semibold text-[#607796] hover:bg-[#607796]/5 disabled:opacity-50"
              >
                Scan another
              </button>
              <button
                type="button"
                onClick={handleReceive}
                disabled={!canReceive || receiving}
                className="inline-flex items-center gap-2 rounded-md bg-[#607796] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4d627c] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">
                  move_to_inbox
                </span>
                {receiving ? "Receiving..." : "Confirm receive"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecieveModal;
