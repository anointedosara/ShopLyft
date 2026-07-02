"use client";

import { useRef } from "react";
import Link from "next/link";
import type { Product } from "@/lib/data";
import ProductCard from "./ProductCard";
import { ChevronLeft, ChevronRight } from "./icons";

export default function ProductRail({
  title,
  subtitle,
  products,
  accent = "brand",
  href = "/deals",
}: {
  title: string;
  subtitle?: string;
  products: Product[];
  accent?: "brand" | "accent";
  href?: string;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    rail.current?.scrollBy({ left: dir * (rail.current.clientWidth * 0.85), behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-[1280px] px-3 sm:px-5 py-6 sm:py-8">
      <div className="bg-white rounded-3xl ring-1 ring-line p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <span className={`h-7 w-1.5 rounded-full ${accent === "brand" ? "bg-brand" : "bg-accent"}`} />
            <div>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-ink">{title}</h2>
              {subtitle && <p className="text-mute text-xs sm:text-sm">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={href} className="hidden sm:inline text-brand font-semibold text-sm hover:underline">See all</Link>
            <button onClick={() => scroll(-1)} aria-label="Scroll left" className="grid place-items-center w-9 h-9 rounded-full bg-cloud hover:bg-brand-50 text-ink hover:text-brand transition">
              <ChevronLeft width={18} height={18} />
            </button>
            <button onClick={() => scroll(1)} aria-label="Scroll right" className="grid place-items-center w-9 h-9 rounded-full bg-cloud hover:bg-brand-50 text-ink hover:text-brand transition">
              <ChevronRight width={18} height={18} />
            </button>
          </div>
        </div>

        <div ref={rail} className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x pb-1">
          {products.map((p) => (
            <div key={p.id} className="snap-start shrink-0 w-[80%] sm:w-[220px]">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
