import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { updateDocument } from "../../../api/documents";

const inputClass =
  "mt-1 block w-full rounded-md border border-[#607796]/25 bg-white px-3 py-2.5 text-sm text-[#3f5168] placeholder:text-[#a6a08a]/80 focus:outline-none focus:ring-2 focus:ring-[#607796]/40 focus:border-[#607796]";

const toDateInputValue = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const EditRecord = ({ open, document, onClose, onSaved }) => {
  const [form, setForm] = useState({
    subject: "",
    sender: "",
    dateReceived: "",
    receiverName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !document) return;
    setError(null);
    setForm({
      subject: document.subject || "",
      sender: document.sender || "",
      dateReceived: toDateInputValue(document.dateReceived),
      receiverName: document.receiverName || "",
    });
  }, [open, document]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape" && !loading) onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  if (!open || !document) return null;

  const handleChange = (e) => {
    setError(null);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const updated = await updateDocument(document.id, form);
      toast.success("Document updated.");
      onSaved?.(updated);
      onClose?.();
    } catch (err) {
      setError(err.message || "Failed to update document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-record-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1c2229]/45 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={() => !loading && onClose?.()}
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[#607796]/15 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a6a08a]">
              Edit record
            </p>
            <h2
              id="edit-record-title"
              className="mt-1 text-lg font-bold text-[#607796]"
            >
              Update document
            </h2>
            <p className="mt-1 font-mono text-xs font-semibold text-[#3f5168]">
              {document.transactionCode}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !loading && onClose?.()}
            className="rounded-lg p-1.5 text-[#607796]/70 hover:bg-[#607796]/10 hover:text-[#607796]"
            aria-label="Close"
            disabled={loading}
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <p className="mb-4 text-sm text-on-surface-variant">
          Transaction code and QR stay the same. Only document details can be
          changed.
        </p>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="edit-subject"
              className="text-xs font-semibold uppercase tracking-wider text-[#a6a08a]"
            >
              Document subject
            </label>
            <input
              id="edit-subject"
              name="subject"
              type="text"
              required
              className={inputClass}
              value={form.subject}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit-sender"
                className="text-xs font-semibold uppercase tracking-wider text-[#a6a08a]"
              >
                Sender
              </label>
              <input
                id="edit-sender"
                name="sender"
                type="text"
                required
                className={inputClass}
                value={form.sender}
                onChange={handleChange}
              />
            </div>
            <div>
              <label
                htmlFor="edit-dateReceived"
                className="text-xs font-semibold uppercase tracking-wider text-[#a6a08a]"
              >
                Date received
              </label>
              <input
                id="edit-dateReceived"
                name="dateReceived"
                type="date"
                required
                className={inputClass}
                value={form.dateReceived}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-receiverName"
              className="text-xs font-semibold uppercase tracking-wider text-[#a6a08a]"
            >
              Receiver name
            </label>
            <input
              id="edit-receiverName"
              name="receiverName"
              type="text"
              required
              className={inputClass}
              value={form.receiverName}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => !loading && onClose?.()}
              disabled={loading}
              className="rounded-md border border-[#607796]/20 px-4 py-2.5 text-sm font-semibold text-[#607796] hover:bg-[#607796]/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md bg-[#607796] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4d627c] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRecord;
