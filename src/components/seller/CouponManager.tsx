"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCouponAction, toggleCouponAction, deleteCouponAction } from "@/app/actions/seller-coupons";
import { formatNaira } from "@/lib/data";

type Row = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minSpend: number | null;
  maxUses: number | null;
  perUserLimit: number | null;
  usedCount: number;
  redemptions: number;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
};

const inputCls =
  "w-full rounded-xl bg-cloud px-4 py-3 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand transition";

export default function CouponManager({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [value, setValue] = useState("");
  const [minSpend, setMinSpend] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const num = (s: string) => (s.trim() === "" ? null : Math.floor(Number(s)));

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createCouponAction({
        code,
        type,
        value: Math.floor(Number(value)) || 0,
        minSpend: num(minSpend),
        maxUses: num(maxUses),
        perUserLimit: num(perUserLimit),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: true,
      });
      if (!res.ok) return setError(res.error);
      setCode("");
      setValue("");
      setMinSpend("");
      setMaxUses("");
      setPerUserLimit("");
      setExpiresAt("");
      router.refresh();
    });
  };

  const toggle = (id: string, active: boolean) =>
    startTransition(async () => {
      await toggleCouponAction(id, active);
      router.refresh();
    });

  const remove = (id: string) =>
    startTransition(async () => {
      await deleteCouponAction(id);
      router.refresh();
    });

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-6 items-start">
      {/* create */}
      <form onSubmit={create} className="rounded-2xl bg-white ring-1 ring-line p-5 sm:p-6 space-y-3">
        <h2 className="font-display font-bold text-ink">New coupon</h2>
        <div>
          <label className="block text-sm font-semibold text-ink mb-1.5">Code</label>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SAVE10" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as "PERCENT" | "FIXED")} className={inputCls}>
              <option value="PERCENT">Percentage</option>
              <option value="FIXED">Fixed ₦</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">{type === "PERCENT" ? "Percent" : "Amount ₦"}</label>
            <input type="number" min={1} value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "PERCENT" ? "10" : "1000"} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Min spend ₦</label>
            <input type="number" min={0} value={minSpend} onChange={(e) => setMinSpend(e.target.value)} placeholder="Optional" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Expires</label>
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Max uses</label>
            <input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="∞" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Per user</label>
            <input type="number" min={1} value={perUserLimit} onChange={(e) => setPerUserLimit(e.target.value)} placeholder="∞" className={inputCls} />
          </div>
        </div>
        {error && <p className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>}
        <button type="submit" disabled={pending} className="w-full rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold py-3 text-sm transition disabled:opacity-60">
          {pending ? "Saving…" : "Create coupon"}
        </button>
      </form>

      {/* list */}
      <section className="rounded-2xl bg-white ring-1 ring-line p-5 sm:p-6">
        <h2 className="font-display font-bold text-ink mb-4">Your coupons <span className="text-mute font-normal text-sm">({initial.length})</span></h2>
        {initial.length > 0 ? (
          <ul className="divide-y divide-line">
            {initial.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-ink">{c.code}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.active ? "bg-green-50 text-green-700" : "bg-cloud text-mute"}`}>
                      {c.active ? "Active" : "Off"}
                    </span>
                  </div>
                  <p className="text-mute text-xs mt-0.5">
                    {c.type === "PERCENT" ? `${c.value}% off` : `${formatNaira(c.value)} off`}
                    {c.minSpend ? ` · min ${formatNaira(c.minSpend)}` : ""}
                    {c.maxUses ? ` · ${c.usedCount}/${c.maxUses} used` : ` · ${c.redemptions} used`}
                    {c.expiresAt ? ` · exp ${new Date(c.expiresAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggle(c.id, !c.active)} disabled={pending} className="rounded-lg bg-cloud hover:bg-line text-ink-soft font-semibold text-xs px-3 py-1.5 transition disabled:opacity-60">
                    {c.active ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => remove(c.id)} disabled={pending} className="rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs px-3 py-1.5 transition disabled:opacity-60">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-mute text-sm py-6 text-center">No coupons yet. Create your first one to run a promotion.</p>
        )}
      </section>
    </div>
  );
}
