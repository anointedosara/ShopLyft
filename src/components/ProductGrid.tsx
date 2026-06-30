import type { Product } from "@/lib/data";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl bg-white ring-1 ring-line p-12 text-center">
        <p className="text-5xl mb-3">🔍</p>
        <p className="font-display font-bold text-lg text-ink">No products found</p>
        <p className="text-mute text-sm mt-1">Try a different search or browse our categories.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
