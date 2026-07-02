"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { formatNaira } from "@/lib/data";
import { createZoneAction, deleteZoneAction, addRateAction, deleteRateAction } from "@/app/actions/seller-settings";

const inputCls =
  "w-full rounded-xl bg-cloud px-4 py-3 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand transition";

type Rate = { id: string; method: string; price: number; freeOver: number | null; minDays: number; maxDays: number };
type Zone = { id: string; name: string; regions: string[]; rates: Rate[] };

export default function ShippingManager({ initial }: { initial: Zone[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [zoneName, setZoneName] = useState("");
  const [regions, setRegions] = useState<string[]>([]);

  const toggleRegion = (r: string) =>
    setRegions((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]));

  const addZone = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createZoneAction({ name: zoneName, regions });
      if (!res.ok) return setError(res.error);
      setZoneName("");
      setRegions([]);
      router.refresh();
    });
  };

  const removeZone = (id: string) =>
    startTransition(async () => {
      await deleteZoneAction(id);
      router.refresh();
    });

  return (
    <div className="space-y-6">
      {initial.map((z) => (
        <ZoneCard key={z.id} zone={z} pending={pending} onDelete={() => removeZone(z.id)} onChanged={() => router.refresh()} />
      ))}

      <form onSubmit={addZone} className="rounded-2xl bg-white ring-1 ring-line p-5 sm:p-6 space-y-4">
        <h2 className="font-display font-bold text-ink">New shipping zone</h2>
        <label className="block max-w-sm">
          <span className="block text-sm font-semibold text-ink mb-1.5">Zone name</span>
          <input value={zoneName} onChange={(e) => setZoneName(e.target.value)} placeholder="e.g. South-West" className={inputCls} />
        </label>
        <div>
          <span className="block text-sm font-semibold text-ink mb-2">Regions covered</span>
          <div className="flex flex-wrap gap-2">
            {NIGERIAN_STATES.map((st) => {
              const on = regions.includes(st);
              return (
                <button
                  type="button"
                  key={st}
                  onClick={() => toggleRegion(st)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${on ? "bg-brand text-white" : "bg-cloud text-ink-soft hover:bg-line"}`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>
        {error && <p className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>}
        <button type="submit" disabled={pending} className="rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-6 py-2.5 text-sm transition disabled:opacity-60">
          {pending ? "Saving…" : "Create zone"}
        </button>
      </form>
    </div>
  );
}

function ZoneCard({ zone, pending, onDelete, onChanged }: { zone: Zone; pending: boolean; onDelete: () => void; onChanged: () => void }) {
  const [, startTransition] = useTransition();
  const [method, setMethod] = useState("STANDARD");
  const [price, setPrice] = useState("");
  const [freeOver, setFreeOver] = useState("");
  const [minDays, setMinDays] = useState("2");
  const [maxDays, setMaxDays] = useState("5");
  const [error, setError] = useState<string | null>(null);

  const addRate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await addRateAction({
        zoneId: zone.id,
        method,
        price: Number(price) || 0,
        freeOver: freeOver.trim() ? Number(freeOver) : null,
        minDays: Number(minDays) || 0,
        maxDays: Number(maxDays) || 0,
      });
      if (!res.ok) return setError(res.error);
      setPrice("");
      setFreeOver("");
      onChanged();
    });
  };

  const removeRate = (id: string) => startTransition(async () => { await deleteRateAction(id); onChanged(); });

  return (
    <section className="rounded-2xl bg-white ring-1 ring-line p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-ink">{zone.name}</h3>
          <p className="text-mute text-xs mt-0.5">{zone.regions.join(", ") || "No regions"}</p>
        </div>
        <button onClick={onDelete} disabled={pending} className="rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs px-3 py-1.5 transition disabled:opacity-60">
          Delete zone
        </button>
      </div>

      {zone.rates.length > 0 && (
        <ul className="mt-3 divide-y divide-line">
          {zone.rates.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="text-ink">
                <span className="font-semibold">{r.method}</span> · {formatNaira(r.price)} · {r.minDays}–{r.maxDays} days
                {r.freeOver ? ` · free over ${formatNaira(r.freeOver)}` : ""}
              </span>
              <button onClick={() => removeRate(r.id)} className="text-red-600 hover:underline text-xs font-semibold">Remove</button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addRate} className="mt-4 grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
        <label className="block col-span-2 sm:col-span-1">
          <span className="block text-xs font-semibold text-ink mb-1">Method</span>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
            <option value="STANDARD">Standard</option>
            <option value="EXPRESS">Express</option>
            <option value="PICKUP">Pickup</option>
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-ink mb-1">Price ₦</span>
          <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-ink mb-1">Free over</span>
          <input type="number" min={0} value={freeOver} onChange={(e) => setFreeOver(e.target.value)} placeholder="—" className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-ink mb-1">Min days</span>
          <input type="number" min={0} value={minDays} onChange={(e) => setMinDays(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-ink mb-1">Max days</span>
          <input type="number" min={0} value={maxDays} onChange={(e) => setMaxDays(e.target.value)} className={inputCls} />
        </label>
        <button type="submit" className="rounded-xl bg-ink hover:bg-ink-soft text-white font-semibold px-4 py-3 text-sm transition">Add rate</button>
      </form>
      {error && <p className="mt-2 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>}
    </section>
  );
}
