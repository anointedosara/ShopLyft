import Link from "next/link";
import { getApprovedStores } from "@/lib/stores";
import Breadcrumbs from "@/components/Breadcrumbs";
import { StoreIcon, ChevronRight } from "@/components/icons";

export const metadata = {
  title: "Sellers — ShopLyft",
  description: "Browse the sellers and stores on the ShopLyft marketplace.",
};

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const stores = await getApprovedStores();

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Sellers" }]} />
      <div className="mt-4 mb-6">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">Sellers on ShopLyft</h1>
        <p className="text-mute text-sm mt-1">
          {stores.length} store{stores.length !== 1 ? "s" : ""} currently selling on the marketplace.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((s) => (
          <Link
            key={s.id}
            href={`/store/${s.slug}`}
            className="group flex flex-col rounded-2xl bg-white ring-1 ring-line p-5 hover:ring-brand-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="grid place-items-center w-12 h-12 rounded-xl bg-brand-50 text-brand shrink-0">
                <StoreIcon width={24} height={24} />
              </span>
              <div className="min-w-0">
                <p className="font-display font-bold text-ink truncate">{s.name}</p>
                <p className="text-xs text-mute">{s._count.products} product{s._count.products !== 1 ? "s" : ""}</p>
              </div>
            </div>
            {s.description && (
              <p className="text-sm text-ink-soft mt-3 line-clamp-2">{s.description}</p>
            )}
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand group-hover:gap-1.5 transition-all">
              Visit store <ChevronRight width={15} height={15} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
