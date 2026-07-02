"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveProductAction,
  rejectProductAction,
  takeDownProductAction,
} from "@/app/actions/product-moderation";

// Approve / decline / take-down controls for a single product in the admin
// moderation queue. `status` decides which controls make sense: PENDING can be
// approved or declined; PUBLISHED can be taken down; declined/pulled can be
// re-approved.
export default function ProductModerationActions({
  productId,
  status,
}: {
  productId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<null | "reject" | "takedown">(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMode(null);
      setReason("");
      router.refresh();
    });
  };

  const submitReason = () => {
    if (mode === "reject") run(() => rejectProductAction(productId, reason));
    else if (mode === "takedown") run(() => takeDownProductAction(productId, reason));
  };

  if (mode) {
    return (
      <div className="flex flex-col gap-2 sm:w-72">
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={mode === "reject" ? "Why is this declined?" : "Why is this being taken down?"}
          rows={2}
          className="w-full rounded-lg bg-cloud px-3 py-2 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand resize-none"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={submitReason}
            disabled={pending || !reason.trim()}
            className="rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-3 py-1.5 transition disabled:opacity-60"
          >
            {pending ? "Saving…" : mode === "reject" ? "Decline" : "Take down"}
          </button>
          <button
            onClick={() => { setMode(null); setError(null); }}
            disabled={pending}
            className="rounded-lg bg-cloud hover:bg-line text-ink-soft font-semibold text-sm px-3 py-1.5 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(status === "PENDING" || status === "REJECTED" || status === "TAKEN_DOWN") && (
        <button
          onClick={() => run(() => approveProductAction(productId))}
          disabled={pending}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-3 py-1.5 transition disabled:opacity-60"
        >
          {pending ? "…" : status === "PENDING" ? "Approve" : "Publish"}
        </button>
      )}
      {status === "PENDING" && (
        <button
          onClick={() => setMode("reject")}
          disabled={pending}
          className="rounded-lg bg-white ring-1 ring-line hover:ring-red-300 hover:text-red-600 text-ink-soft font-semibold text-sm px-3 py-1.5 transition"
        >
          Decline
        </button>
      )}
      {status === "PUBLISHED" && (
        <button
          onClick={() => setMode("takedown")}
          disabled={pending}
          className="rounded-lg bg-white ring-1 ring-line hover:ring-red-300 hover:text-red-600 text-ink-soft font-semibold text-sm px-3 py-1.5 transition"
        >
          Take down
        </button>
      )}
      {error && <p className="text-xs text-red-600 w-full">{error}</p>}
    </div>
  );
}
