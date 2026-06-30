"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { BoltIcon, TruckIcon, ShieldIcon } from "../icons";
import HeroShowcase, { type HeroProduct } from "./HeroShowcase";

export default function Hero({ products }: { products: HeroProduct[] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const targets = [".hero-eyebrow", ".hero-line", ".hero-sub", ".hero-cta", ".hero-stat", ".hero-canvas"];
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        // Safety net: once the intro finishes, strip the inline opacity/transform
        // GSAP added so every element reverts to its natural (visible) state. A
        // single tween getting killed mid-flight (React re-render / overwrite)
        // was leaving the CTAs stuck at opacity 0.
        onComplete: () => gsap.set(targets, { clearProps: "opacity,transform" }),
      });
      tl.from(".hero-eyebrow", { opacity: 0, y: 20, duration: 0.5 })
        .from(".hero-line", { opacity: 0, y: 40, duration: 0.8, stagger: 0.12 }, "-=0.2")
        .from(".hero-sub", { opacity: 0, y: 20, duration: 0.6 }, "-=0.4")
        .from(".hero-cta", { opacity: 0, y: 20, duration: 0.5, stagger: 0.1 }, "-=0.3")
        .from(".hero-stat", { opacity: 0, y: 16, duration: 0.5, stagger: 0.1 }, "-=0.2")
        .from(".hero-canvas", { opacity: 0, scale: 0.9, duration: 1.1, ease: "power2.out" }, 0.2);
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-ink-soft to-[#241a12] text-white"
    >
      {/* glow accents */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-gold/20 blur-3xl" />

      <div className="px-5 sm:px-8 grid lg:grid-cols-2 gap-6 items-center min-h-[60vh] lg:min-h-[500px] py-10">
        {/* Copy */}
        <div className="relative z-10 max-w-xl">
          <span className="hero-eyebrow inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
            <BoltIcon width={14} height={14} className="text-gold" /> ShopLyft Mega Sale is live
          </span>

          <h1 className="font-display font-extrabold leading-[1.05] mt-5 text-4xl sm:text-5xl lg:text-6xl">
            <span className="hero-line block">Shopping,</span>
            <span className="hero-line block text-gradient">lifted higher.</span>
            <span className="hero-line block">Millions of products.</span>
          </h1>

          <p className="hero-sub mt-5 text-base sm:text-lg text-white/75">
            From the latest phones to everyday groceries — discover unbeatable
            prices, lightning delivery, and deals that drop every hour.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#deals"
              className="hero-cta inline-flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-600 px-6 py-3.5 font-semibold shadow-[var(--shadow-pop)] transition active:scale-[0.98]"
            >
              Shop the deals <BoltIcon width={16} height={16} />
            </a>
            <a
              href="#categories"
              className="hero-cta inline-flex items-center gap-2 rounded-xl bg-white/10 ring-1 ring-white/25 hover:bg-white/20 px-6 py-3.5 font-semibold backdrop-blur transition"
            >
              Browse categories
            </a>
          </div>

          <div className="mt-9 grid grid-cols-3 gap-3 max-w-md">
            {[
              { icon: <TruckIcon width={18} height={18} />, k: "Fast", v: "Same-day delivery" },
              { icon: <ShieldIcon width={18} height={18} />, k: "Secure", v: "Buyer protection" },
              { icon: <BoltIcon width={18} height={18} />, k: "Deals", v: "Up to 70% off" },
            ].map((s) => (
              <div key={s.k} className="hero-stat rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-3">
                <span className="text-gold">{s.icon}</span>
                <p className="mt-2 text-sm font-bold">{s.k}</p>
                <p className="text-xs text-white/60 leading-tight">{s.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* floating product showcase — desktop only; mobile keeps a clean text hero */}
        <div className="hero-canvas relative hidden lg:block lg:h-[500px]">
          <HeroShowcase products={products} />
        </div>
      </div>
    </section>
  );
}
