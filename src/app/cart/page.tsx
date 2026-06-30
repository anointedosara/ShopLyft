"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreProvider";
import { formatNaira } from "@/lib/data";
import { checkCartStockAction } from "@/app/actions/orders";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CartIcon } from "@/components/icons";

const DELIVERY = 1500;
const FREE_OVER = 50000;

export default function CartPage() {
  const { cartLines, subtotal, setQty, removeFromCart, clearCart, hydrated } = useStore();

  // Live stock check against the DB (the cart itself reads a static catalog).
  // Keyed by productId → how many are actually available for the flagged lines.
  const [stockIssues, setStockIssues] = useState<Record<string, number>>({});
  const cartKey = cartLines.map((l) => `${l.product.id}:${l.qty}`).join(",");

  useEffect(() => {
    if (!hydrated || cartLines.length === 0) return;
    let active = true;
    checkCartStockAction(cartLines.map((l) => ({ productId: l.product.id, qty: l.qty })))
      .then((issues) => {
        if (active) setStockIssues(Object.fromEntries(issues.map((i) => [i.productId, i.available])));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey, hydrated]);

  // Only count issues for items still in the cart (stale keys clear on next fetch).
  const hasStockBlocker = cartLines.some((l) => stockIssues[l.product.id] != null);
  const delivery = subtotal >= FREE_OVER || subtotal === 0 ? 0 : DELIVERY;
  const total = subtotal + delivery;

  if (hydrated && cartLines.length === 0) {
    return (
      <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
        <Breadcrumbs items={[{ label: "Cart" }]} />
        <div className="mt-6 rounded-3xl bg-white ring-1 ring-line p-12 text-center">
          <span className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-cloud text-mute mb-4">
            <CartIcon width={28} height={28} />
          </span>
          <h1 className="font-display font-extrabold text-2xl text-ink">Your cart is empty</h1>
          <p className="text-mute mt-2">Browse our deals and find something you love.</p>
          <Link href="/deals" className="inline-flex mt-6 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-6 py-3 transition">
            Start shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Cart" }]} />
      <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink mt-4 mb-5">
        Shopping Cart {hydrated && <span className="text-mute font-medium text-lg">({cartLines.length})</span>}
      </h1>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        {/* items */}
        <div className="space-y-3">
          {cartLines.map((l) => (
            <div key={l.product.id} className="flex gap-4 rounded-2xl bg-white ring-1 ring-line p-3 sm:p-4">
              <Link
                href={`/product/${l.product.id}`}
                className={`shrink-0 grid place-items-center w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-gradient-to-br ${l.product.gradient}`}
              >
                <span className="text-4xl sm:text-5xl">{l.product.glyph}</span>
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/product/${l.product.id}`} className="font-medium text-ink hover:text-brand line-clamp-2">
                  {l.product.name}
                </Link>
                <p className="text-xs text-mute mt-0.5">{l.product.brand}</p>
                <p className="font-display font-bold text-ink mt-1">{formatNaira(l.product.price)}</p>
                {stockIssues[l.product.id] != null && (
                  <p className={`mt-1 text-xs font-semibold ${stockIssues[l.product.id] <= 0 ? "text-red-600" : "text-amber-600"}`}>
                    {stockIssues[l.product.id] <= 0
                      ? "Sold out — remove to continue"
                      : `Only ${stockIssues[l.product.id]} left — reduce quantity`}
                  </p>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-lg ring-1 ring-line overflow-hidden">
                    <button onClick={() => setQty(l.product.id, l.qty - 1)} className="px-3 py-1.5 font-bold text-ink hover:bg-cloud" aria-label="Decrease">−</button>
                    <span className="w-9 text-center text-sm font-bold tabular-nums">{l.qty}</span>
                    <button onClick={() => setQty(l.product.id, l.qty + 1)} className="px-3 py-1.5 font-bold text-ink hover:bg-cloud" aria-label="Increase">+</button>
                  </div>
                  <button onClick={() => removeFromCart(l.product.id)} className="text-sm font-semibold text-red-500 hover:underline">
                    Remove
                  </button>
                </div>
              </div>

              <div className="hidden sm:block text-right">
                <p className="text-xs text-mute">Subtotal</p>
                <p className="font-display font-bold text-ink">{formatNaira(l.lineTotal)}</p>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-2">
            <button onClick={clearCart} className="text-sm font-semibold text-mute hover:text-red-500">Clear cart</button>
            <Link href="/deals" className="text-sm font-semibold text-brand hover:underline">+ Continue shopping</Link>
          </div>
        </div>

        {/* summary */}
        <aside className="lg:sticky lg:top-28 self-start">
          <div className="rounded-2xl bg-white ring-1 ring-line p-5">
            <h2 className="font-display font-bold text-ink mb-4">Order summary</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-mute">Subtotal</span>
                <span className="font-semibold text-ink" suppressHydrationWarning>{formatNaira(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mute">Delivery</span>
                <span className="font-semibold text-ink" suppressHydrationWarning>
                  {delivery === 0 ? <span className="text-green-600">Free</span> : formatNaira(delivery)}
                </span>
              </div>
              {subtotal > 0 && subtotal < FREE_OVER && (
                <p className="text-xs text-brand-700 bg-brand-50 rounded-lg px-3 py-2">
                  Add {formatNaira(FREE_OVER - subtotal)} more for free delivery!
                </p>
              )}
              <div className="border-t border-line pt-3 flex justify-between">
                <span className="font-bold text-ink">Total</span>
                <span className="font-display font-extrabold text-xl text-ink" suppressHydrationWarning>{formatNaira(total)}</span>
              </div>
            </div>

            {hasStockBlocker ? (
              <>
                <button
                  disabled
                  className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-cloud text-mute font-semibold py-3.5 cursor-not-allowed"
                >
                  Proceed to checkout
                </button>
                <p className="mt-3 text-center text-xs text-red-600">
                  Update the highlighted items above to continue.
                </p>
              </>
            ) : (
              <>
                <Link
                  href="/checkout"
                  className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold py-3.5 transition active:scale-[0.98] shadow-[var(--shadow-pop)]"
                >
                  <CartIcon width={18} height={18} /> Proceed to checkout
                </Link>
                <p className="mt-3 text-center text-xs text-mute">Secure checkout · easy 7-day returns</p>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
