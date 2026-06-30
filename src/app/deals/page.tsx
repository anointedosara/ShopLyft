import { getDealsAndFlash } from "@/lib/catalog";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductBrowser from "@/components/ProductBrowser";
import { BoltIcon } from "@/components/icons";

export const metadata = { title: "Today's Deals — ShopLyft" };

// Catalog is DB-backed and editable, so render fresh on each request.
export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const dealsAndFlash = await getDealsAndFlash();
  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Today's Deals" }]} />

      <div className="mt-4 rounded-3xl bg-gradient-to-br from-ink to-ink-soft text-white p-6 sm:p-8 flex items-center gap-4">
        <span className="grid place-items-center w-16 h-16 rounded-2xl bg-brand text-white text-3xl shadow-[var(--shadow-pop)]">
          <BoltIcon width={30} height={30} />
        </span>
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">Today&apos;s Deals & Flash Sales</h1>
          <p className="text-white/70 text-sm mt-1">{dealsAndFlash.length} hot offers · up to 70% off, while stocks last</p>
        </div>
      </div>

      <div className="mt-6">
        <ProductBrowser products={dealsAndFlash} />
      </div>
    </div>
  );
}
