"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { categories } from "@/lib/data";
import { ChevronLeft, ChevronRight } from "./icons";

export default function CategoryNav() {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  };

  // Convert vertical mouse-wheel into horizontal scroll (non-passive so we can preventDefault)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0 || e.shiftKey) return;
      if (el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scroll = (dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * Math.max(240, ref.current.clientWidth * 0.7), behavior: "smooth" });

  return (
    <div className="bg-white border-b border-line">
      <div className="relative mx-auto max-w-[1280px] px-3 sm:px-5">
        {/* left arrow + fade */}
        <button
          aria-label="Scroll categories left"
          onClick={() => scroll(-1)}
          className={`hidden sm:grid place-items-center absolute left-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white text-ink shadow-md ring-1 ring-line hover:text-brand transition ${
            atStart ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <ChevronLeft width={18} height={18} />
        </button>
        <div
          className={`pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-white to-transparent transition-opacity ${
            atStart ? "opacity-0" : "opacity-100"
          }`}
        />

        <div ref={ref} className="flex gap-2 overflow-x-auto no-scrollbar py-3 scroll-smooth">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.id}`}
              className="group flex items-center gap-2 shrink-0 rounded-full bg-cloud hover:bg-brand-50 ring-1 ring-transparent hover:ring-brand-200 px-3.5 py-2 transition"
            >
              <span className="text-base">{c.glyph}</span>
              <span className="text-sm font-medium text-ink-soft group-hover:text-brand-700 whitespace-nowrap">
                {c.name}
              </span>
            </Link>
          ))}
        </div>

        {/* right arrow + fade */}
        <div
          className={`pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-white to-transparent transition-opacity ${
            atEnd ? "opacity-0" : "opacity-100"
          }`}
        />
        <button
          aria-label="Scroll categories right"
          onClick={() => scroll(1)}
          className={`hidden sm:grid place-items-center absolute right-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white text-ink shadow-md ring-1 ring-line hover:text-brand transition ${
            atEnd ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <ChevronRight width={18} height={18} />
        </button>
      </div>
    </div>
  );
}
