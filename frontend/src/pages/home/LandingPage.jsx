import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DOCUMENT_LOCATION,
  DOCUMENT_STATUS,
  getDocumentByCode,
  statusLabel,
} from "../../api/documents";
import { formatDate } from "../../Utils/documentHelpers";

const STAGES = [
  {
    title: "Record Office",
    icon: "home_storage",
    description: "Document received and logged.",
  },
  {
    title: "Provincial Administrator",
    icon: "corporate_fare",
    description: "Reviewed by the PA.",
  },
  {
    title: "Budget Office",
    icon: "payments",
    description: "Processed by the Budget Office.",
  },
  {
    title: "Governor's Office",
    icon: "account_balance",
    description: "Signed and approved.",
  },
  {
    title: "Released",
    icon: "task_alt",
    description: "Completed and ready for release.",
  },
];

/** Derive the visual timeline position + a human headline from a document. */
const trackingProgress = (doc) => {
  const { status, currentLocation: loc } = doc;

  if (status === DOCUMENT_STATUS.COMPLETED) {
    return {
      index: 4,
      transit: false,
      tone: "done",
      headline: "Completed — document has been released by the Record Office.",
    };
  }
  if (status === DOCUMENT_STATUS.APPROVED) {
    return {
      index: 3,
      transit: true,
      tone: "active",
      headline: "Signed & approved — returning to Record Office for release.",
    };
  }
  if (status === DOCUMENT_STATUS.RETURNED) {
    return {
      index: 0,
      transit: false,
      tone: "returned",
      headline: "Returned to the Record Office for revisions.",
    };
  }
  if (loc === DOCUMENT_LOCATION.GOVERNOR_OFFICE) {
    return {
      index: 3,
      transit: status === DOCUMENT_STATUS.FORWARDED,
      tone: "active",
      headline:
        status === DOCUMENT_STATUS.FORWARDED
          ? "In transit → Governor's Office (awaiting receive)."
          : "At the Governor's Office — waiting for signature.",
    };
  }
  if (loc === DOCUMENT_LOCATION.BUDGET_OFFICE) {
    return {
      index: 2,
      transit: status === DOCUMENT_STATUS.FORWARDED,
      tone: "active",
      headline:
        status === DOCUMENT_STATUS.FORWARDED
          ? "In transit → Budget Office (awaiting receive)."
          : "At the Budget Office — processing.",
    };
  }
  if (loc === DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR) {
    return {
      index: 1,
      transit: false,
      tone: "active",
      headline: "At the Provincial Administrator — under review.",
    };
  }
  if (status === DOCUMENT_STATUS.FORWARDED) {
    return {
      index: 1,
      transit: true,
      tone: "active",
      headline: "In transit → Provincial Administrator (awaiting receive).",
    };
  }
  return {
    index: 0,
    transit: false,
    tone: "active",
    headline: "Received and logged at the Record Office.",
  };
};

const normalizeCode = (raw) => {
  const text = String(raw || "").trim();
  const match = text.match(/DTRS-[A-Z0-9-]+/i);
  return (match ? match[0] : text).toUpperCase();
};

const TrackTimeline = ({ progress }) => (
  <ol className="relative mt-2 space-y-4 sm:space-y-0 sm:flex sm:items-start sm:gap-0">
    {STAGES.map((stage, i) => {
      const isDone =
        i < progress.index ||
        (progress.index === 4 && progress.tone === "done" && i <= 4);
      const isCurrent = i === progress.index && progress.tone !== "done";
      const state = isDone ? "done" : isCurrent ? "current" : "upcoming";

      const dotClass =
        state === "done"
          ? "bg-[#2f7a4d] text-white border-[#2f7a4d]"
          : state === "current"
            ? "bg-[#607796] text-white border-[#607796] ring-4 ring-[#607796]/20"
            : "bg-white text-[#a6a08a] border-[#607796]/25";

      return (
        <li key={stage.title} className="relative sm:flex-1">
          <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center">
            {i < STAGES.length - 1 && (
              <span
                className={`hidden sm:block absolute top-5 left-1/2 h-0.5 w-full ${
                  i < progress.index ? "bg-[#2f7a4d]" : "bg-[#607796]/15"
                }`}
              />
            )}
            <span
              className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${dotClass}`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDone ? "check" : stage.icon}
              </span>
            </span>
            <div className="min-w-0 sm:mt-2">
              <p
                className={`text-xs font-semibold ${
                  state === "upcoming" ? "text-[#a6a08a]" : "text-[#3f5168]"
                }`}
              >
                {stage.title}
              </p>
              <p className="text-[11px] text-on-surface-variant hidden sm:block max-w-[9rem]">
                {stage.description}
              </p>
              {isCurrent && progress.transit && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                  In transit
                </span>
              )}
            </div>
          </div>
        </li>
      );
    })}
  </ol>
);

const LandingPage = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    const transactionCode = normalizeCode(code);
    if (!transactionCode) {
      setError("Please enter a transaction code.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const doc = await getDocumentByCode(transactionCode);
      if (!doc) {
        setResult(null);
        setError(`No document found for ${transactionCode}.`);
        return;
      }
      setResult(doc);
    } catch (err) {
      setError(err.message || "Unable to look up document.");
    } finally {
      setLoading(false);
    }
  };

  const progress = result ? trackingProgress(result) : null;

  return (
    <div className="min-h-screen bg-[#f6f5f0] text-[#3f5168]">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-[#607796]/10 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/img/dostlogo.png"
              alt="DOST"
              className="h-10 w-10 object-contain"
            />
            <img
              src="/img/logo.png"
              alt="Lalawigan ng Marinduque"
              className="h-10 w-10 object-contain"
            />
            <div className="leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a6a08a]">
                DTRS
              </p>
              <p className="text-sm font-extrabold tracking-[0.05em] text-[#607796]">
                Government of Marinduque
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-[#607796] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4d627c]"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            Staff login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/img/bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a3648]/90 via-[#3f5168]/80 to-[#607796]/75" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#ebe6d6] backdrop-blur-sm">
              <span className="material-symbols-outlined text-[16px]">
                travel_explore
              </span>
              Document Tracking & Records System
            </span>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight text-white sm:text-5xl">
              Track your document in real time
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#ebe6d6] sm:text-base">
              Enter the transaction code on your receiving slip to see exactly
              where your document is — from the Record Office all the way to the
              Governor's Office and back.
            </p>
          </div>

          {/* Tracker card */}
          <div className="mt-8 max-w-2xl rounded-2xl border border-white/40 bg-white/95 p-5 shadow-2xl backdrop-blur-sm sm:p-6">
            <form onSubmit={handleTrack} className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#a6a08a]">
                  qr_code_2
                </span>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setError(null);
                    setCode(e.target.value.toUpperCase());
                  }}
                  placeholder="DTRS-20260712-XXXXXX"
                  className="w-full rounded-lg border border-[#607796]/25 bg-white py-3 pl-11 pr-3 font-mono text-sm uppercase tracking-wide text-[#3f5168] placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-[#a6a08a]/70 focus:border-[#607796] focus:outline-none focus:ring-2 focus:ring-[#607796]/30"
                  aria-label="Transaction code"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#607796] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4d627c] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  search
                </span>
                {loading ? "Tracking..." : "Track"}
              </button>
            </form>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="material-symbols-outlined text-[18px]">
                  error
                </span>
                <span>{error}</span>
              </div>
            )}

            {result && progress && (
              <div className="auth-fade-up mt-5 rounded-xl border border-[#607796]/15 bg-[#607796]/[0.03] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-bold text-[#607796]">
                      {result.transactionCode}
                    </p>
                    <p className="mt-1 text-base font-semibold text-[#3f5168]">
                      {result.subject}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center rounded-md bg-[#607796]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#607796]">
                    {statusLabel(result.status)}
                  </span>
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#607796]/15 bg-white px-4 py-3">
                  <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#607796]">
                    location_on
                  </span>
                  <p className="text-sm font-medium text-[#3f5168]">
                    {progress.headline}
                  </p>
                </div>

                <div className="mt-6">
                  <TrackTimeline progress={progress} />
                </div>

                <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-[#607796]/12 pt-4 text-sm sm:grid-cols-2">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[#a6a08a]">Sender</dt>
                    <dd className="text-right font-medium text-[#3f5168]">
                      {result.sender}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[#a6a08a]">Date received</dt>
                    <dd className="text-right text-[#3f5168]">
                      {formatDate(result.dateReceived)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[#a6a08a]">Current location</dt>
                    <dd className="text-right text-[#3f5168]">
                      {result.currentLocation}
                    </dd>
                  </div>
                  {result.receivedByName && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#a6a08a]">Last received by</dt>
                      <dd className="text-right text-[#3f5168]">
                        {result.receivedByName}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {!result && !error && (
              <p className="mt-3 text-center text-xs text-on-surface-variant sm:text-left">
                Your transaction code was printed on the QR slip when the
                document was first recorded.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a6a08a]">
            The document journey
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#3f5168]">
            How your document moves
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-on-surface-variant">
            Every document follows the same transparent path across offices.
            You can check its progress at any step.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map((stage, i) => (
            <div
              key={stage.title}
              className="relative rounded-xl border border-[#607796]/12 bg-white p-5 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#607796]/10 text-[#607796]">
                <span className="material-symbols-outlined">{stage.icon}</span>
              </div>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-[#a6a08a]">
                Step {i + 1}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#3f5168]">
                {stage.title}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {stage.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[#607796]/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: "bolt",
                title: "Real-time updates",
                text: "Each hand-off between offices is recorded, so the status you see is always current.",
              },
              {
                icon: "qr_code_scanner",
                title: "QR-based receiving",
                text: "Offices scan the QR on your slip to receive documents, keeping the trail accurate.",
              },
              {
                icon: "verified_user",
                title: "Secure & official",
                text: "Only authorized government staff can move or update documents in the system.",
              },
            ].map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#607796]/10 text-[#607796]">
                  <span className="material-symbols-outlined">
                    {feature.icon}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#3f5168]">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {feature.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#607796]/10 bg-[#f6f5f0]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-center sm:flex-row sm:px-6 sm:text-left">
          <div className="flex items-center gap-3">
            <img
              src="/img/dostlogo.png"
              alt="DOST"
              className="h-8 w-8 object-contain"
            />
            <img
              src="/img/logo.png"
              alt="Lalawigan ng Marinduque"
              className="h-8 w-8 object-contain"
            />
            <p className="text-xs text-on-surface-variant">
              © {new Date().getFullYear()} Government of Marinduque · Document
              Tracking & Records System
            </p>
          </div>
          <Link
            to="/login"
            className="text-xs font-semibold text-[#607796] hover:underline"
          >
            Staff login →
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
