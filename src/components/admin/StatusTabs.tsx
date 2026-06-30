import Link from "next/link";

// Filter tabs for the seller review queue. Server component — each tab is just a
// link that sets ?status=. `counts` drives the little number on each tab.
const TABS: { key: string; label: string }[] = [
  { key: "queue", label: "Needs review" },
  { key: "PENDING_REVIEW", label: "Pending" },
  { key: "UNDER_REVIEW", label: "Under review" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "SUSPENDED", label: "Suspended" },
  { key: "all", label: "All" },
];

export default function StatusTabs({
  active,
  counts,
}: {
  active: string;
  counts: Record<string, number>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((t) => {
        const isActive = t.key === active;
        const count = counts[t.key];
        return (
          <Link
            key={t.key}
            href={`/admin/sellers?status=${t.key}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              isActive ? "bg-ink text-white" : "bg-white ring-1 ring-line text-ink-soft hover:bg-cloud"
            }`}
          >
            {t.label}
            {count != null && count > 0 && (
              <span className={`text-xs ${isActive ? "text-white/70" : "text-mute"}`}>{count}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
