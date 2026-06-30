import Reveal from "./Reveal";
import { ChevronRight } from "./icons";

const banners = [
  { title: "Tech Week", text: "Premium gadgets, up to 50% off", cta: "Shop tech", href: "/category/electronics", cls: "from-stone-800 to-stone-950" },
  { title: "Fashion Fest", text: "New-season styles just dropped", cta: "Shop fashion", href: "/category/fashion", cls: "from-stone-800 to-stone-950" },
  { title: "Home Refresh", text: "Upgrade your space for less", cta: "Shop home", href: "/category/home", cls: "from-stone-800 to-stone-950" },
];

export default function PromoBanners() {
  return (
    <section className="mx-auto max-w-[1280px] px-3 sm:px-5 py-4">
      <Reveal stagger className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {banners.map((b) => (
          <a
            key={b.title}
            href={b.href}
            className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${b.cls} text-white p-6 min-h-[160px] flex flex-col justify-between ring-1 ring-white/10`}
          >
            <span className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/[0.06] group-hover:scale-110 transition-transform duration-500" />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">Limited time</p>
              <h3 className="font-display font-bold text-2xl mt-1.5">{b.title}</h3>
              <p className="text-white/75 text-sm mt-1 max-w-[14rem]">{b.text}</p>
            </div>
            <span className="relative inline-flex items-center gap-1.5 font-semibold text-sm text-white/90 group-hover:gap-2.5 transition-all">
              {b.cta} <ChevronRight width={16} height={16} />
            </span>
          </a>
        ))}
      </Reveal>
    </section>
  );
}
