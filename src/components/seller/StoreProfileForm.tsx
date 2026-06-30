"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateStoreAction } from "@/app/actions/seller";

type Props = {
  initial: { name: string; description: string | null; logo: string | null };
};

const inputCls =
  "w-full rounded-xl bg-cloud px-4 py-3 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand transition";

export default function StoreProfileForm({ initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [logo, setLogo] = useState(initial.logo ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    const res = await updateStoreAction({ name, description, logo });
    setSaving(false);
    if (!res.ok) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    setMsg({ ok: true, text: "Store updated." });
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="s-name" className="block text-sm font-semibold text-ink mb-1.5">Store name</label>
        <input id="s-name" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </div>

      <div>
        <label htmlFor="s-desc" className="block text-sm font-semibold text-ink mb-1.5">Description <span className="text-mute font-normal">(optional)</span></label>
        <textarea id="s-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} resize-none`} />
      </div>

      <div>
        <label htmlFor="s-logo" className="block text-sm font-semibold text-ink mb-1.5">Logo URL <span className="text-mute font-normal">(optional)</span></label>
        <input id="s-logo" type="url" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://…" className={inputCls} />
        <p className="mt-1 text-xs text-mute">Direct image upload is coming soon. For now, paste an image link.</p>
      </div>

      {msg && (
        <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold py-3 transition active:scale-[0.99] disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
