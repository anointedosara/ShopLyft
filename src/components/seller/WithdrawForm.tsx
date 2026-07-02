"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestWithdrawalAction } from "@/app/actions/seller-wallet";
import { formatNaira } from "@/lib/data";

export default function WithdrawForm({ available }: { available: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const naira = Math.floor(Number(amount));
    if (!Number.isFinite(naira) || naira <= 0) return setError("Enter an amount greater than 0.");
    if (naira > available) return setError("That exceeds your available balance.");

    startTransition(async () => {
      const res = await requestWithdrawalAction({ amount: naira });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess("Withdrawal requested. You'll be notified when it's processed.");
      setAmount("");
      router.refresh();
    });
  };

  return (
    <section className="rounded-2xl bg-white ring-1 ring-line p-5">
      <h2 className="font-display font-bold text-ink mb-1">Withdraw funds</h2>
      <p className="text-mute text-xs mb-3">Available: {formatNaira(available)}</p>
      <form onSubmit={submit} className="space-y-3">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute text-sm">₦</span>
          <input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            disabled={available <= 0}
            className="w-full rounded-xl bg-cloud pl-7 pr-4 py-3 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand transition disabled:opacity-60"
          />
        </div>
        {error && <p className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>}
        {success && <p className="rounded-lg bg-green-50 text-green-700 text-sm px-3 py-2">{success}</p>}
        <button
          type="submit"
          disabled={pending || available <= 0}
          className="w-full rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold py-2.5 text-sm transition active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? "Requesting…" : "Request withdrawal"}
        </button>
      </form>
    </section>
  );
}
