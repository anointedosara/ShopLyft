import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/catalog";
import Reveal from "./Reveal";
import { ChevronRight } from "./icons";

export default async function CategoryGrid() {
  const categories = await getCategories();
  return (
    <section id="categories" className="mx-auto max-w-[1280px] px-3 sm:px-5 py-8 sm:py-12">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink">Shop by category</h2>
          <p className="text-mute text-sm mt-1">Everything you need, all in one place.</p>
        </div>
        <Link href="/deals" className="hidden sm:flex items-center gap-1 text-brand font-semibold text-sm hover:gap-2 transition-all">
          View all <ChevronRight width={16} height={16} />
        </Link>
      </div>

      <Reveal stagger className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.id}`}
            className="group flex flex-col items-center gap-3 rounded-2xl bg-white ring-1 ring-line p-4 hover:ring-brand-200 hover:-translate-y-1 hover:shadow-[var(--shadow-card)] transition-all"
          >
            <span
              className={`relative grid place-items-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gradient-to-br ${c.gradient} text-2xl sm:text-3xl shadow-sm group-hover:scale-110 transition-transform`}
            >
              {c.image ? (
                <Image src={c.image} alt={c.name} fill sizes="64px" className="object-cover" />
              ) : (
                c.glyph
              )}
            </span>
            <span className="text-xs sm:text-sm font-medium text-center text-ink-soft leading-tight">
              {c.name}
            </span>
          </Link>
        ))}
      </Reveal>
    </section>
  );
}
