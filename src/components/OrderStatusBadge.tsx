const MAP: Record<string, { label: string; dot: string; cls: string }> = {
  PENDING: { label: "Payment pending", dot: "bg-amber-500", cls: "bg-amber-50 text-amber-700" },
  PAID: { label: "Paid", dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700" },
  FULFILLED: { label: "Delivered", dot: "bg-slate-400", cls: "bg-slate-100 text-slate-600" },
  CANCELLED: { label: "Cancelled", dot: "bg-red-500", cls: "bg-red-50 text-red-700" },
};

export default function OrderStatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? MAP.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
