import Reveal from "./Reveal";
import { ChevronRight } from "./icons";

const banners = [
  {
    title: "Tech Week",
    text: "Premium gadgets up to 50% off",
    cta: "Shop tech",
    glyph: "💻",
    cls: "from-indigo-600 to-violet-700",
  },
  {
    title: "Fashion Fest",
    text: "New season styles just dropped",
    cta: "Shop fashion",
    glyph: "👜",
    cls: "from-rose-500 to-pink-600",
  },
  {
    title: "Home Refresh",
    text: "Cozy up your space for less",
    cta: "Shop home",
    glyph: "🛋️",
    cls: "from-amber-500 to-orange-600",
  },
];

export default function PromoBanners() {
  return (
    <section className="mx-auto max-w-[1280px] px-3 sm:px-5 py-4">
      <Reveal stagger className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {banners.map((b) => (
          <a
            key={b.title}
            href="#"
            className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${b.cls} text-white p-6 min-h-[160px] flex flex-col justify-between`}
          >
            <span className="absolute -right-4 -bottom-4 text-8xl opacity-25 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
              {b.glyph}
            </span>
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Limited time</p>
              <h3 className="font-display font-extrabold text-2xl mt-1">{b.title}</h3>
              <p className="text-white/85 text-sm mt-1 max-w-[14rem]">{b.text}</p>
            </div>
            <span className="relative inline-flex items-center gap-1 font-semibold text-sm group-hover:gap-2 transition-all">
              {b.cta} <ChevronRight width={16} height={16} />
            </span>
          </a>
        ))}
      </Reveal>
    </section>
  );
}
