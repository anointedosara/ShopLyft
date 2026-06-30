import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/stores";
import { getProductsByStore } from "@/lib/catalog";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductBrowser from "@/components/ProductBrowser";
import { StoreIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  return { title: store ? `${store.name} — ShopLyft` : "Store — ShopLyft" };
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  // Public store pages only exist for approved stores.
  if (!store || !store.approved) notFound();

  const products = await getProductsByStore(store.id);

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Sellers", href: "/stores" }, { label: store.name }]} />

      <div className="mt-4 rounded-3xl bg-gradient-to-br from-ink to-ink-soft text-white p-6 sm:p-8 flex items-center gap-4">
        <span className="grid place-items-center w-16 h-16 rounded-2xl bg-white/10 ring-1 ring-white/15">
          <StoreIcon width={30} height={30} />
        </span>
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">{store.name}</h1>
          <p className="text-white/70 text-sm mt-1">
            {store.description || `${products.length} product${products.length !== 1 ? "s" : ""} available`}
          </p>
        </div>
      </div>

      <div className="mt-6">
        {products.length > 0 ? (
          <ProductBrowser products={products} />
        ) : (
          <div className="rounded-2xl bg-white ring-1 ring-line p-12 text-center text-mute text-sm">
            This store hasn&apos;t listed any products yet.
          </div>
        )}
      </div>
    </div>
  );
}
