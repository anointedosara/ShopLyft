import Link from "next/link";
import { getStatusCounts, listVerifications } from "@/lib/admin";
import { getProductStatusCounts } from "@/lib/product-moderation";
import SellerStatusBadge from "@/components/admin/SellerStatusBadge";
import { ChevronRight, StoreIcon, PackageIcon } from "@/components/icons";

export default async function AdminDashboardPage() {
  const [counts, queue, productCounts] = await Promise.all([
    getStatusCounts(),
    listVerifications("queue"),
    getProductStatusCounts(),
  ]);
  const needsReview = counts.PENDING_REVIEW + counts.UNDER_REVIEW;

  const cards = [
    { label: "Needs review", value: needsReview, href: "/admin/sellers?status=queue", accent: "text-amber-600 bg-amber-50" },
    { label: "Approved", value: counts.APPROVED, href: "/admin/sellers?status=APPROVED", accent: "text-emerald-600 bg-emerald-50" },
    { label: "Rejected", value: counts.REJECTED, href: "/admin/sellers?status=REJECTED", accent: "text-red-600 bg-red-50" },
    { label: "Suspended", value: counts.SUSPENDED, href: "/admin/sellers?status=SUSPENDED", accent: "text-orange-700 bg-orange-50" },
  ];

  return (
    <div className="mx-auto max-w-[1100px] px-3 sm:px-5 py-6 sm:py-8">
      <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">Admin overview</h1>
      <p className="text-mute text-sm mt-1">Review seller applications and manage stores.</p>

      <section className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-2xl bg-white ring-1 ring-line p-5 hover:ring-brand/40 transition">
            <p className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold ${c.accent}`}>{c.label}</p>
            <p className="mt-3 font-display font-extrabold text-3xl text-ink">{c.value}</p>
          </Link>
        ))}
      </section>

      <Link
        href="/admin/products?status=PENDING"
        className="mt-4 flex items-center gap-4 rounded-2xl bg-white ring-1 ring-line p-5 hover:ring-brand/40 transition"
      >
        <span className="grid place-items-center w-11 h-11 rounded-xl bg-amber-50 text-amber-600 shrink-0">
          <PackageIcon width={20} height={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-ink">Products awaiting review</p>
          <p className="text-sm text-mute">
            {productCounts.PENDING > 0
              ? `${productCounts.PENDING} listing${productCounts.PENDING === 1 ? "" : "s"} from new sellers to approve`
              : "New sellers' first listings show up here"}
          </p>
        </div>
        {productCounts.PENDING > 0 && (
          <span className="rounded-full bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1">{productCounts.PENDING}</span>
        )}
        <ChevronRight width={16} height={16} className="text-mute shrink-0" />
      </Link>

      <section className="mt-6 rounded-2xl bg-white ring-1 ring-line p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-ink">Review queue</h2>
          <Link href="/admin/sellers" className="text-sm font-semibold text-brand hover:underline">View all</Link>
        </div>

        {queue.length > 0 ? (
          <ul className="divide-y divide-line">
            {queue.slice(0, 8).map((v) => (
              <li key={v.id}>
                <Link href={`/admin/sellers/${v.id}`} className="flex items-center gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-cloud transition">
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-cloud text-mute shrink-0">
                    <StoreIcon width={18} height={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink truncate">{v.store.name}</p>
                    <p className="text-xs text-mute truncate">{v.store.owner?.email ?? "no owner"}</p>
                  </div>
                  <SellerStatusBadge status={v.status} />
                  <ChevronRight width={16} height={16} className="text-mute shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-mute py-6 text-center">Nothing waiting for review. 🎉</p>
        )}
      </section>
    </div>
  );
}
