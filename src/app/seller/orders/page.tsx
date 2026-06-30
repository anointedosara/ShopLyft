import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/orders";
import { getStoreByOwner } from "@/lib/stores";
import { getSellerOrders } from "@/lib/seller-orders";
import { formatNaira } from "@/lib/data";
import Breadcrumbs from "@/components/Breadcrumbs";
import { PackageIcon, ChevronRight } from "@/components/icons";

export const metadata = { title: "Orders — Seller — ShopLyft" };

export default async function SellerOrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const store = await getStoreByOwner(user.id);
  if (!store) redirect("/sell");

  const orders = await getSellerOrders(store.id);
  const toFulfil = orders.filter((o) => !o.fulfilled).length;

  return (
    <div className="mx-auto max-w-[960px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Seller Dashboard", href: "/seller" }, { label: "Orders" }]} />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">Orders</h1>
          <p className="text-mute text-sm mt-1">
            Paid orders containing your products{toFulfil > 0 ? ` · ${toFulfil} awaiting fulfillment` : ""}
          </p>
        </div>
      </div>

      {orders.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/seller/orders/${o.id}`}
                className="flex items-center gap-4 rounded-2xl bg-white ring-1 ring-line p-4 sm:p-5 hover:ring-brand/40 transition"
              >
                <span className="grid place-items-center w-11 h-11 rounded-xl bg-cloud text-mute shrink-0">
                  <PackageIcon width={20} height={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-display font-bold text-ink">#{o.shortId}</span>
                    {o.fulfilled ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Fulfilled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> To fulfil
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-mute mt-0.5 truncate">
                    {o.buyerName} · {o.units} item{o.units === 1 ? "" : "s"} ·{" "}
                    {new Date(o.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                  </p>
                </div>
                <span className="font-semibold text-ink whitespace-nowrap">{formatNaira(o.subtotal)}</span>
                <ChevronRight width={16} height={16} className="text-mute shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 text-center rounded-2xl bg-white ring-1 ring-line py-14">
          <span className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-cloud text-mute">
            <PackageIcon width={24} height={24} />
          </span>
          <p className="text-mute text-sm mt-3">No orders yet. Once a buyer pays for one of your products, it shows up here.</p>
          <Link href="/seller" className="inline-flex mt-4 text-sm font-semibold text-brand hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
