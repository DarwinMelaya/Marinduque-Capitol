/**
 * Lightweight confirmation modal for receiving a document from a table row.
 * Renders nothing unless a `document` target is provided.
 */
const ReceiveConfirmModal = ({
  document,
  receiverName,
  onReceiverNameChange,
  onSubmit,
  onCancel,
  submitting,
  statusNote,
}) => {
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-bold text-[#607796]">Receive document</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {document.transactionCode} — {document.subject}
        </p>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-[#a6a08a]">
          Received by
        </label>
        <input
          type="text"
          autoFocus
          value={receiverName}
          onChange={(e) => onReceiverNameChange(e.target.value)}
          placeholder="Full name of the person who received"
          className="mt-1 w-full rounded-md border border-[#607796]/25 px-3 py-2 text-sm text-[#3f5168] focus:border-[#607796] focus:outline-none"
        />

        {statusNote && (
          <p className="mt-3 text-xs text-on-surface-variant">{statusNote}</p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md border border-[#607796]/20 px-3 py-1.5 text-xs font-semibold text-[#607796] hover:bg-[#607796]/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1 rounded-md bg-[#607796] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4d627c] disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">
              move_to_inbox
            </span>
            {submitting ? "Receiving..." : "Confirm receive"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReceiveConfirmModal;
