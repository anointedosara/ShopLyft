import Link from "next/link";
import Image from "next/image";
import type { ProductStatus } from "@prisma/client";
import { listModerationProducts, getProductStatusCounts } from "@/lib/product-moderation";
import { formatNaira } from "@/lib/data";
import ProductStatusBadge from "@/components/admin/ProductStatusBadge";
import ProductModerationActions from "@/components/admin/ProductModerationActions";
import { PackageIcon } from "@/components/icons";

const TABS: { key: string; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "PUBLISHED", label: "Live" },
  { key: "REJECTED", label: "Declined" },
  { key: "TAKEN_DOWN", label: "Taken down" },
  { key: "all", label: "All" },
];
const VALID = new Set(TABS.map((t) => t.key));

export const metadata = { title: "Product moderation — ShopLyft" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = (status && VALID.has(status) ? status : "PENDING") as ProductStatus | "all";

  const [rows, counts] = await Promise.all([listModerationProducts(filter), getProductStatusCounts()]);
  const tabCounts: Record<string, number> = {
    ...counts,
    all: Object.values(counts).reduce((a, b) => a + b, 0),
  };

  return (
    <div className="mx-auto max-w-[1100px] px-3 sm:px-5 py-6 sm:py-8">
      <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">Product moderation</h1>
      <p className="text-mute text-sm mt-1">
        New sellers&apos; first listings wait here for approval. Once a store has {`≥3`} live products, its listings go live automatically.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const isActive = t.key === filter;
          const count = tabCounts[t.key];
          return (
            <Link
              key={t.key}
              href={`/admin/products?status=${t.key}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                isActive ? "bg-ink text-white" : "bg-white ring-1 ring-line text-ink-soft hover:bg-cloud"
              }`}
            >
              {t.label}
              {count != null && count > 0 && (
                <span className={`text-xs ${isActive ? "text-white/70" : "text-mute"}`}>{count}</span>
              )}
            </Link>
          );
        })}
      </div>

      {rows.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {rows.map((p) => (
            <li
              key={p.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl bg-white ring-1 ring-line p-4 sm:p-5"
            >
              <span className="relative grid place-items-center w-16 h-16 rounded-xl overflow-hidden bg-cloud text-mute shrink-0">
                {p.image ? (
                  <Image src={p.image} alt={p.name} fill sizes="64px" className="object-cover" />
                ) : (
                  <PackageIcon width={22} height={22} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/product/${p.id}`} className="font-display font-bold text-ink truncate hover:text-brand transition">
                    {p.name}
                  </Link>
                  <ProductStatusBadge status={p.status} />
                </div>
                <p className="text-sm text-mute truncate mt-0.5">
                  {p.category.name} · {formatNaira(p.price)}
                  {p.oldPrice ? ` (was ${formatNaira(p.oldPrice)})` : ""}
                </p>
                <p className="text-xs text-mute truncate mt-0.5">
                  <Link href={`/store/${p.store.slug}`} className="hover:text-brand transition">{p.store.name}</Link>
                  {p.store.owner?.email ? ` · ${p.store.owner.email}` : ""}
                </p>
                {p.moderationNote && (status === "REJECTED" || status === "TAKEN_DOWN") && (
                  <p className="text-xs text-red-600 mt-1">Reason: {p.moderationNote}</p>
                )}
              </div>
              <div className="shrink-0">
                <ProductModerationActions productId={p.id} status={p.status} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 text-center rounded-2xl bg-white ring-1 ring-line py-14">
          <span className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-cloud text-mute">
            <PackageIcon width={24} height={24} />
          </span>
          <p className="text-mute text-sm mt-3">
            {filter === "PENDING" ? "Nothing waiting for review. 🎉" : "No products in this view."}
          </p>
        </div>
      )}
    </div>
  );
}
