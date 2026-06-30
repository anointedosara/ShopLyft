"use client";

import { useState } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/data";
import { CheckIcon, PackageIcon } from "@/components/icons";

export type ReturnableOrder = {
  id: string;
  shortId: string;
  date: string;
  totalQty: number;
  total: number;
};

const REASONS = [
  "Item arrived damaged",
  "Wrong item delivered",
  "No longer needed",
  "Item not as described",
  "Missing parts or accessories",
  "Other",
];

export default function ReturnsForm({ orders }: { orders: ReturnableOrder[] }) {
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState<{ ref: string; shortId: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const picked = orders.find((o) => o.id === orderId);
    if (!picked) return;
    setSubmitted({ ref: "RMA" + picked.shortId.replace(/\W/g, ""), shortId: picked.shortId });
  };

  if (submitted) {
    return (
      <div className="rounded-3xl bg-white ring-1 ring-line overflow-hidden text-center">
        <div className="bg-gradient-to-br from-brand to-brand-700 text-white p-8">
          <div className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-white text-brand mb-3">
            <CheckIcon width={30} height={30} strokeWidth={2.5} />
          </div>
          <h1 className="font-display font-extrabold text-2xl">Return requested</h1>
          <p className="text-white/85 mt-1">We&apos;ve received your request for order #{submitted.shortId}.</p>
        </div>
        <div className="p-6 sm:p-8">
          <div className="rounded-xl bg-cloud p-4 text-sm">
            <p className="text-mute">Return reference</p>
            <p className="font-display font-bold text-ink text-lg">#{submitted.ref}</p>
            <p className="text-emerald-600 font-semibold mt-2">We&apos;ll email you pickup instructions shortly.</p>
          </div>
          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <Link href="/account" className="rounded-xl bg-ink hover:bg-ink-soft text-white font-semibold py-3 text-center transition">
              Back to my orders
            </Link>
            <Link href="/" className="rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold py-3 text-center transition">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-cloud text-mute mb-3">
          <PackageIcon width={24} height={24} />
        </span>
        <p className="text-mute text-sm">You have no orders to return yet.</p>
        <Link href="/deals" className="inline-flex mt-4 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-5 py-2.5 text-sm transition">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-ink mb-2">Which order?</label>
        <div className="space-y-2">
          {orders.map((o) => (
            <label
              key={o.id}
              className={`flex items-center gap-3 rounded-xl ring-1 p-3 cursor-pointer transition ${
                orderId === o.id ? "ring-brand bg-brand-50" : "ring-line hover:ring-brand-200"
              }`}
            >
              <input
                type="radio"
                name="order"
                value={o.id}
                checked={orderId === o.id}
                onChange={() => setOrderId(o.id)}
                className="accent-brand"
              />
              <span className="flex-1 min-w-0">
                <span className="font-semibold text-ink">#{o.shortId}</span>
                <span className="text-sm text-mute ml-2">{o.date}</span>
                <span className="block text-xs text-ink-soft">
                  {o.totalQty} item{o.totalQty !== 1 ? "s" : ""} · {formatNaira(o.total)}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-semibold text-ink mb-2">Reason for return</label>
        <select
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-xl ring-1 ring-line bg-white px-3 py-2.5 text-ink focus:ring-brand outline-none transition"
        >
          {REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="details" className="block text-sm font-semibold text-ink mb-2">
          Additional details <span className="text-mute font-normal">(optional)</span>
        </label>
        <textarea
          id="details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          placeholder="Tell us more about the issue…"
          className="w-full rounded-xl ring-1 ring-line bg-white px-3 py-2.5 text-ink focus:ring-brand outline-none transition resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={!orderId}
        className="w-full rounded-xl bg-brand hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 transition"
      >
        Submit return request
      </button>
    </form>
  );
}
