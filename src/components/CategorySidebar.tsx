import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/catalog";
import { ChevronRight } from "./icons";

export default async function CategorySidebar() {
  const categories = await getCategories();
  return (
    <aside className="hidden lg:block rounded-2xl bg-white ring-1 ring-line overflow-hidden h-fit">
      <p className="px-4 py-3 bg-ink text-white text-sm font-semibold">All Categories</p>
      <ul className="py-1">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/category/${c.id}`}
              className="group flex items-center justify-between px-4 py-2.5 text-sm text-ink-soft hover:bg-brand-50 hover:text-brand-700 transition"
            >
              <span className="flex items-center gap-2.5">
                {c.image ? (
                  <span className="relative inline-block w-6 h-6 rounded-full overflow-hidden ring-1 ring-line shrink-0">
                    <Image src={c.image} alt="" fill sizes="24px" className="object-cover" />
                  </span>
                ) : (
                  <span className="text-base">{c.glyph}</span>
                )}{" "}
                {c.name}
              </span>
              <ChevronRight width={15} height={15} className="opacity-0 group-hover:opacity-100 transition" />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
