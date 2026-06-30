import Image from "next/image";
import { notFound } from "next/navigation";
import { getCategory, getProductsByCategory } from "@/lib/catalog";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductBrowser from "@/components/ProductBrowser";

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await getCategory(id);
  if (!category) notFound();

  const products = await getProductsByCategory(id);

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: category.name }]} />

      <div className="mt-4 rounded-3xl bg-gradient-to-br from-ink to-ink-soft text-white p-6 sm:p-8 flex items-center gap-4">
        <span className="relative grid place-items-center w-16 h-16 rounded-2xl overflow-hidden bg-white/10 text-4xl ring-1 ring-white/15">
          {category.image ? (
            <Image src={category.image} alt={category.name} fill sizes="64px" className="object-cover" />
          ) : (
            category.glyph
          )}
        </span>
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">{category.name}</h1>
          <p className="text-white/80 text-sm mt-1">{products.length} products available · best prices on ShopLyft</p>
        </div>
      </div>

      <div className="mt-6">
        <ProductBrowser products={products} />
      </div>
    </div>
  );
}
