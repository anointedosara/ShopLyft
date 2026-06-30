"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreProvider";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductGrid from "@/components/ProductGrid";
import { HeartIcon } from "@/components/icons";

export default function WishlistPage() {
  const { wishlistProducts, hydrated } = useStore();

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Saved items" }]} />
      <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink mt-4 mb-5">
        Saved items {hydrated && wishlistProducts.length > 0 && (
          <span className="text-mute font-medium text-lg">({wishlistProducts.length})</span>
        )}
      </h1>

      {hydrated && wishlistProducts.length === 0 ? (
        <div className="rounded-3xl bg-white ring-1 ring-line p-12 text-center">
          <span className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-cloud text-mute mb-4">
            <HeartIcon width={28} height={28} />
          </span>
          <h2 className="font-display font-extrabold text-xl text-ink">No saved items yet</h2>
          <p className="text-mute mt-2">Tap the heart on any product to save it for later.</p>
          <Link href="/deals" className="inline-flex mt-6 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-6 py-3 transition">
            Discover products
          </Link>
        </div>
      ) : (
        <ProductGrid products={wishlistProducts} />
      )}
    </div>
  );
}
