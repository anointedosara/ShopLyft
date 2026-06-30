import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/orders";
import { getStoreByOwner } from "@/lib/stores";
import { getProductsByStore } from "@/lib/catalog";
import { getSellerStats } from "@/lib/seller-orders";
import { getVerificationForUser } from "@/lib/kyc";
import { formatNaira } from "@/lib/data";
import Breadcrumbs from "@/components/Breadcrumbs";
import SellerStatusBadge from "@/components/admin/SellerStatusBadge";
import { StoreIcon, PackageIcon, ChevronRight, WalletIcon, ChartIcon, TruckIcon, AlertIcon } from "@/components/icons";

export const metadata = { title: "Seller Dashboard — ShopLyft" };

export default async function SellerDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const store = await getStoreByOwner(user.id);
  if (!store) redirect("/sell");

  const [products, stats, verification] = await Promise.all([
    getProductsByStore(store.id),
    getSellerStats(store.id),
    getVerificationForUser(user.id),
  ]);
  const status = verification?.status ?? (store.approved ? "APPROVED" : "DRAFT");
  const approved = status === "APPROVED";
  const notStarted = !verification || (verification.completedSteps.length === 0 && status === "DRAFT");

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Seller Dashboard" }]} />

      {/* store header */}
      <div className="mt-4 rounded-3xl bg-gradient-to-br from-ink to-ink-soft text-white p-6 sm:p-8 flex flex-wrap items-center gap-4">
        <span className="grid place-items-center w-16 h-16 rounded-2xl bg-white/10 ring-1 ring-white/15">
          <StoreIcon width={30} height={30} />
        </span>
        <div className="min-w-0">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">{store.name}</h1>
          <p className="text-white/60 text-sm mt-0.5">/store/{store.slug}</p>
          <Link href="/seller/store" className="inline-block mt-2 text-sm font-semibold text-white/90 underline-offset-2 hover:underline">
            Edit store profile
          </Link>
        </div>
        <span className="ml-auto"><SellerStatusBadge status={status} /></span>
      </div>

      {/* status-aware guidance */}
      {status === "DRAFT" && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 text-amber-800 text-sm px-4 py-3">
          <AlertIcon width={18} height={18} className="shrink-0" />
          <span className="flex-1">
            {notStarted
              ? "Verify your identity and business to start selling."
              : "Finish your verification to start selling."}
          </span>
          <Link href="/seller/verification" className="rounded-lg bg-brand hover:bg-brand-600 text-white font-semibold px-4 py-2 transition">
            {notStarted ? "Start verification" : "Continue verification"}
          </Link>
        </div>
      )}
      {status === "REJECTED" && (
        <div className="mt-3 flex flex-wrap items-start gap-3 rounded-xl bg-red-50 text-red-800 text-sm px-4 py-3">
          <AlertIcon width={18} height={18} className="shrink-0 mt-0.5" />
          <span className="flex-1">
            <b>Application declined.</b>{" "}
            {verification?.rejectionReason ?? "Please review your details and resubmit."}
          </span>
          <Link href="/seller/verification" className="rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 transition">
            Update &amp; resubmit
          </Link>
        </div>
      )}
      {verification?.requestedInfo && status !== "APPROVED" && (
        <p className="mt-3 flex gap-2 rounded-xl bg-blue-50 text-blue-800 text-sm px-4 py-3">
          <AlertIcon width={18} height={18} className="shrink-0 mt-0.5" />
          <span><b>More info needed:</b> {verification.requestedInfo}</span>
        </p>
      )}
      {status === "SUSPENDED" && (
        <p className="mt-3 rounded-xl bg-orange-50 text-orange-800 text-sm px-4 py-3">
          Your store is suspended and your products are hidden from buyers. Contact support if you think this is a mistake.
        </p>
      )}
      {(status === "PENDING_REVIEW" || status === "UNDER_REVIEW") && (
        <p className="mt-3 rounded-xl bg-amber-50 text-amber-800 text-sm px-4 py-3">
          Your application is under review. You&apos;ll be able to list products once an admin approves your store —
          we&apos;ll email you as soon as it&apos;s decided.
        </p>
      )}

      {/* sales stats */}
      <section className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white ring-1 ring-line p-5">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-brand/10 text-brand"><WalletIcon width={18} height={18} /></span>
          <p className="mt-3 font-display font-extrabold text-2xl text-ink">{formatNaira(stats.revenue)}</p>
          <p className="text-mute text-sm">Revenue (paid)</p>
        </div>
        <div className="rounded-2xl bg-white ring-1 ring-line p-5">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-brand/10 text-brand"><ChartIcon width={18} height={18} /></span>
          <p className="mt-3 font-display font-extrabold text-2xl text-ink">{stats.paidOrders}</p>
          <p className="text-mute text-sm">Paid orders</p>
        </div>
        <div className="rounded-2xl bg-white ring-1 ring-line p-5">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-brand/10 text-brand"><PackageIcon width={18} height={18} /></span>
          <p className="mt-3 font-display font-extrabold text-2xl text-ink">{stats.unitsSold}</p>
          <p className="text-mute text-sm">Items sold</p>
        </div>
        <div className="rounded-2xl bg-white ring-1 ring-line p-5">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-amber-100 text-amber-600"><TruckIcon width={18} height={18} /></span>
          <p className="mt-3 font-display font-extrabold text-2xl text-ink">{stats.toFulfil}</p>
          <p className="text-mute text-sm">To fulfil</p>
        </div>
      </section>

      {/* orders */}
      <Link
        href="/seller/orders"
        className="mt-4 flex items-center gap-4 rounded-2xl bg-white ring-1 ring-line p-5 hover:ring-brand/40 transition"
      >
        <span className="grid place-items-center w-11 h-11 rounded-xl bg-cloud text-mute shrink-0">
          <PackageIcon width={20} height={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-ink">Orders</p>
          <p className="text-sm text-mute">
            {stats.toFulfil > 0 ? `${stats.toFulfil} order${stats.toFulfil === 1 ? "" : "s"} awaiting fulfillment` : "View and fulfil your orders"}
          </p>
        </div>
        {stats.toFulfil > 0 && (
          <span className="rounded-full bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1">{stats.toFulfil}</span>
        )}
        <ChevronRight width={16} height={16} className="text-mute shrink-0" />
      </Link>

      {/* products */}
      <section className="mt-6 rounded-2xl bg-white ring-1 ring-line p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-display font-bold text-ink">Your products <span className="text-mute font-normal text-sm">({products.length})</span></h2>
          {approved ? (
            <Link href="/seller/products/new" className="rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold text-sm px-4 py-2 transition">
              + Add product
            </Link>
          ) : (
            <Link href="/seller/verification" className="rounded-xl bg-cloud hover:bg-line text-ink-soft font-semibold text-sm px-4 py-2 transition">
              Verify to add products
            </Link>
          )}
        </div>

        {products.length > 0 ? (
          <ul className="divide-y divide-line">
            {products.map((p) => (
              <li key={p.id}>
                <Link href={`/seller/products/${p.id}/edit`} className="flex items-center justify-between gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-cloud transition">
                  <span className="font-medium text-ink truncate">{p.name}</span>
                  <span className="flex items-center gap-4 text-sm text-mute shrink-0">
                    <span>{p.stockLeft != null ? `${p.stockLeft} in stock` : "—"}</span>
                    <span className="font-semibold text-ink">{formatNaira(p.price)}</span>
                    <ChevronRight width={16} height={16} className="text-mute" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10">
            <span className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-cloud text-mute">
              <PackageIcon width={24} height={24} />
            </span>
            <p className="text-mute text-sm mt-3">No products yet.</p>
            {approved ? (
              <Link href="/seller/products/new" className="inline-flex mt-4 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-5 py-2.5 text-sm transition">
                Add your first product
              </Link>
            ) : (
              <Link href="/seller/verification" className="inline-flex mt-4 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-5 py-2.5 text-sm transition">
                Complete verification to list products
              </Link>
            )}
          </div>
        )}
      </section>

      <div className="mt-4">
        <Link href="/" className="text-sm font-semibold text-brand hover:underline">← Back to store</Link>
      </div>
    </div>
  );
}
