// Verification status pill. Self-contained (no server-only deps) so it renders
// in both server and client components. Labels mirror lib/kyc STATUS_LABEL.
const MAP: Record<string, { label: string; dot: string; cls: string }> = {
  DRAFT: { label: "Draft", dot: "bg-slate-400", cls: "bg-slate-100 text-slate-600" },
  PENDING_REVIEW: { label: "Pending review", dot: "bg-amber-500", cls: "bg-amber-50 text-amber-700" },
  UNDER_REVIEW: { label: "Under review", dot: "bg-blue-500", cls: "bg-blue-50 text-blue-700" },
  APPROVED: { label: "Approved", dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700" },
  REJECTED: { label: "Rejected", dot: "bg-red-500", cls: "bg-red-50 text-red-700" },
  SUSPENDED: { label: "Suspended", dot: "bg-orange-600", cls: "bg-orange-50 text-orange-700" },
};

export default function SellerStatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? MAP.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
