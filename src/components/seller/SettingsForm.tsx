"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSettingsAction } from "@/app/actions/seller-settings";

const inputCls =
  "w-full rounded-xl bg-cloud px-4 py-3 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand transition";

type Settings = {
  processingDays: number;
  returnWindowDays: number;
  autoAcceptReturns: boolean;
  supportEmail: string | null;
  supportPhone: string | null;
  payoutBankName: string | null;
  payoutAccountName: string | null;
  vacationMode: boolean;
};

export default function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [s, setS] = useState(initial);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await updateSettingsAction({
        processingDays: Number(s.processingDays),
        returnWindowDays: Number(s.returnWindowDays),
        autoAcceptReturns: s.autoAcceptReturns,
        supportEmail: s.supportEmail ?? "",
        supportPhone: s.supportPhone ?? "",
        payoutBankName: s.payoutBankName ?? "",
        payoutAccountName: s.payoutAccountName ?? "",
        vacationMode: s.vacationMode,
      });
      setMsg(res.ok ? { ok: true, text: "Settings saved." } : { ok: false, text: res.error });
      if (res.ok) router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white ring-1 ring-line p-5 sm:p-6 space-y-4">
      <h2 className="font-display font-bold text-ink">Store settings</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-semibold text-ink mb-1.5">Processing time (days)</span>
          <input type="number" min={0} max={60} value={s.processingDays} onChange={(e) => set("processingDays", Number(e.target.value))} className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-ink mb-1.5">Return window (days)</span>
          <input type="number" min={0} max={90} value={s.returnWindowDays} onChange={(e) => set("returnWindowDays", Number(e.target.value))} className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-ink mb-1.5">Support email</span>
          <input type="email" value={s.supportEmail ?? ""} onChange={(e) => set("supportEmail", e.target.value)} placeholder="support@store.com" className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-ink mb-1.5">Support phone</span>
          <input value={s.supportPhone ?? ""} onChange={(e) => set("supportPhone", e.target.value)} placeholder="0801 234 5678" className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-ink mb-1.5">Payout bank</span>
          <input value={s.payoutBankName ?? ""} onChange={(e) => set("payoutBankName", e.target.value)} placeholder="GTBank" className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-ink mb-1.5">Payout account name</span>
          <input value={s.payoutAccountName ?? ""} onChange={(e) => set("payoutAccountName", e.target.value)} placeholder="Account holder" className={inputCls} />
        </label>
      </div>

      <label className="flex items-center gap-3 rounded-xl bg-cloud px-4 py-3">
        <input type="checkbox" checked={s.autoAcceptReturns} onChange={(e) => set("autoAcceptReturns", e.target.checked)} className="h-4 w-4 accent-brand" />
        <span className="text-sm text-ink">Auto-accept return requests within the return window</span>
      </label>
      <label className="flex items-center gap-3 rounded-xl bg-cloud px-4 py-3">
        <input type="checkbox" checked={s.vacationMode} onChange={(e) => set("vacationMode", e.target.checked)} className="h-4 w-4 accent-brand" />
        <span className="text-sm text-ink">Vacation mode — temporarily hide my store from buyers</span>
      </label>

      {msg && <p className={`rounded-lg text-sm px-3 py-2 ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
      <button type="submit" disabled={pending} className="rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-6 py-2.5 text-sm transition disabled:opacity-60">
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
