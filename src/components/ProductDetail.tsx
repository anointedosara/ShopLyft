"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type EnrichedProduct, formatNaira, discountPct } from "@/lib/data";
import { useStore } from "@/context/StoreProvider";
import { StarIcon, HeartIcon, CartIcon, TruckIcon, ReturnIcon, ShieldIcon } from "./icons";

export default function ProductDetail({ product }: { product: EnrichedProduct }) {
  const { addToCart, toggleWishlist, isWishlisted, hydrated } = useStore();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [activeThumb, setActiveThumb] = useState(0);

  const pct = discountPct(product.price, product.oldPrice);
  const saved = hydrated && isWishlisted(product.id);
  const saving = product.oldPrice ? product.oldPrice - product.price : 0;
  const thumbs = ["scale-100", "-rotate-12 scale-90", "rotate-12 scale-95", "scale-110"];

  const buyNow = () => {
    addToCart(product.id, qty);
    router.push("/checkout");
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
      {/* gallery */}
      <div className="lg:sticky lg:top-28 self-start">
        <div className={`relative aspect-square rounded-3xl bg-gradient-to-br ${product.gradient} grid place-items-center overflow-hidden ring-1 ring-line`}>
          <span className={`text-[8rem] sm:text-[11rem] drop-shadow-xl transition-transform duration-500 ${thumbs[activeThumb]}`}>
            {product.glyph}
          </span>
          {pct > 0 && (
            <span className="absolute top-4 left-4 rounded-lg bg-ink text-white text-sm font-bold px-3 py-1.5">
              -{pct}% OFF
            </span>
          )}
        </div>
        <div className="mt-3 flex gap-3">
          {thumbs.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveThumb(i)}
              className={`grid place-items-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${product.gradient} ring-2 transition ${
                activeThumb === i ? "ring-brand" : "ring-transparent hover:ring-brand-200"
              }`}
            >
              <span className={`text-3xl ${t}`}>{product.glyph}</span>
            </button>
          ))}
        </div>
      </div>

      {/* info */}
      <div>
        <p className="text-sm text-brand font-semibold">{product.brand}</p>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink mt-1 leading-tight">
          {product.name}
        </h1>

        <div className="mt-3 flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-brand-700 font-semibold">
            <StarIcon width={14} height={14} /> {product.rating.toFixed(1)}
          </span>
          <span className="text-mute">{product.reviews.toLocaleString()} verified ratings</span>
        </div>

        <div className="mt-5 flex flex-wrap items-baseline gap-3">
          <span className="font-display font-extrabold text-3xl text-ink">{formatNaira(product.price)}</span>
          {product.oldPrice && (
            <span className="text-lg text-mute line-through">{formatNaira(product.oldPrice)}</span>
          )}
          {pct > 0 && (
            <span className="rounded-md bg-brand text-white text-xs font-bold px-2 py-1">-{pct}%</span>
          )}
        </div>
        {saving > 0 && (
          <p className="mt-1 text-sm text-green-600 font-semibold">You save {formatNaira(saving)}</p>
        )}

        {product.stockLeft != null && (
          <p className="mt-2 text-sm font-semibold text-brand-700">
            🔥 Selling fast — only {product.stockLeft} left in stock
          </p>
        )}

        {/* qty + actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-xl ring-1 ring-line bg-white overflow-hidden">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-3 text-lg font-bold text-ink hover:bg-cloud" aria-label="Decrease quantity">−</button>
            <span className="w-10 text-center font-bold tabular-nums">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="px-4 py-3 text-lg font-bold text-ink hover:bg-cloud" aria-label="Increase quantity">+</button>
          </div>
          <button
            onClick={() => toggleWishlist(product.id)}
            aria-label="Toggle wishlist"
            className={`grid place-items-center w-12 h-12 rounded-xl ring-1 transition ${
              saved ? "bg-brand text-white ring-brand" : "bg-white text-ink ring-line hover:text-brand"
            }`}
          >
            <HeartIcon />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => addToCart(product.id, qty)}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold py-3.5 transition active:scale-[0.98] shadow-[var(--shadow-pop)]"
          >
            <CartIcon width={18} height={18} /> Add to cart
          </button>
          <button
            onClick={buyNow}
            className="flex items-center justify-center gap-2 rounded-xl bg-ink hover:bg-ink-soft text-white font-semibold py-3.5 transition active:scale-[0.98]"
          >
            Buy now
          </button>
        </div>

        {/* trust cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: <TruckIcon width={20} height={20} />, t: "Fast delivery", s: "Same-day in major cities" },
            { icon: <ReturnIcon width={20} height={20} />, t: "Easy returns", s: "7-day free returns" },
            { icon: <ShieldIcon width={20} height={20} />, t: "Buyer protection", s: "Secure payment" },
          ].map((c) => (
            <div key={c.t} className="flex items-center gap-3 rounded-xl bg-white ring-1 ring-line p-3">
              <span className="text-brand">{c.icon}</span>
              <div>
                <p className="text-sm font-semibold text-ink leading-tight">{c.t}</p>
                <p className="text-xs text-mute leading-tight">{c.s}</p>
              </div>
            </div>
          ))}
        </div>

        {/* highlights */}
        <div className="mt-6 rounded-2xl bg-white ring-1 ring-line p-5">
          <h2 className="font-display font-bold text-ink mb-3">Key highlights</h2>
          <ul className="space-y-2">
            {product.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-sm text-ink-soft">
                <span className="mt-0.5 text-brand">✓</span> {h}
              </li>
            ))}
          </ul>
        </div>

        {/* description */}
        <div className="mt-4 rounded-2xl bg-white ring-1 ring-line p-5">
          <h2 className="font-display font-bold text-ink mb-2">Description</h2>
          <p className="text-sm text-ink-soft leading-relaxed">{product.description}</p>
        </div>

        {/* specs */}
        <div className="mt-4 rounded-2xl bg-white ring-1 ring-line p-5">
          <h2 className="font-display font-bold text-ink mb-3">Specifications</h2>
          <dl className="divide-y divide-line">
            {product.specs.map((s) => (
              <div key={s.label} className="flex justify-between py-2.5 text-sm">
                <dt className="text-mute">{s.label}</dt>
                <dd className="font-medium text-ink text-right">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
