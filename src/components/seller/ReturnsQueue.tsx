"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatNaira } from "@/lib/data";
import { transitionReturnAction } from "@/app/actions/seller-returns";

type ReturnRow = {
  id: string;
  orderShort: string;
  buyerName: string;
  reason: string;
  detail: string | null;
  status: string;
  refundAmount: number | null;
  units: number;
  createdAt: string;
};

const STATUS_STYLE: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700",
  APPROVED: "bg-blue-50 text-blue-700",
  IN_TRANSIT: "bg-indigo-50 text-indigo-700",
  RECEIVED: "bg-purple-50 text-purple-700",
  REFUNDED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  CANCELLED: "bg-cloud text-mute",
};

export default function ReturnsQueue({ initial }: { initial: ReturnRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [refundFor, setRefundFor] = useState<string | null>(null);
  const [refundAmt, setRefundAmt] = useState("");

  const act = (id: string, next: string, refundAmount?: number) =>
    startTransition(async () => {
      setError(null);
      const res = await transitionReturnAction(id, { next, refundAmount: refundAmount ?? null });
      if (!res.ok) return setError(res.error);
      setRefundFor(null);
      setRefundAmt("");
      router.refresh();
    });

  if (initial.length === 0) {
    return <p className="rounded-2xl bg-white ring-1 ring-line p-8 text-center text-mute text-sm">No return requests yet.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>}
      {initial.map((r) => (
        <div key={r.id} className="rounded-2xl bg-white ring-1 ring-line p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">Order #{r.orderShort}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.status] ?? "bg-cloud text-mute"}`}>{r.status}</span>
              </div>
              <p className="text-mute text-sm mt-1">
                {r.buyerName} · {r.units} item{r.units === 1 ? "" : "s"} · {r.reason.replaceAll("_", " ").toLowerCase()}
              </p>
              {r.detail && <p className="text-ink-soft text-sm mt-1">“{r.detail}”</p>}
              {r.refundAmount != null && <p className="text-green-700 text-sm mt-1 font-medium">Refunded {formatNaira(r.refundAmount)}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {r.status === "REQUESTED" && (
                <>
                  <button onClick={() => act(r.id, "APPROVED")} disabled={pending} className="rounded-lg bg-brand hover:bg-brand-600 text-white font-semibold text-xs px-3 py-1.5 transition disabled:opacity-60">Approve</button>
                  <button onClick={() => act(r.id, "REJECTED")} disabled={pending} className="rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs px-3 py-1.5 transition disabled:opacity-60">Reject</button>
                </>
              )}
              {(r.status === "APPROVED" || r.status === "IN_TRANSIT") && (
                <button onClick={() => act(r.id, "RECEIVED")} disabled={pending} className="rounded-lg bg-ink hover:bg-ink-soft text-white font-semibold text-xs px-3 py-1.5 transition disabled:opacity-60">Mark received</button>
              )}
              {(r.status === "RECEIVED" || r.status === "APPROVED") && (
                <button onClick={() => setRefundFor(refundFor === r.id ? null : r.id)} disabled={pending} className="rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-3 py-1.5 transition disabled:opacity-60">Refund</button>
              )}
            </div>
          </div>

          {refundFor === r.id && (
            <div className="mt-3 flex items-end gap-2">
              <label className="block">
                <span className="block text-xs font-semibold text-ink mb-1">Refund amount ₦</span>
                <input type="number" min={1} value={refundAmt} onChange={(e) => setRefundAmt(e.target.value)} className="rounded-xl bg-cloud px-4 py-2.5 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand" />
              </label>
              <button
                onClick={() => act(r.id, "REFUNDED", Math.floor(Number(refundAmt)) || 0)}
                disabled={pending}
                className="rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-4 py-2.5 transition disabled:opacity-60"
              >
                Confirm refund
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
