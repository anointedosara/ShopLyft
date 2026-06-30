"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  startReviewAction,
  approveSellerAction,
  rejectSellerAction,
  requestInfoAction,
  suspendSellerAction,
  reinstateSellerAction,
} from "@/app/actions/admin";

type ReasonKind = "reject" | "suspend" | "requestInfo";

const REASON_META: Record<ReasonKind, { title: string; placeholder: string; cta: string; danger: boolean }> = {
  reject: { title: "Reject application", placeholder: "Why is this being declined? The seller will see this.", cta: "Confirm rejection", danger: true },
  suspend: { title: "Suspend store", placeholder: "Reason for suspending this store.", cta: "Confirm suspension", danger: true },
  requestInfo: { title: "Request more information", placeholder: "What does the seller need to provide?", cta: "Send request", danger: false },
};

export default function ReviewActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<ReasonKind | null>(null);
  const [text, setText] = useState("");

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(true);
    setError(null);
    const res = await fn();
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      return;
    }
    setReason(null);
    setText("");
    router.refresh();
  };

  const btn = "rounded-xl font-semibold text-sm px-4 py-2.5 transition active:scale-[0.99] disabled:opacity-60";

  // Reason-collecting panel (reject / suspend / request info).
  if (reason) {
    const meta = REASON_META[reason];
    const submit = () => {
      if (reason === "reject") return run(() => rejectSellerAction(id, text));
      if (reason === "suspend") return run(() => suspendSellerAction(id, text));
      return run(() => requestInfoAction(id, text));
    };
    return (
      <div className="rounded-2xl bg-cloud ring-1 ring-line p-4">
        <p className="font-semibold text-ink text-sm mb-2">{meta.title}</p>
        <textarea
          autoFocus
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={meta.placeholder}
          className="w-full rounded-xl bg-white px-3 py-2 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand transition resize-none"
        />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button
            onClick={submit}
            disabled={busy || !text.trim()}
            className={`${btn} text-white ${meta.danger ? "bg-red-600 hover:bg-red-700" : "bg-brand hover:bg-brand-600"}`}
          >
            {busy ? "Working…" : meta.cta}
          </button>
          <button
            onClick={() => { setReason(null); setText(""); setError(null); }}
            disabled={busy}
            className={`${btn} bg-white ring-1 ring-line text-ink hover:bg-cloud`}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const Approve = (
    <button onClick={() => run(() => approveSellerAction(id))} disabled={busy} className={`${btn} bg-emerald-600 hover:bg-emerald-700 text-white`}>
      Approve
    </button>
  );
  const Reject = (
    <button onClick={() => setReason("reject")} disabled={busy} className={`${btn} bg-white ring-1 ring-line text-red-600 hover:bg-red-50`}>
      Reject
    </button>
  );
  const RequestInfo = (
    <button onClick={() => setReason("requestInfo")} disabled={busy} className={`${btn} bg-white ring-1 ring-line text-ink hover:bg-cloud`}>
      Request info
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {status === "PENDING_REVIEW" && (
          <button onClick={() => run(() => startReviewAction(id))} disabled={busy} className={`${btn} bg-blue-600 hover:bg-blue-700 text-white`}>
            Start review
          </button>
        )}
        {(status === "PENDING_REVIEW" || status === "UNDER_REVIEW") && (
          <>
            {Approve}
            {RequestInfo}
            {Reject}
          </>
        )}
        {status === "REJECTED" && Approve}
        {status === "APPROVED" && (
          <button onClick={() => setReason("suspend")} disabled={busy} className={`${btn} bg-white ring-1 ring-line text-orange-700 hover:bg-orange-50`}>
            Suspend store
          </button>
        )}
        {status === "SUSPENDED" && (
          <button onClick={() => run(() => reinstateSellerAction(id))} disabled={busy} className={`${btn} bg-emerald-600 hover:bg-emerald-700 text-white`}>
            Reinstate store
          </button>
        )}
        {status === "DRAFT" && <p className="text-sm text-mute">The seller hasn&apos;t submitted this application yet.</p>}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
