"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/context/StoreProvider";
import { formatNaira } from "@/lib/data";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { orders, hydrated } = useStore();

  const index = orders.findIndex((o) => o.id === id);
  const order = index >= 0 ? orders[index] : null;

  // wait for localStorage hydration before deciding the order is missing
  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[640px] px-3 sm:px-5 py-16 text-center text-mute">
        Loading order…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-[640px] px-3 sm:px-5 py-16 text-center">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="font-display font-extrabold text-2xl text-ink">Order not found</h1>
        <p className="text-mute mt-2">We couldn’t find an order with that number.</p>
        <Link href="/account" className="inline-flex mt-6 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-6 py-3 transition">
          Back to my orders
        </Link>
      </div>
    );
  }

  const totalQty = order.items.reduce((a, it) => a + it.qty, 0);
  // newest order is "in transit", older ones "delivered" — mirrors the account list
  const status =
    index === 0
      ? { label: "In transit 🚚", cls: "bg-green-100 text-green-700" }
      : { label: "Delivered ✓", cls: "bg-cloud text-ink-soft" };

  return (
    <div className="mx-auto max-w-[760px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "My Account", href: "/account" }, { label: `Order #${order.id}` }]} />

      <div className="mt-4 rounded-3xl bg-white ring-1 ring-line overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-line">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-mute text-sm">Order number</p>
              <h1 className="font-display font-extrabold text-2xl text-ink">#{order.id}</h1>
              <p className="text-mute text-sm mt-1" suppressHydrationWarning>Placed {order.date}</p>
            </div>
            <span className={`rounded-full text-xs font-semibold px-3 py-1 ${status.cls}`}>
              {status.label}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <h2 className="font-display font-bold text-ink mb-3">
            Items ({totalQty})
          </h2>
          <div className="divide-y divide-line">
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-cloud text-lg shrink-0">📦</span>
                  <div className="min-w-0">
                    <p className="font-medium text-ink truncate">{it.name}</p>
                    <p className="text-xs text-mute">Qty {it.qty} · {formatNaira(it.price)} each</p>
                  </div>
                </div>
                <span className="font-semibold text-ink whitespace-nowrap">{formatNaira(it.price * it.qty)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between border-t border-line mt-2 pt-4">
            <span className="font-bold text-ink">Total paid</span>
            <span className="font-display font-extrabold text-xl text-ink">{formatNaira(order.total)}</span>
          </div>

          <div className="mt-6 rounded-xl bg-cloud p-4 text-sm">
            <p className="text-mute">Delivering to</p>
            <p className="font-medium text-ink">{order.name} · {order.address}</p>
            <p className="text-green-600 font-semibold mt-2">🚚 Estimated delivery: 2–4 business days</p>
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
