// Product moderation status pill. Self-contained (no server-only deps) so it
// renders in both server and client components.
const MAP: Record<string, { label: string; dot: string; cls: string }> = {
  PENDING: { label: "Pending review", dot: "bg-amber-500", cls: "bg-amber-50 text-amber-700" },
  PUBLISHED: { label: "Live", dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700" },
  REJECTED: { label: "Declined", dot: "bg-red-500", cls: "bg-red-50 text-red-700" },
  TAKEN_DOWN: { label: "Taken down", dot: "bg-orange-600", cls: "bg-orange-50 text-orange-700" },
};

export default function ProductStatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? MAP.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
