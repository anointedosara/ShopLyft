import { notFound } from "next/navigation";
import { categories, categoryName, productsByCategory } from "@/lib/data";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductBrowser from "@/components/ProductBrowser";

export function generateStaticParams() {
  return categories.map((c) => ({ id: c.id }));
}

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  const products = productsByCategory(id);

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: category.name }]} />

      <div className={`mt-4 rounded-3xl bg-gradient-to-br ${category.gradient} text-white p-6 sm:p-8 flex items-center gap-4`}>
        <span className="grid place-items-center w-16 h-16 rounded-2xl bg-white/20 text-4xl backdrop-blur">
          {category.glyph}
        </span>
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">{categoryName(id)}</h1>
          <p className="text-white/80 text-sm mt-1">{products.length} products available · best prices on ShopLyft</p>
        </div>
      </div>

      <div className="mt-6">
        <ProductBrowser products={products} />
      </div>
    </div>
  );
}
