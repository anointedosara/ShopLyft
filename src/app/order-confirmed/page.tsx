"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreProvider";
import { formatNaira } from "@/lib/data";

export default function OrderConfirmedPage() {
  const { lastOrder, hydrated } = useStore();

  if (hydrated && !lastOrder) {
    return (
      <div className="mx-auto max-w-[640px] px-3 sm:px-5 py-16 text-center">
        <p className="text-6xl mb-4">📦</p>
        <h1 className="font-display font-extrabold text-2xl text-ink">No recent order</h1>
        <p className="text-mute mt-2">Place an order to see your confirmation here.</p>
        <Link href="/deals" className="inline-flex mt-6 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-6 py-3 transition">
          Browse deals
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] px-3 sm:px-5 py-10 sm:py-14">
      <div className="rounded-3xl bg-white ring-1 ring-line overflow-hidden">
        <div className="bg-gradient-to-br from-brand to-brand-700 text-white p-8 text-center">
          <div className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-white text-brand text-3xl mb-3">✓</div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">Order confirmed!</h1>
          <p className="text-white/85 mt-1">Thank you{lastOrder ? `, ${lastOrder.name.split(" ")[0]}` : ""} — your order is on its way.</p>
        </div>

        {lastOrder && (
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap justify-between gap-3 text-sm border-b border-line pb-4">
              <div>
                <p className="text-mute">Order number</p>
                <p className="font-display font-bold text-ink">#{lastOrder.id}</p>
              </div>
              <div className="text-right">
                <p className="text-mute">Date</p>
                <p className="font-medium text-ink" suppressHydrationWarning>{lastOrder.date}</p>
              </div>
            </div>

            <div className="py-4 space-y-2">
              {lastOrder.items.map((it, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-ink-soft">{it.name} × {it.qty}</span>
                  <span className="font-semibold text-ink">{formatNaira(it.price * it.qty)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between border-t border-line pt-4">
              <span className="font-bold text-ink">Total paid</span>
              <span className="font-display font-extrabold text-xl text-ink">{formatNaira(lastOrder.total)}</span>
            </div>

            <div className="mt-4 rounded-xl bg-cloud p-4 text-sm">
              <p className="text-mute">Delivering to</p>
              <p className="font-medium text-ink">{lastOrder.name} · {lastOrder.address}</p>
              <p className="text-green-600 font-semibold mt-2">🚚 Estimated delivery: 2–4 business days</p>
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              <Link href="/account" className="rounded-xl bg-ink hover:bg-ink-soft text-white font-semibold py-3 text-center transition">
                Track my order
              </Link>
              <Link href="/" className="rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold py-3 text-center transition">
                Continue shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
