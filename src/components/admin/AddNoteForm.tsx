"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addNoteAction } from "@/app/actions/admin";

// Internal note composer for an application. Notes are admin-only and recorded
// in the audit trail.
export default function AddNoteForm({ id }: { id: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await addNoteAction(id, body);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setBody("");
    router.refresh();
  };

  return (
    <form onSubmit={submit}>
      <textarea
        rows={2}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add an internal note…"
        className="w-full rounded-xl bg-cloud px-3 py-2 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand transition resize-none"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy || !body.trim()}
        className="mt-2 rounded-xl bg-ink hover:bg-ink-soft text-white font-semibold text-sm px-4 py-2 transition disabled:opacity-60"
      >
        {busy ? "Saving…" : "Add note"}
      </button>
    </form>
  );
}
