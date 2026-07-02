import { getFlashSales } from "@/lib/catalog";
import { discountPct } from "@/lib/data";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductBrowser from "@/components/ProductBrowser";
import FlashCountdown from "@/components/FlashCountdown";
import { BoltIcon } from "@/components/icons";

export const metadata = { title: "Flash Sales — ShopLyft" };

// Catalog is DB-backed and editable, so render fresh on each request.
export const dynamic = "force-dynamic";

export default async function FlashSalesPage() {
  const products = await getFlashSales();

  // Headline stats for the hero.
  const topDiscount = products.reduce(
    (max, p) => Math.max(max, discountPct(p.price, p.oldPrice)),
    0
  );
  const endingSoon = products.filter((p) => p.stockLeft != null && p.stockLeft <= 8).length;

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Flash Sales" }]} />

      {/* Hero */}
      <div className="mt-4 rounded-3xl bg-gradient-to-br from-ink to-ink-soft text-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="grid place-items-center w-16 h-16 rounded-2xl bg-brand text-white shadow-[var(--shadow-pop)] animate-[float_6s_ease-in-out_infinite]">
              <BoltIcon width={30} height={30} />
            </span>
            <div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl">Flash Sales</h1>
              <p className="text-white/70 text-sm mt-1">
                Live deals at their lowest — grab them before they&apos;re gone.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1">
            <span className="text-xs text-white/50 uppercase tracking-wide">Sale ends in</span>
            <FlashCountdown size="lg" />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "Deals live now", value: products.length },
            { label: "Up to", value: `${topDiscount}% off` },
            { label: "Almost gone", value: endingSoon },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/10 ring-1 ring-white/15 px-4 py-3">
              <p className="font-display font-extrabold text-xl sm:text-2xl">{s.value}</p>
              <p className="text-white/60 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* All flash sale products, filterable + sortable */}
      <div className="mt-6">
        {products.length > 0 ? (
          <ProductBrowser products={products} />
        ) : (
          <div className="rounded-3xl bg-white ring-1 ring-line p-10 text-center">
            <span className="grid place-items-center w-14 h-14 mx-auto rounded-2xl bg-brand-50 text-brand">
              <BoltIcon width={26} height={26} />
            </span>
            <h2 className="mt-4 font-display font-bold text-lg text-ink">No flash sales right now</h2>
            <p className="text-mute text-sm mt-1">Check back soon — new deals drop every day.</p>
          </div>
        )}
      </div>
    </div>
  );
}
