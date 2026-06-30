"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { becomeSellerAction } from "@/app/actions/seller";

const inputCls =
  "w-full rounded-xl bg-cloud px-4 py-3 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand transition";

export default function StoreOnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await becomeSellerAction({ name, description });
    if (!res.ok) {
      setSaving(false);
      setError(res.error);
      return;
    }
    // Straight into verification — sellers must be approved before they can list.
    router.push("/seller/verification");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="store-name" className="block text-sm font-semibold text-ink mb-1.5">Store name</label>
        <input
          id="store-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ada's Gadgets"
          className={inputCls}
        />
        <p className="mt-1 text-xs text-mute">This is the name buyers will see on your products.</p>
      </div>

      <div>
        <label htmlFor="store-desc" className="block text-sm font-semibold text-ink mb-1.5">
          Description <span className="text-mute font-normal">(optional)</span>
        </label>
        <textarea
          id="store-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What do you sell? Tell buyers about your store."
          className={`${inputCls} resize-none`}
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold py-3 transition active:scale-[0.99] disabled:opacity-60"
      >
        {saving ? "Creating your store…" : "Create my store"}
      </button>
      <p className="text-center text-xs text-mute">
        Next, you&apos;ll verify your identity and business. Approved sellers can list products.
      </p>
    </form>
  );
}
