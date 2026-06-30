import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/orders";
import { getStoreByOwner } from "@/lib/stores";
import { getSellerOrder } from "@/lib/seller-orders";
import { formatNaira } from "@/lib/data";
import Breadcrumbs from "@/components/Breadcrumbs";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import FulfillButton from "@/components/seller/FulfillButton";
import { PackageIcon, CheckIcon } from "@/components/icons";

export default async function SellerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const store = await getStoreByOwner(user.id);
  if (!store) redirect("/sell");

  const { id } = await params;
  const order = await getSellerOrder(store.id, id);
  if (!order) notFound();

  const date = new Date(order.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="mx-auto max-w-[760px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs
        items={[
          { label: "Seller Dashboard", href: "/seller" },
          { label: "Orders", href: "/seller/orders" },
          { label: `#${order.shortId}` },
        ]}
      />

      <div className="mt-4 rounded-3xl bg-white ring-1 ring-line overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-line">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-mute text-sm">Order number</p>
              <h1 className="font-display font-extrabold text-2xl text-ink">#{order.shortId}</h1>
              <p className="text-mute text-sm mt-1">Placed {date}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <h2 className="font-display font-bold text-ink mb-3">
            Your items ({order.units})
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
                <div className="flex items-center gap-3 whitespace-nowrap">
                  {it.fulfilledAt && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <CheckIcon width={14} height={14} /> Fulfilled
                    </span>
                  )}
                  <span className="font-semibold text-ink">{formatNaira(it.price * it.qty)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between border-t border-line mt-2 pt-4">
            <span className="font-bold text-ink">Your subtotal</span>
            <span className="font-display font-extrabold text-xl text-ink">{formatNaira(order.subtotal)}</span>
          </div>
          <p className="text-xs text-mute mt-1">
            Buyer&apos;s order total may be higher — it can include items from other stores plus delivery.
          </p>

          <div className="mt-6 rounded-xl bg-cloud p-4 text-sm">
            <p className="text-mute">Ship to</p>
            <p className="font-medium text-ink">{order.buyerName}</p>
            <p className="text-ink">{order.address}</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Link href="/seller/orders" className="text-sm font-semibold text-brand hover:underline">
              ← All orders
            </Link>
            <FulfillButton orderId={order.id} fulfilled={order.fulfilled} />
          </div>
        </div>
      </div>
    </div>
  );
}
