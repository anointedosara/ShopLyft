"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/data";
import ProductCard from "./ProductCard";
import { BoltIcon, ChevronLeft, ChevronRight } from "./icons";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export default function FlashSales({ products }: { products: Product[] }) {
  const rail = useRef<HTMLDivElement>(null);
  // Countdown — fixed 48h window from first client render (avoids SSR mismatch)
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const end = Date.now() + 48 * 60 * 60 * 1000;
    const tick = () => setRemaining(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const h = remaining != null ? Math.floor(remaining / 3_600_000) : 0;
  const m = remaining != null ? Math.floor((remaining % 3_600_000) / 60_000) : 0;
  const s = remaining != null ? Math.floor((remaining % 60_000) / 1000) : 0;

  const scroll = (dir: 1 | -1) => {
    rail.current?.scrollBy({ left: dir * (rail.current.clientWidth * 0.85), behavior: "smooth" });
  };

  return (
    <section id="deals" className="mx-auto max-w-[1280px] px-3 sm:px-5 py-4">
      <div className="rounded-3xl bg-gradient-to-br from-ink to-ink-soft p-4 sm:p-6 shadow-[var(--shadow-card)]">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-11 h-11 rounded-2xl bg-brand text-white shadow-[var(--shadow-pop)] animate-[float_6s_ease-in-out_infinite]">
              <BoltIcon width={22} height={22} />
            </span>
            <div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white">Flash Sales</h2>
              <p className="text-white/55 text-xs sm:text-sm">Live deals — grab them before they&apos;re gone</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-white" suppressHydrationWarning>
              <span className="text-xs text-white/60 mr-1 hidden sm:inline">Ends in</span>
              {[h, m, s].map((unit, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="grid place-items-center min-w-9 h-9 px-2 rounded-lg bg-white/10 ring-1 ring-white/15 font-mono font-bold tabular-nums">
                    {pad(unit)}
                  </span>
                  {i < 2 && <span className="text-brand font-bold">:</span>}
                </span>
              ))}
            </div>
            <div className="hidden sm:flex gap-2">
              <button onClick={() => scroll(-1)} aria-label="Scroll left" className="grid place-items-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
                <ChevronLeft width={18} height={18} />
              </button>
              <button onClick={() => scroll(1)} aria-label="Scroll right" className="grid place-items-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
                <ChevronRight width={18} height={18} />
              </button>
            </div>
          </div>
        </div>

        {/* rail */}
        <div ref={rail} className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x scroll-pl-1 pb-1">
          {products.map((p) => (
            <div key={p.id} className="snap-start shrink-0 w-[80%] sm:w-[230px]">
              <ProductCard product={p} flash />
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/deals"
            className="inline-flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-6 py-2.5 transition active:scale-[0.98]"
          >
            See all flash deals <ChevronRight width={16} height={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
