"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fulfillOrderAction } from "@/app/actions/seller-orders";
import { CheckIcon, TruckIcon } from "@/components/icons";

// Lets a seller mark their items in an order as fulfilled. Shows a settled state
// once done; the parent re-renders from the DB on refresh.
export default function FulfillButton({ orderId, fulfilled }: { orderId: string; fulfilled: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (fulfilled) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-sm px-4 py-2.5">
        <CheckIcon width={16} height={16} /> Items fulfilled
      </span>
    );
  }

  const fulfill = async () => {
    setError(null);
    setSaving(true);
    const res = await fulfillOrderAction(orderId);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={fulfill}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold text-sm px-4 py-2.5 transition active:scale-[0.99] disabled:opacity-60"
      >
        <TruckIcon width={16} height={16} />
        {saving ? "Marking…" : "Mark fulfilled"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
