import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  DOCUMENT_LOCATION,
  DOCUMENT_STATUS,
  listDocuments,
  statusLabel,
} from "../../api/documents";
import { getSession } from "../../api/auth";
import ViewRecord from "../../Components/Modals/RecordOffice/ViewRecord";

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

const formatRelative = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// 0 Record Office · 1 Prov. Admin · 2 Budget Office · 3 Governor · 4 Completed
const JOURNEY_STEPS = 5;

const journeyStep = (doc) => {
  if (doc.status === DOCUMENT_STATUS.COMPLETED) return 4;
  if (doc.currentLocation === DOCUMENT_LOCATION.GOVERNOR_OFFICE) return 3;
  if (doc.currentLocation === DOCUMENT_LOCATION.BUDGET_OFFICE) return 2;
  if (doc.currentLocation === DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR) {
    return 1;
  }
  return 0;
};

const locationBadgeClass = (doc) => {
  if (doc.status === DOCUMENT_STATUS.COMPLETED) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (doc.status === DOCUMENT_STATUS.RETURNED) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (doc.currentLocation === DOCUMENT_LOCATION.GOVERNOR_OFFICE) {
    return "bg-violet-50 text-violet-700 border-violet-200";
  }
  if (doc.currentLocation === DOCUMENT_LOCATION.BUDGET_OFFICE) {
    return "bg-sky-50 text-sky-700 border-sky-200";
  }
  if (doc.currentLocation === DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR) {
    return "bg-teal-50 text-teal-700 border-teal-200";
  }
  if (doc.status === DOCUMENT_STATUS.FORWARDED) {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }
  return "bg-[#607796]/10 text-[#607796] border-[#607796]/20";
};

const locationLabel = (doc) => {
  if (doc.status === DOCUMENT_STATUS.COMPLETED) return "Completed";
  if (doc.status === DOCUMENT_STATUS.RETURNED) {
    return "Returned to Record Office";
  }
  if (doc.status === DOCUMENT_STATUS.FORWARDED) {
    if (doc.currentLocation === DOCUMENT_LOCATION.BUDGET_OFFICE) {
      return "Arrived at Budget Office (awaiting receive)";
    }
    if (doc.currentLocation === DOCUMENT_LOCATION.GOVERNOR_OFFICE) {
      return "Arrived at Governor (awaiting receive)";
    }
    return "In transit → Provincial Administrator";
  }
  return doc.currentLocation || DOCUMENT_LOCATION.RECORD_OFFICE;
};

const RecordDashboard = () => {
  const session = getSession();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [viewingDoc, setViewingDoc] = useState(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listDocuments();
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
    const atRecord = documents.filter(
      (d) =>
        d.currentLocation === DOCUMENT_LOCATION.RECORD_OFFICE &&
        d.status !== DOCUMENT_STATUS.FORWARDED &&
        d.status !== DOCUMENT_STATUS.COMPLETED,
    ).length;
    const inTransit = documents.filter(
      (d) => d.status === DOCUMENT_STATUS.FORWARDED,
    ).length;
    const atPa = documents.filter(
      (d) =>
        d.currentLocation === DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR,
    ).length;
    const atBudget = documents.filter(
      (d) => d.currentLocation === DOCUMENT_LOCATION.BUDGET_OFFICE,
    ).length;
    const atGovernor = documents.filter(
      (d) => d.currentLocation === DOCUMENT_LOCATION.GOVERNOR_OFFICE,
    ).length;
    const completed = documents.filter(
      (d) => d.status === DOCUMENT_STATUS.COMPLETED,
    ).length;
    const today = documents.filter((d) => {
      if (!d.createdAt) return false;
      const created = new Date(d.createdAt);
      const now = new Date();
      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth() &&
        created.getDate() === now.getDate()
      );
    }).length;

    return {
      total: documents.length,
      atRecord,
      inTransit,
      atPa,
      atBudget,
      atGovernor,
      completed,
      today,
    };
  }, [documents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((doc) => {
      if (filter === "record") {
        if (
          doc.currentLocation !== DOCUMENT_LOCATION.RECORD_OFFICE ||
          doc.status === DOCUMENT_STATUS.FORWARDED ||
          doc.status === DOCUMENT_STATUS.COMPLETED
        ) {
          return false;
        }
      }
      if (filter === "transit" && doc.status !== DOCUMENT_STATUS.FORWARDED) {
        return false;
      }
      if (
        filter === "pa" &&
        doc.currentLocation !== DOCUMENT_LOCATION.PROVINCIAL_ADMINISTRATOR
      ) {
        return false;
      }
      if (
        filter === "budget" &&
        doc.currentLocation !== DOCUMENT_LOCATION.BUDGET_OFFICE
      ) {
        return false;
      }
      if (
        filter === "governor" &&
        doc.currentLocation !== DOCUMENT_LOCATION.GOVERNOR_OFFICE
      ) {
        return false;
      }
      if (filter === "completed" && doc.status !== DOCUMENT_STATUS.COMPLETED) {
        return false;
      }
      if (!q) return true;
      return (
        doc.transactionCode?.toLowerCase().includes(q) ||
        doc.subject?.toLowerCase().includes(q) ||
        doc.sender?.toLowerCase().includes(q) ||
        doc.receiverName?.toLowerCase().includes(q) ||
        doc.receivedByName?.toLowerCase().includes(q)
      );
    });
  }, [documents, filter, query]);

  const recent = useMemo(() => documents.slice(0, 6), [documents]);

  const journeyMax = Math.max(
    stats.atRecord + stats.inTransit,
    stats.atPa,
    stats.atBudget,
    stats.atGovernor,
    stats.completed,
    1,
  );

  const filterTabs = [
    { id: "all", label: "All", count: stats.total },
    { id: "record", label: "Record Office", count: stats.atRecord },
    { id: "transit", label: "In transit", count: stats.inTransit },
    { id: "pa", label: "Prov. Admin", count: stats.atPa },
    { id: "budget", label: "Budget", count: stats.atBudget },
    { id: "governor", label: "Governor", count: stats.atGovernor },
    { id: "completed", label: "Completed", count: stats.completed },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-[#607796]/15 bg-gradient-to-br from-[#607796] via-[#4d627c] to-[#3f5168] p-6 sm:p-8 text-white shadow-sm">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: "url('/img/bg.jpg')" }}
        />
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#a6a08a]/25 blur-2xl" />
        <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ebe6d6]/90">
              Record Office · Live tracking
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
              Document Dashboard
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[#ebe6d6]/90">
              Welcome back, {session?.fullName || "Record Officer"}. Track where
              every document is — Record Office, in transit, or Provincial
              Administrator.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadDocuments}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <span className="material-symbols-outlined text-[18px]">
                refresh
              </span>
              Refresh
            </button>
            <Link
              to="/record-office/recording"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#607796] hover:bg-[#ebe6d6]"
            >
              <span className="material-symbols-outlined text-[18px]">
                note_add
              </span>
              Record document
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: "Total documents",
            value: stats.total,
            icon: "folder_managed",
            hint: "All recorded entries",
          },
          {
            label: "At Record Office",
            value: stats.atRecord,
            icon: "home_storage",
            hint: "Still in this office",
          },
          {
            label: "In process",
            value: stats.inTransit + stats.atPa + stats.atBudget + stats.atGovernor,
            icon: "local_shipping",
            hint: "Moving through the chain",
          },
          {
            label: "Completed",
            value: stats.completed,
            icon: "task_alt",
            hint: "Signed & released",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-4 sm:p-5 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#a6a08a]">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#3f5168]">
                  {loading ? "—" : card.value}
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-on-surface-variant">
                  {card.hint}
                </p>
              </div>
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[#607796]/10 border border-[#a6a08a]/30">
                <span className="material-symbols-outlined text-[#607796] text-[20px]">
                  {card.icon}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Journey map */}
      <div className="rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-sm font-semibold text-[#3f5168]">
              Document journey
            </h2>
            <p className="mt-0.5 text-sm text-on-surface-variant">
              Where documents currently sit in the office chain.
            </p>
          </div>
          <p className="text-xs font-semibold text-[#a6a08a]">
            {loading ? "…" : `${stats.today} logged today`}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              title: "Record Office",
              count: stats.atRecord + stats.inTransit,
              icon: "home_storage",
              tone: "from-[#607796]/15 to-[#607796]/5",
              bar: "bg-[#607796]",
            },
            {
              title: "Provincial Administrator",
              count: stats.atPa,
              icon: "corporate_fare",
              tone: "from-teal-100/80 to-teal-50/40",
              bar: "bg-teal-600",
            },
            {
              title: "Budget Office",
              count: stats.atBudget,
              icon: "payments",
              tone: "from-sky-100/80 to-sky-50/40",
              bar: "bg-sky-600",
            },
            {
              title: "Governor Office",
              count: stats.atGovernor,
              icon: "account_balance",
              tone: "from-violet-100/80 to-violet-50/40",
              bar: "bg-violet-600",
            },
            {
              title: "Completed",
              count: stats.completed,
              icon: "task_alt",
              tone: "from-emerald-100/80 to-emerald-50/40",
              bar: "bg-emerald-600",
            },
          ].map((stage, index, arr) => (
            <div
              key={stage.title}
              className={`relative rounded-xl border border-[#607796]/10 bg-gradient-to-br ${stage.tone} p-4`}
            >
              {index < arr.length - 1 && (
                <span className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-white border border-[#607796]/15 text-[#607796] shadow-sm">
                  <span className="material-symbols-outlined text-[14px]">
                    arrow_forward
                  </span>
                </span>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 border border-[#607796]/10">
                  <span className="material-symbols-outlined text-[#607796] text-[20px]">
                    {stage.icon}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#a6a08a]">
                    Stage {index + 1}
                  </p>
                  <p className="text-sm font-semibold text-[#3f5168]">
                    {stage.title}
                  </p>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#3f5168]">
                {loading ? "—" : stage.count}
              </p>
              <div className="mt-3 h-2 rounded-full bg-white/70 overflow-hidden">
                <div
                  className={`h-full rounded-full ${stage.bar} transition-all duration-700`}
                  style={{
                    width: loading
                      ? "0%"
                      : `${Math.max(8, (stage.count / journeyMax) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Tracker table */}
        <div className="xl:col-span-3 rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-5 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#3f5168]">
                Track documents
              </h2>
              <p className="mt-0.5 text-sm text-on-surface-variant">
                See current location and status of every file.
              </p>
            </div>
            <div className="relative w-full sm:w-56">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#a6a08a]">
                search
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search code, subject…"
                className="w-full rounded-md border border-[#607796]/20 bg-white py-2 pl-9 pr-3 text-sm text-[#3f5168] placeholder:text-[#a6a08a]/80 focus:outline-none focus:ring-2 focus:ring-[#607796]/30"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === tab.id
                    ? "bg-[#607796] text-white"
                    : "bg-[#607796]/8 text-[#607796] hover:bg-[#607796]/15"
                }`}
              >
                {tab.label} ({loading ? "…" : tab.count})
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-on-surface-variant py-10 text-center">
              Loading documents…
            </p>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#607796]/25 bg-[#607796]/5 px-4 py-10 text-center">
              <span className="material-symbols-outlined text-[36px] text-[#607796]/45">
                travel_explore
              </span>
              <p className="mt-2 text-sm text-on-surface-variant">
                No documents match this filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#607796]/15 text-[11px] uppercase tracking-wider text-[#a6a08a]">
                    <th className="pb-2 pr-3 font-semibold">Code</th>
                    <th className="pb-2 pr-3 font-semibold">Subject</th>
                    <th className="pb-2 pr-3 font-semibold">Location</th>
                    <th className="pb-2 pr-3 font-semibold">Status</th>
                    <th className="pb-2 font-semibold text-right">Track</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 12).map((doc) => {
                    const step = journeyStep(doc);
                    return (
                      <tr
                        key={doc.id}
                        className="border-b border-[#607796]/08 last:border-0"
                      >
                        <td className="py-3 pr-3">
                          <button
                            type="button"
                            onClick={() => setViewingDoc(doc)}
                            className="font-mono text-xs font-semibold text-[#607796] hover:underline"
                          >
                            {doc.transactionCode}
                          </button>
                        </td>
                        <td className="py-3 pr-3">
                          <p className="font-medium text-[#3f5168] line-clamp-1 max-w-[12rem]">
                            {doc.subject}
                          </p>
                          <p className="text-[11px] text-on-surface-variant">
                            {doc.sender}
                          </p>
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={`inline-flex max-w-[11rem] rounded-md border px-2 py-1 text-[11px] font-semibold leading-tight ${locationBadgeClass(doc)}`}
                          >
                            {locationLabel(doc)}
                          </span>
                          <div className="mt-1.5 flex items-center gap-1">
                            {Array.from({ length: JOURNEY_STEPS }).map(
                              (_, i) => (
                                <span
                                  key={i}
                                  className={`h-1.5 w-3.5 rounded-full ${
                                    i <= step
                                      ? "bg-[#607796]"
                                      : "bg-[#607796]/15"
                                  }`}
                                />
                              ),
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="inline-flex rounded-md bg-[#607796]/10 px-2 py-1 text-xs font-semibold text-[#607796]">
                            {statusLabel(doc.status)}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setViewingDoc(doc)}
                            className="inline-flex items-center gap-1 rounded-md border border-[#607796]/20 px-2.5 py-1.5 text-xs font-semibold text-[#607796] hover:bg-[#607796]/5"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              location_on
                            </span>
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length > 12 && (
                <p className="mt-3 text-center text-xs text-on-surface-variant">
                  Showing 12 of {filtered.length}.{" "}
                  <Link
                    to="/record-office/recording"
                    className="font-semibold text-[#607796] hover:underline"
                  >
                    Open Recording
                  </Link>{" "}
                  for the full list.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="xl:col-span-2 rounded-xl border border-[#607796]/15 bg-white/70 backdrop-blur-sm p-5 sm:p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-[#3f5168]">
            Recent activity
          </h2>
          <p className="mt-0.5 text-sm text-on-surface-variant mb-4">
            Latest updates across the tracking chain.
          </p>

          {loading ? (
            <p className="text-sm text-on-surface-variant py-8 text-center">
              Loading…
            </p>
          ) : recent.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#607796]/25 bg-[#607796]/5 px-4 py-8 text-center">
              <p className="text-sm text-on-surface-variant">
                No documents yet. Record the first one to start tracking.
              </p>
              <Link
                to="/record-office/recording"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#607796] hover:underline"
              >
                Go to Recording
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {recent.map((doc) => (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => setViewingDoc(doc)}
                    className="w-full text-left rounded-xl border border-[#607796]/10 bg-[#607796]/[0.03] hover:bg-[#607796]/8 px-3.5 py-3 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-[11px] font-semibold text-[#607796]">
                        {doc.transactionCode}
                      </p>
                      <span className="text-[10px] text-[#a6a08a] shrink-0">
                        {formatRelative(doc.updatedAt || doc.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-[#3f5168] line-clamp-1">
                      {doc.subject}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${locationBadgeClass(doc)}`}
                      >
                        {locationLabel(doc)}
                      </span>
                      {doc.receivedByName && (
                        <span className="text-[10px] text-on-surface-variant">
                          by {doc.receivedByName}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-on-surface-variant">
                      Logged {formatDate(doc.dateReceived)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ViewRecord
        open={Boolean(viewingDoc)}
        document={viewingDoc}
        onClose={() => setViewingDoc(null)}
      />
    </div>
  );
};

export default RecordDashboard;
