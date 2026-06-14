"use client";

import { useMemo, useState } from "react";
import { type EnrichedProduct, discountPct } from "@/lib/data";
import ProductGrid from "./ProductGrid";

type SortKey = "popular" | "priceAsc" | "priceDesc" | "discount" | "rating";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "popular", label: "Most popular" },
  { key: "priceAsc", label: "Price: Low to High" },
  { key: "priceDesc", label: "Price: High to Low" },
  { key: "discount", label: "Biggest discount" },
  { key: "rating", label: "Top rated" },
];

const priceBuckets = [
  { label: "Under ₦10,000", min: 0, max: 10000 },
  { label: "₦10,000 – ₦50,000", min: 10000, max: 50000 },
  { label: "₦50,000 – ₦150,000", min: 50000, max: 150000 },
  { label: "Over ₦150,000", min: 150000, max: Infinity },
];

export default function ProductBrowser({ products }: { products: EnrichedProduct[] }) {
  const [sort, setSort] = useState<SortKey>("popular");
  const [brands, setBrands] = useState<string[]>([]);
  const [bucket, setBucket] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const allBrands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).sort(),
    [products]
  );

  const result = useMemo(() => {
    let list = [...products];
    if (brands.length) list = list.filter((p) => brands.includes(p.brand));
    if (bucket != null) {
      const b = priceBuckets[bucket];
      list = list.filter((p) => p.price >= b.min && p.price < b.max);
    }
    switch (sort) {
      case "priceAsc": list.sort((a, b) => a.price - b.price); break;
      case "priceDesc": list.sort((a, b) => b.price - a.price); break;
      case "discount": list.sort((a, b) => discountPct(b.price, b.oldPrice) - discountPct(a.price, a.oldPrice)); break;
      case "rating": list.sort((a, b) => b.rating - a.rating); break;
      default: list.sort((a, b) => b.reviews - a.reviews);
    }
    return list;
  }, [products, brands, bucket, sort]);

  const toggleBrand = (b: string) =>
    setBrands((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  const clearAll = () => { setBrands([]); setBucket(null); };

  const Filters = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-ink">Filters</h3>
          {(brands.length > 0 || bucket != null) && (
            <button onClick={clearAll} className="text-xs font-semibold text-brand hover:underline">Clear</button>
          )}
        </div>
        <p className="text-xs uppercase tracking-wide text-mute font-semibold mb-2">Price</p>
        <div className="space-y-1.5">
          {priceBuckets.map((b, i) => (
            <label key={i} className="flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
              <input
                type="radio"
                name="price"
                checked={bucket === i}
                onChange={() => setBucket(bucket === i ? null : i)}
                className="accent-brand"
              />
              {b.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-mute font-semibold mb-2">Brand</p>
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {allBrands.map((b) => (
            <label key={b} className="flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
              <input type="checkbox" checked={brands.includes(b)} onChange={() => toggleBrand(b)} className="accent-brand" />
              {b}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-5">
      {/* sidebar (desktop) */}
      <aside className="hidden lg:block">
        <div className="sticky top-28 rounded-2xl bg-white ring-1 ring-line p-5">{Filters}</div>
      </aside>

      <div>
        {/* toolbar */}
        <div className="flex items-center justify-between gap-3 mb-4 rounded-2xl bg-white ring-1 ring-line px-4 py-3">
          <p className="text-sm text-mute">
            <span className="font-bold text-ink">{result.length}</span> product{result.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="lg:hidden rounded-lg bg-cloud px-3 py-2 text-sm font-semibold text-ink"
            >
              Filters
            </button>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-mute hidden sm:inline">Sort by</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg bg-cloud px-3 py-2 text-sm font-medium text-ink outline-none ring-1 ring-line focus:ring-brand"
              >
                {sortOptions.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* mobile filters */}
        {showFilters && (
          <div className="lg:hidden mb-4 rounded-2xl bg-white ring-1 ring-line p-5">{Filters}</div>
        )}

        <ProductGrid products={result} />
      </div>
    </div>
  );
}
