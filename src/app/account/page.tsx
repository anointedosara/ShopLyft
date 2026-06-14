"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreProvider";
import { formatNaira } from "@/lib/data";
import Breadcrumbs from "@/components/Breadcrumbs";
import { UserIcon, CartIcon, HeartIcon, TruckIcon, ShieldIcon, SupportIcon, ReturnIcon } from "@/components/icons";

const menu = [
  { label: "My Orders", icon: <TruckIcon />, href: "/account" },
  { label: "Saved Items", icon: <HeartIcon />, href: "/wishlist" },
  { label: "My Cart", icon: <CartIcon />, href: "/cart" },
  { label: "Returns", icon: <ReturnIcon />, href: "/account" },
  { label: "Buyer Protection", icon: <ShieldIcon />, href: "/account" },
  { label: "Help & Support", icon: <SupportIcon />, href: "/account" },
];

export default function AccountPage() {
  const { orders, wishlistProducts, cartCount, hydrated } = useStore();

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "My Account" }]} />

      <div className="mt-4 grid lg:grid-cols-[280px_1fr] gap-5">
        {/* profile card */}
        <aside className="rounded-2xl bg-white ring-1 ring-line p-6 h-fit">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-14 h-14 rounded-full bg-brand text-white">
              <UserIcon width={26} height={26} />
            </span>
            <div>
              <p className="font-display font-bold text-ink">Hi, Shopper 👋</p>
              <p className="text-xs text-mute">Welcome to ShopLyft</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 text-center divide-x divide-line">
            <div><p className="font-display font-extrabold text-ink" suppressHydrationWarning>{hydrated ? cartCount : 0}</p><p className="text-[11px] text-mute">Cart</p></div>
            <div><p className="font-display font-extrabold text-ink" suppressHydrationWarning>{hydrated ? wishlistProducts.length : 0}</p><p className="text-[11px] text-mute">Saved</p></div>
            <div><p className="font-display font-extrabold text-ink" suppressHydrationWarning>{hydrated ? orders.length : 0}</p><p className="text-[11px] text-mute">Orders</p></div>
          </div>
        </aside>

        {/* main */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {menu.map((m) => (
              <Link key={m.label} href={m.href} className="flex items-center gap-3 rounded-2xl bg-white ring-1 ring-line p-4 hover:ring-brand-200 hover:-translate-y-0.5 transition">
                <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand-50 text-brand shrink-0">{m.icon}</span>
                <span className="text-sm font-semibold text-ink">{m.label}</span>
              </Link>
            ))}
          </div>

          <section className="rounded-2xl bg-white ring-1 ring-line p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-ink">My orders</h2>
              {hydrated && orders.length > 0 && (
                <span className="text-sm text-mute">{orders.length} order{orders.length !== 1 ? "s" : ""}</span>
              )}
            </div>

            {hydrated && orders.length > 0 ? (
              <ul className="space-y-3">
                {orders.map((order, idx) => {
                  const totalQty = order.items.reduce((a, it) => a + it.qty, 0);
                  // newest order is "in transit", older ones "delivered"
                  const status =
                    idx === 0
                      ? { label: "In transit 🚚", cls: "bg-green-100 text-green-700" }
                      : { label: "Delivered ✓", cls: "bg-cloud text-ink-soft" };
                  return (
                    <li key={order.id}>
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="block rounded-xl ring-1 ring-line p-4 hover:ring-brand-200 hover:-translate-y-0.5 transition"
                      >
                        <div className="flex flex-wrap justify-between gap-2 text-sm">
                          <span className="font-bold text-ink">#{order.id}</span>
                          <span className="text-mute" suppressHydrationWarning>{order.date}</span>
                        </div>

                        <div className="mt-2 flex items-center gap-1.5">
                          {order.items.slice(0, 5).map((it, i) => (
                            <span key={i} className="text-lg" title={it.name}>📦</span>
                          ))}
                          {order.items.length > 5 && (
                            <span className="text-xs text-mute">+{order.items.length - 5}</span>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-sm text-ink-soft">
                            {totalQty} item{totalQty !== 1 ? "s" : ""} · {formatNaira(order.total)}
                          </span>
                          <span className={`rounded-full text-xs font-semibold px-3 py-1 ${status.cls}`}>
                            {status.label}
                          </span>
                        </div>

                        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                          View details →
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">🧾</p>
                <p className="text-mute text-sm">You have no orders yet.</p>
                <Link href="/deals" className="inline-flex mt-4 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-5 py-2.5 text-sm transition">
                  Start shopping
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
