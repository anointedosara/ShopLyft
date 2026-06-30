import { notFound } from "next/navigation";
import { categoryName } from "@/lib/data";
import { getProduct, getRelatedProducts } from "@/lib/catalog";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductDetail from "@/components/ProductDetail";
import ProductRail from "@/components/ProductRail";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProduct(id);
  return { title: p ? `${p.name} — ShopLyft` : "Product — ShopLyft" };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const related = await getRelatedProducts(product);

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs
        items={[
          { label: categoryName(product.categoryId), href: `/category/${product.categoryId}` },
          { label: product.name },
        ]}
      />
      <div className="mt-4">
        <ProductDetail product={product} />
      </div>

      {related.length > 0 && (
        <div className="-mx-3 sm:-mx-5 mt-6">
          <ProductRail
            title="You may also like"
            subtitle={`More from ${categoryName(product.categoryId)}`}
            products={related}
            href={`/category/${product.categoryId}`}
          />
        </div>
      )}
    </div>
  );
}
