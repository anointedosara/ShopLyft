"use client";

import Link from "next/link";
import Image from "next/image";
import { type Product, formatNaira, discountPct } from "@/lib/data";
import { useStore } from "@/context/StoreProvider";
import { StarIcon, HeartIcon, CartIcon } from "./icons";

export default function ProductCard({ product, flash = false }: { product: Product; flash?: boolean }) {
  const { addToCart, toggleWishlist, isWishlisted, hydrated } = useStore();
  const pct = discountPct(product.price, product.oldPrice);
  const saved = hydrated && isWishlisted(product.id);
  const soldOut = product.stockLeft != null && product.stockLeft <= 0;
  const sold =
    product.stockLeft != null && product.stockTotal
      ? Math.round(((product.stockTotal - product.stockLeft) / product.stockTotal) * 100)
      : null;

  return (
    <article className="group relative flex flex-col max-w-[150px] sm:max-w-none bg-white rounded-2xl overflow-hidden ring-1 ring-line hover:ring-brand-200 hover:shadow-[var(--shadow-card)] transition-all duration-300">
      <Link href={`/product/${product.id}`} className="block">
        <div className={`relative aspect-square overflow-hidden bg-gradient-to-br ${product.gradient}`}>
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 44vw, 230px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-6xl sm:text-7xl drop-shadow-md transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
              {product.glyph}
            </span>
          )}
          {pct > 0 && (
            <span className="absolute top-2 left-2 rounded-md bg-ink/85 text-white text-xs font-bold px-2 py-1">
              -{pct}%
            </span>
          )}
          {product.badge && !soldOut && (
            <span className="absolute bottom-2 left-2 rounded-md bg-white/90 text-ink text-[10px] font-bold px-2 py-1 backdrop-blur">
              {product.badge}
            </span>
          )}
          {soldOut && (
            <span className="absolute inset-0 grid place-items-center bg-white/60 backdrop-blur-[1px]">
              <span className="rounded-md bg-ink/85 text-white text-xs font-bold px-3 py-1.5">Sold out</span>
            </span>
          )}
        </div>
      </Link>

      <button
        aria-label={saved ? "Remove from saved" : "Save item"}
        onClick={() => toggleWishlist(product)}
        className={`absolute top-2 right-2 z-10 grid place-items-center w-9 h-9 rounded-full shadow transition ${
          saved ? "bg-brand text-white" : "bg-white/90 text-ink hover:text-brand"
        }`}
      >
        <HeartIcon width={18} height={18} />
      </button>

      <div className="flex flex-col flex-1 p-3">
        <Link href={`/product/${product.id}`} className="block">
          <h3 className="text-sm text-ink-soft line-clamp-2 min-h-[2.5rem] hover:text-brand transition">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:justify-start sm:items-center gap-x-2">
          <span className="font-display font-bold text-base text-ink whitespace-nowrap">{formatNaira(product.price)}</span>
          {product.oldPrice && (
            <span className="text-xs text-mute line-through whitespace-nowrap">{formatNaira(product.oldPrice)}</span>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-1 text-xs text-mute">
          <span className="flex items-center gap-0.5 text-gold">
            <StarIcon width={13} height={13} />
            <span className="text-ink font-semibold">{product.rating.toFixed(1)}</span>
          </span>
          <span>({product.reviews.toLocaleString()})</span>
        </div>

        {flash && sold != null && (
          <div className="mt-2.5">
            <div className="h-2 rounded-full bg-brand-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-gold"
                style={{ width: `${Math.max(sold, 8)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] font-semibold text-brand-700">
              {product.stockLeft! <= 8 ? `Only ${product.stockLeft} left!` : `${sold}% sold`}
            </p>
          </div>
        )}

        {soldOut ? (
          <button
            disabled
            className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-cloud text-mute font-semibold text-sm py-2 cursor-not-allowed"
          >
            Sold out
          </button>
        ) : (
          <button
            onClick={() => addToCart(product)}
            className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-brand-50 text-brand-700 font-semibold text-sm py-2 hover:bg-brand hover:text-white transition active:scale-[0.98]"
          >
            <CartIcon width={16} height={16} /> Add to cart
          </button>
        )}
      </div>
    </article>
  );
}
