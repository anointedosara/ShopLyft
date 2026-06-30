import Link from "next/link";
import { getSessionUser, getUserOrders } from "@/lib/orders";
import { getStoreByOwner } from "@/lib/stores";
import { getCurrentUser } from "@/lib/rbac";
import { formatNaira } from "@/lib/data";
import Breadcrumbs from "@/components/Breadcrumbs";
import AccountStats from "@/components/account/AccountStats";
import LogoutButton from "@/components/account/LogoutButton";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import Avatar from "@/components/Avatar";
import { UserIcon, CartIcon, HeartIcon, TruckIcon, ShieldIcon, SupportIcon, ReturnIcon, PackageIcon, ChevronRight, StoreIcon, BellIcon } from "@/components/icons";

const menu = [
  { label: "My Orders", icon: <TruckIcon />, href: "/account" },
  { label: "Notifications", icon: <BellIcon />, href: "/account/notifications" },
  { label: "Saved Items", icon: <HeartIcon />, href: "/wishlist" },
  { label: "My Cart", icon: <CartIcon />, href: "/cart" },
  { label: "Returns", icon: <ReturnIcon />, href: "/returns" },
  { label: "Buyer Protection", icon: <ShieldIcon />, href: "/help" },
  { label: "Help & Support", icon: <SupportIcon />, href: "/help" },
];

export default async function AccountPage() {
  const user = await getSessionUser();

  // Logged-out state: prompt to sign in / create an account.
  if (!user) {
    return (
      <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
        <Breadcrumbs items={[{ label: "My Account" }]} />
        <div className="mx-auto mt-6 w-full max-w-md rounded-2xl bg-white ring-1 ring-line p-8 text-center">
          <span className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-brand-50 text-brand">
            <UserIcon width={30} height={30} />
          </span>
          <h1 className="font-display font-extrabold text-xl text-ink mt-4">Sign in to your account</h1>
          <p className="text-sm text-mute mt-1">Access your orders, saved items and faster checkout.</p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/login" className="rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold py-3 transition">Sign in</Link>
            <Link href="/signup" className="rounded-xl bg-cloud hover:bg-brand-50 text-ink font-semibold py-3 transition">Create an account</Link>
          </div>
        </div>
      </div>
    );
  }

  const [orders, store, me] = await Promise.all([
    getUserOrders(),
    getStoreByOwner(user.id),
    getCurrentUser(), // resolves DB role (and promotes env-allowlisted admins)
  ]);
  const displayName = user.name?.trim() || "Shopper";

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "My Account" }]} />

      <div className="mt-4 grid lg:grid-cols-[280px_1fr] gap-5">
        {/* profile card */}
        <aside className="rounded-2xl bg-white ring-1 ring-line p-6 h-fit">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} image={user.image} size={56} />
            <div className="min-w-0">
              <p className="font-display font-bold text-ink truncate">Welcome back, {displayName}</p>
              <p className="text-xs text-mute truncate">{user.email}</p>
              <Link href="/account/profile" className="text-xs font-semibold text-brand hover:underline">
                Edit profile
              </Link>
            </div>
          </div>
          <AccountStats ordersCount={orders.length} />
          <LogoutButton />
        </aside>

        {/* main */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {me?.role === "ADMIN" && (
              <Link href="/admin" className="flex items-center gap-3 rounded-2xl bg-ink text-white p-4 hover:-translate-y-0.5 transition">
                <span className="grid place-items-center w-11 h-11 rounded-xl bg-white/10 shrink-0"><ShieldIcon /></span>
                <span className="text-sm font-semibold">Admin</span>
              </Link>
            )}
            <Link href={store ? "/seller" : "/sell"} className="flex items-center gap-3 rounded-2xl bg-white ring-1 ring-line p-4 hover:ring-brand-200 hover:-translate-y-0.5 transition">
              <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand-50 text-brand shrink-0"><StoreIcon /></span>
              <span className="text-sm font-semibold text-ink">{store ? "Seller Dashboard" : "Sell on ShopLyft"}</span>
            </Link>
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
              {orders.length > 0 && (
                <span className="text-sm text-mute">{orders.length} order{orders.length !== 1 ? "s" : ""}</span>
              )}
            </div>

            {orders.length > 0 ? (
              <ul className="space-y-3">
                {orders.map((order) => {
                  const totalQty = order.items.reduce((a, it) => a + it.qty, 0);
                  const shortId = order.id.slice(-8).toUpperCase();
                  const date = new Date(order.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" });
                  return (
                    <li key={order.id}>
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="block rounded-xl ring-1 ring-line p-4 hover:ring-brand-200 hover:-translate-y-0.5 transition"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-ink text-sm">Order #{shortId}</span>
                          <OrderStatusBadge status={order.status} />
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2 text-sm text-ink-soft">
                            <PackageIcon width={18} height={18} className="text-mute" />
                            {totalQty} item{totalQty !== 1 ? "s" : ""} · {formatNaira(order.total)}
                          </span>
                          <span className="text-xs text-mute">{date}</span>
                        </div>

                        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                          View details <ChevronRight width={15} height={15} />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center py-10">
                <span className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-cloud text-mute">
                  <PackageIcon width={24} height={24} />
                </span>
                <p className="text-mute text-sm mt-3">You have no orders yet.</p>
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
