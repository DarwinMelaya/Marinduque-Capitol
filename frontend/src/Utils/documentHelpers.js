/** Format an ISO date string as e.g. "Jan 5, 2026" (falls back to a dash). */
export const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/** Short relative time such as "Just now", "5m ago", "3h ago", "2d ago". */
export const formatRelative = (value) => {
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

/** Replace an item by id in a list; leaves the list unchanged if absent. */
export const replaceById = (list, item) =>
  list.map((entry) => (entry.id === item.id ? item : entry));

/** Replace an item by id, or prepend it when it isn't already present. */
export const upsertById = (list, item) =>
  list.some((entry) => entry.id === item.id)
    ? replaceById(list, item)
    : [item, ...list];
