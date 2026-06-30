"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreProvider";
import { formatNaira } from "@/lib/data";
import Breadcrumbs from "@/components/Breadcrumbs";

const REASONS = [
  "Item arrived damaged",
  "Wrong item delivered",
  "No longer needed",
  "Item not as described",
  "Missing parts or accessories",
  "Other",
];

const steps = [
  { n: "1", title: "Pick your order", text: "Choose the order you'd like to return." },
  { n: "2", title: "Tell us why", text: "Select a reason and add any details." },
  { n: "3", title: "We handle the rest", text: "We'll arrange pickup and process your refund." },
];

export default function ReturnsPage() {
  const { orders, hydrated } = useStore();
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState<{ ref: string; orderId: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;
    setSubmitted({ ref: "RMA" + orderId.replace(/\D/g, ""), orderId });
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-[640px] px-3 sm:px-5 py-10 sm:py-14">
        <div className="rounded-3xl bg-white ring-1 ring-line overflow-hidden text-center">
          <div className="bg-gradient-to-br from-brand to-brand-700 text-white p-8">
            <div className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-white text-brand text-3xl mb-3">✓</div>
            <h1 className="font-display font-extrabold text-2xl">Return requested</h1>
            <p className="text-white/85 mt-1">We&apos;ve received your request for order #{submitted.orderId}.</p>
          </div>
          <div className="p-6 sm:p-8">
            <div className="rounded-xl bg-cloud p-4 text-sm">
              <p className="text-mute">Return reference</p>
              <p className="font-display font-bold text-ink text-lg">#{submitted.ref}</p>
              <p className="text-green-600 font-semibold mt-2">📦 We&apos;ll email you pickup instructions shortly.</p>
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
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[760px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Returns & Refunds" }]} />

      <div className="mt-4">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">Returns & Refunds</h1>
        <p className="text-mute mt-1">Eligible items can be returned within 7 days of delivery. Start a request below.</p>
      </div>

      {/* how it works */}
      <div className="mt-6 grid sm:grid-cols-3 gap-3">
        {steps.map((s) => (
          <div key={s.n} className="rounded-2xl bg-white ring-1 ring-line p-5">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-brand text-white font-display font-bold">{s.n}</span>
            <p className="font-semibold text-ink mt-3">{s.title}</p>
            <p className="text-sm text-mute mt-0.5">{s.text}</p>
          </div>
        ))}
      </div>

      {/* form */}
      <section className="mt-8 rounded-2xl bg-white ring-1 ring-line p-6 sm:p-8">
        <h2 className="font-display font-bold text-ink mb-4">Start a return</h2>

        {!hydrated ? (
          <p className="text-mute text-sm">Loading your orders…</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">🧾</p>
            <p className="text-mute text-sm">You have no orders to return yet.</p>
            <Link href="/deals" className="inline-flex mt-4 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-5 py-2.5 text-sm transition">
              Start shopping
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Which order?</label>
              <div className="space-y-2">
                {orders.map((o) => {
                  const totalQty = o.items.reduce((a, it) => a + it.qty, 0);
                  return (
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
                        <span className="font-semibold text-ink">#{o.id}</span>
                        <span className="text-sm text-mute ml-2" suppressHydrationWarning>{o.date}</span>
                        <span className="block text-xs text-ink-soft">
                          {totalQty} item{totalQty !== 1 ? "s" : ""} · {formatNaira(o.total)}
                        </span>
                      </span>
                    </label>
                  );
                })}
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
        )}
      </section>
    </div>
  );
}
