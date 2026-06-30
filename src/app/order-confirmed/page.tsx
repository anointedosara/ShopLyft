import Link from "next/link";
import { getOrder, deliveryFor } from "@/lib/orders";
import { formatNaira } from "@/lib/data";
import ClearCartOnMount from "@/components/ClearCartOnMount";
import { CheckIcon, PackageIcon } from "@/components/icons";

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: id } = await searchParams;
  const order = id ? await getOrder(id) : null;

  if (!order) {
    return (
      <div className="mx-auto max-w-[640px] px-3 sm:px-5 py-16 text-center">
        <span className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-cloud text-mute mb-4">
          <PackageIcon width={28} height={28} />
        </span>
        <h1 className="font-display font-extrabold text-2xl text-ink">No recent order</h1>
        <p className="text-mute mt-2">Place an order to see your confirmation here.</p>
        <Link href="/deals" className="inline-flex mt-6 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-6 py-3 transition">
          Browse deals
        </Link>
      </div>
    );
  }

  const subtotal = order.items.reduce((a, it) => a + it.price * it.qty, 0);
  const delivery = deliveryFor(subtotal);
  const shortId = order.id.slice(-8).toUpperCase();
  const firstName = order.name.split(" ")[0];
  const date = new Date(order.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
  const isPaid = order.status === "PAID" || order.status === "FULFILLED";

  return (
    <div className="mx-auto max-w-[640px] px-3 sm:px-5 py-10 sm:py-14">
      {isPaid && <ClearCartOnMount />}
      <div className="rounded-3xl bg-white ring-1 ring-line overflow-hidden">
        <div className="bg-gradient-to-br from-brand to-brand-700 text-white p-8 text-center">
          <div className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-white text-brand mb-3">
            <CheckIcon width={30} height={30} strokeWidth={2.5} />
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">{isPaid ? "Payment successful!" : "Order placed!"}</h1>
          <p className="text-white/85 mt-1">
            {isPaid
              ? `Thank you, ${firstName} — your order is confirmed.`
              : `Thank you, ${firstName} — we've received your order.`}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap justify-between gap-3 text-sm border-b border-line pb-4">
            <div>
              <p className="text-mute">Order number</p>
              <p className="font-display font-bold text-ink">#{shortId}</p>
            </div>
            <div className="text-right">
              <p className="text-mute">Date</p>
              <p className="font-medium text-ink">{date}</p>
            </div>
          </div>

          <div className="py-4 space-y-2">
            {order.items.map((it) => (
              <div key={it.id} className="flex justify-between text-sm">
                <span className="text-ink-soft">{it.name} × {it.qty}</span>
                <span className="font-semibold text-ink">{formatNaira(it.price * it.qty)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-line pt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-mute">Subtotal</span><span className="font-semibold">{formatNaira(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-mute">Delivery</span><span className="font-semibold">{delivery === 0 ? <span className="text-green-600">Free</span> : formatNaira(delivery)}</span></div>
            <div className="flex justify-between border-t border-line pt-2">
              <span className="font-bold text-ink">Total</span>
              <span className="font-display font-extrabold text-xl text-ink">{formatNaira(order.total)}</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-cloud p-4 text-sm">
            <p className="text-mute">Delivering to</p>
            <p className="font-medium text-ink">{order.name} · {order.address}</p>
            {isPaid ? (
              <p className="text-emerald-600 font-semibold mt-2">Payment received — we&apos;re preparing your order. Delivery in 2–4 business days.</p>
            ) : (
              <p className="text-amber-600 font-semibold mt-2">Payment pending.</p>
            )}
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <Link href={`/account/orders/${order.id}`} className="rounded-xl bg-ink hover:bg-ink-soft text-white font-semibold py-3 text-center transition">
              Track my order
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
