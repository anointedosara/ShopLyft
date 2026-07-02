"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTaxAction, deleteTaxAction } from "@/app/actions/seller-settings";

const inputCls =
  "w-full rounded-xl bg-cloud px-4 py-3 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand transition";

type Tax = { id: string; name: string; region: string | null; percent: number; inclusive: boolean; active: boolean };

export default function TaxManager({ initial }: { initial: Tax[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [percent, setPercent] = useState("");
  const [inclusive, setInclusive] = useState(false);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createTaxAction({
        name,
        region,
        percent: Number(percent) || 0,
        inclusive,
        active: true,
      });
      if (!res.ok) return setError(res.error);
      setName("");
      setRegion("");
      setPercent("");
      setInclusive(false);
      router.refresh();
    });
  };

  const remove = (id: string) =>
    startTransition(async () => {
      await deleteTaxAction(id);
      router.refresh();
    });

  return (
    <section className="rounded-2xl bg-white ring-1 ring-line p-5 sm:p-6">
      <h2 className="font-display font-bold text-ink mb-4">Tax rates</h2>

      {initial.length > 0 && (
        <ul className="divide-y divide-line mb-4">
          {initial.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="text-ink">
                <span className="font-semibold">{t.name}</span> · {t.percent}%
                {t.region ? ` · ${t.region}` : " · all regions"}
                {t.inclusive ? " · inclusive" : ""}
              </span>
              <button onClick={() => remove(t.id)} disabled={pending} className="rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs px-3 py-1.5 transition disabled:opacity-60">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="grid sm:grid-cols-4 gap-3 items-end">
        <label className="block sm:col-span-1">
          <span className="block text-xs font-semibold text-ink mb-1.5">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="VAT" className={inputCls} />
        </label>
        <label className="block sm:col-span-1">
          <span className="block text-xs font-semibold text-ink mb-1.5">Region (optional)</span>
          <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="All" className={inputCls} />
        </label>
        <label className="block sm:col-span-1">
          <span className="block text-xs font-semibold text-ink mb-1.5">Percent</span>
          <input type="number" min={0} max={100} step="0.1" value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="7.5" className={inputCls} />
        </label>
        <button type="submit" disabled={pending} className="rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-4 py-3 text-sm transition disabled:opacity-60">
          Add tax
        </button>
      </form>
      <label className="mt-2 inline-flex items-center gap-2 text-sm text-mute">
        <input type="checkbox" checked={inclusive} onChange={(e) => setInclusive(e.target.checked)} className="h-4 w-4 accent-brand" />
        Prices already include this tax
      </label>
      {error && <p className="mt-2 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>}
    </section>
  );
}
