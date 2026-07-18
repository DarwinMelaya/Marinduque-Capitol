import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  DOCUMENT_LOCATION,
  DOCUMENT_STATUS,
  createDocument,
  forwardToProvincialAdministrator,
  listDocuments,
  receiveSignedAtRecordOffice,
  statusLabel,
} from "../../api/documents";
import ViewRecord from "../../Components/Modals/RecordOffice/ViewRecord";
import EditRecord from "../../Components/Modals/RecordOffice/EditRecord";
import { generateQrWithLogo } from "../../Utils/qrWithLogo";
import { formatDate, replaceById } from "../../Utils/documentHelpers";

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  subject: "",
  sender: "",
  dateReceived: todayIso(),
  receiverName: "",
};

const inputClass =
  "mt-1 block w-full rounded-md border border-[#607796]/25 bg-white px-3 py-2.5 text-sm text-[#3f5168] placeholder:text-[#a6a08a]/80 focus:outline-none focus:ring-2 focus:ring-[#607796]/40 focus:border-[#607796]";

const RecordRecording = () => {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [created, setCreated] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [forwardingId, setForwardingId] = useState(null);
  const [releasingId, setReleasingId] = useState(null);

  const loadDocuments = async () => {
    setLoadingList(true);
    try {
      const rows = await listDocuments();
      setDocuments(rows);
    } catch (err) {
      toast.error(err.message || "Unable to load documents.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (!created?.transactionCode) {
      setQrDataUrl(null);
      return;
    }

    let cancelled = false;
    generateQrWithLogo(created.transactionCode, { size: 512 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl(null);
          toast.error("Document saved, but QR code could not be generated.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [created]);

  const handleChange = (e) => {
    setError(null);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const doc = await createDocument(form);
      toast.success(`Document recorded — ${doc.transactionCode}`);
      setCreated(doc);
      setForm({ ...emptyForm, dateReceived: todayIso() });
      setDocuments((prev) => [doc, ...prev]);
    } catch (err) {
      setError(err.message || "Failed to record document.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!created?.transactionCode) return;
    try {
      await navigator.clipboard.writeText(created.transactionCode);
      toast.success("Transaction code copied.");
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const handleDocumentSaved = (updated) => {
    setDocuments((prev) => replaceById(prev, updated));
    setCreated((prev) => (prev?.id === updated.id ? updated : prev));
    setViewingDoc((prev) => (prev?.id === updated.id ? updated : prev));
  };

  const openEditFromView = (doc) => {
    setViewingDoc(null);
    setEditingDoc(doc);
  };

  const canForward = (doc) =>
    (doc.status === DOCUMENT_STATUS.RECEIVED ||
      doc.status === DOCUMENT_STATUS.RETURNED) &&
    doc.currentLocation === DOCUMENT_LOCATION.RECORD_OFFICE;

  const handleForward = async (doc) => {
    if (!canForward(doc)) return;
    setForwardingId(doc.id);
    try {
      const updated = await forwardToProvincialAdministrator(doc.id);
      toast.success("Forwarded to Provincial Administrator.");
      handleDocumentSaved(updated);
    } catch (err) {
      toast.error(err.message || "Failed to forward document.");
    } finally {
      setForwardingId(null);
    }
  };

  const handleReceiveSigned = async (doc) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Receive signed "${doc.subject}" and mark as Completed?`)
    ) {
      return;
    }
    setReleasingId(doc.id);
    try {
      const updated = await receiveSignedAtRecordOffice(doc.id);
      toast.success("Signed document received — Completed.");
      handleDocumentSaved(updated);
    } catch (err) {
      toast.error(err.message || "Failed to receive signed document.");
    } finally {
      setReleasingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a6a08a]">
          Record Office
        </p>
        <h1 className="text-2xl font-bold text-[#607796] mt-1">Recording</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Log incoming documents and generate a transaction code with QR for
          inter-office receiving.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-6 shadow-sm print:hidden">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#607796]/10 border border-[#a6a08a]/30">
              <span className="material-symbols-outlined text-[#607796]">
                note_add
              </span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#3f5168]">
                Receive document
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Enter the document details. A unique transaction code and QR
                will be generated for other offices to scan when they receive
                it.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="subject"
                className="text-xs font-semibold uppercase tracking-wider text-[#a6a08a]"
              >
                Document subject
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                className={inputClass}
                placeholder="e.g. Request for budget realignment"
                value={form.subject}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="sender"
                  className="text-xs font-semibold uppercase tracking-wider text-[#a6a08a]"
                >
                  Sender
                </label>
                <input
                  id="sender"
                  name="sender"
                  type="text"
                  required
                  className={inputClass}
                  placeholder="Office or person who sent the document"
                  value={form.sender}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label
                  htmlFor="dateReceived"
                  className="text-xs font-semibold uppercase tracking-wider text-[#a6a08a]"
                >
                  Date received
                </label>
                <input
                  id="dateReceived"
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
                htmlFor="receiverName"
                className="text-xs font-semibold uppercase tracking-wider text-[#a6a08a]"
              >
                Receiver name
              </label>
              <input
                id="receiverName"
                name="receiverName"
                type="text"
                required
                className={inputClass}
                placeholder="Name of person who received the document"
                value={form.receiverName}
                onChange={handleChange}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md bg-[#607796] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4d627c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">
                  qr_code_2
                </span>
                {loading ? "Recording..." : "Record & generate QR"}
              </button>
            </div>
          </form>
        </div>

        <div
          id="transaction-slip"
          className="xl:col-span-2 rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-6 shadow-sm"
        >
          <div className="flex items-start gap-4 mb-5 print:mb-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#607796]/10 border border-[#a6a08a]/30 print:hidden">
              <span className="material-symbols-outlined text-[#607796]">
                qr_code
              </span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#3f5168]">
                Transaction slip
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant print:hidden">
                Attach or present this QR when the document is received by
                another office.
              </p>
            </div>
          </div>

          {!created ? (
            <div className="rounded-lg border border-dashed border-[#607796]/25 bg-[#607796]/5 px-4 py-10 text-center print:hidden">
              <span className="material-symbols-outlined text-[36px] text-[#607796]/50">
                qr_code_2
              </span>
              <p className="mt-2 text-sm text-on-surface-variant">
                Record a document to generate its transaction code and QR.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR for ${created.transactionCode}`}
                    className="w-52 rounded-lg border border-[#607796]/15 bg-white p-2"
                  />
                ) : (
                  <div className="flex h-52 w-52 items-center justify-center rounded-lg border border-[#607796]/15 bg-white text-sm text-on-surface-variant">
                    Generating QR…
                  </div>
                )}
              </div>

              <dl className="space-y-2 text-sm border-t border-[#607796]/12 pt-4">
                <div className="flex justify-between gap-3">
                  <dt className="text-[#a6a08a]">Subject</dt>
                  <dd className="text-right font-medium text-[#3f5168]">
                    {created.subject}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#a6a08a]">Sender</dt>
                  <dd className="text-right text-[#3f5168]">{created.sender}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#a6a08a]">Date received</dt>
                  <dd className="text-right text-[#3f5168]">
                    {formatDate(created.dateReceived)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#a6a08a]">Receiver</dt>
                  <dd className="text-right text-[#3f5168]">
                    {created.receiverName}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2 pt-1 print:hidden">
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
                  onClick={handlePrintSlip}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#607796] px-3 py-2 text-xs font-semibold text-white hover:bg-[#4d627c]"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    print
                  </span>
                  Print slip
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-6 shadow-sm print:hidden">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#3f5168]">
              Recorded documents
            </h2>
            <p className="mt-0.5 text-sm text-on-surface-variant">
              {loadingList
                ? "Loading documents..."
                : `${documents.length} document${documents.length === 1 ? "" : "s"}`}
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

        {loadingList ? (
          <p className="text-sm text-on-surface-variant py-6 text-center">
            Loading...
          </p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-6 text-center">
            No documents recorded yet.
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
                  <th className="pb-2 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-[#607796]/08 last:border-0"
                  >
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => setViewingDoc(doc)}
                        className="font-mono text-xs font-semibold text-[#607796] hover:underline"
                        title="View QR slip"
                      >
                        {doc.transactionCode}
                      </button>
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
                      {doc.currentLocation || DOCUMENT_LOCATION.RECORD_OFFICE}
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
                        <button
                          type="button"
                          onClick={() => setEditingDoc(doc)}
                          className="inline-flex items-center justify-center rounded-md p-1.5 text-[#607796] hover:bg-[#607796]/10"
                          title="Edit record"
                          aria-label="Edit record"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            edit
                          </span>
                        </button>
                        {canForward(doc) && (
                          <button
                            type="button"
                            onClick={() => handleForward(doc)}
                            disabled={forwardingId === doc.id}
                            className="inline-flex items-center gap-1 rounded-md bg-[#607796] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#4d627c] disabled:opacity-50"
                            title="Forward to Provincial Administrator"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              send
                            </span>
                            {forwardingId === doc.id ? "..." : "Forward"}
                          </button>
                        )}
                        {doc.status === DOCUMENT_STATUS.APPROVED && (
                          <button
                            type="button"
                            onClick={() => handleReceiveSigned(doc)}
                            disabled={releasingId === doc.id}
                            className="inline-flex items-center gap-1 rounded-md bg-[#2f7a4d] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#276641] disabled:opacity-50"
                            title="Receive signed document (mark Completed)"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              task_alt
                            </span>
                            {releasingId === doc.id
                              ? "Receiving..."
                              : "Receive signed"}
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
        onEdit={openEditFromView}
      />

      <EditRecord
        open={Boolean(editingDoc)}
        document={editingDoc}
        onClose={() => setEditingDoc(null)}
        onSaved={handleDocumentSaved}
      />
    </div>
  );
};

export default RecordRecording;
