"use client";

import Image from "next/image";
import { formatNaira } from "@/lib/data";

export type HeroProduct = {
  id: string;
  name: string;
  price: number;
  image?: string;
  gradient: string;
  glyph: string;
};

// Fixed, art-directed positions for up to 4 floating product cards. Percentages
// so it scales cleanly from the 300px mobile canvas to the 500px desktop one.
const SLOTS = [
  { left: "20%", top: "10%", width: "52%", rotate: "-4deg", dur: "7s", delay: "0s", z: 30 },
  { left: "2%", top: "44%", width: "40%", rotate: "5deg", dur: "8.5s", delay: "-1.2s", z: 20 },
  { left: "64%", top: "30%", width: "36%", rotate: "6deg", dur: "9s", delay: "-0.6s", z: 20 },
  { left: "46%", top: "62%", width: "34%", rotate: "-5deg", dur: "7.8s", delay: "-2s", z: 10 },
];

// Professional hero visual: a small, gently drifting collage of real products.
// Replaces the previous toy-like 3D scene. Motion is autonomous and subtle
// (no cursor reaction), and respects prefers-reduced-motion via .hero-float.
export default function HeroShowcase({ products }: { products: HeroProduct[] }) {
  const items = products.slice(0, SLOTS.length);

  return (
    <div className="absolute inset-0">
      {items.map((p, i) => {
        const s = SLOTS[i];
        return (
          <div
            key={p.id}
            className="hero-float absolute"
            style={{ left: s.left, top: s.top, width: s.width, zIndex: s.z, animationDuration: s.dur, animationDelay: s.delay }}
          >
            <div
              className="relative rounded-2xl overflow-hidden ring-1 ring-white/15 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.6)]"
              style={{ transform: `rotate(${s.rotate})` }}
            >
              <div className={`relative aspect-[4/5] bg-gradient-to-br ${p.gradient}`}>
                {p.image ? (
                  <Image src={p.image} alt={p.name} fill sizes="240px" className="object-cover" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-5xl">{p.glyph}</span>
                )}
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                <span className="truncate rounded-md bg-black/45 text-white text-[10px] font-medium px-1.5 py-1 backdrop-blur-sm">
                  {p.name}
                </span>
                <span className="shrink-0 rounded-md bg-white text-ink text-[11px] font-bold px-1.5 py-1 whitespace-nowrap">
                  {formatNaira(p.price)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
