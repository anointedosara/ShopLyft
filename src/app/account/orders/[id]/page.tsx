import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/orders";
import { formatNaira } from "@/lib/data";
import Breadcrumbs from "@/components/Breadcrumbs";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { PackageIcon, TruckIcon } from "@/components/icons";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const totalQty = order.items.reduce((a, it) => a + it.qty, 0);
  const shortId = order.id.slice(-8).toUpperCase();
  const date = new Date(order.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="mx-auto max-w-[760px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "My Account", href: "/account" }, { label: `Order #${shortId}` }]} />

      <div className="mt-4 rounded-3xl bg-white ring-1 ring-line overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-line">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-mute text-sm">Order number</p>
              <h1 className="font-display font-extrabold text-2xl text-ink">#{shortId}</h1>
              <p className="text-mute text-sm mt-1">Placed {date}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <h2 className="font-display font-bold text-ink mb-3">
            Items ({totalQty})
          </h2>
          <div className="divide-y divide-line">
            {order.items.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-cloud text-mute shrink-0">
                    <PackageIcon width={18} height={18} />
                  </span>
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
            <span className="font-bold text-ink">Order total</span>
            <span className="font-display font-extrabold text-xl text-ink">{formatNaira(order.total)}</span>
          </div>

          <div className="mt-6 rounded-xl bg-cloud p-4 text-sm">
            <p className="text-mute">Delivering to</p>
            <p className="font-medium text-ink">{order.name} · {order.address}</p>
            <p className="flex items-center gap-1.5 text-emerald-600 font-semibold mt-2">
              <TruckIcon width={16} height={16} /> Estimated delivery: 2–4 business days
            </p>
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
