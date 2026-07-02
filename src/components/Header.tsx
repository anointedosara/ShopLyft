"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { navLinks, type Category } from "@/lib/data";
import { useStore } from "@/context/StoreProvider";
import { useSession } from "@/lib/auth-client";
import NotificationBell from "./NotificationBell";
import Avatar from "./Avatar";
import {
  SearchIcon, UserIcon, CartIcon, HeartIcon, MenuIcon, CloseIcon, ChevronRight,
} from "./icons";

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      suppressHydrationWarning
      className="absolute -top-2 -right-2 grid place-items-center min-w-4 h-4 px-1 rounded-full bg-gold text-ink text-[10px] font-bold"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function Header({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const { cartCount, wishlist, hydrated } = useStore();
  const { data: session } = useSession();
  const firstName = session?.user?.name?.trim().split(" ")[0];

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
    setOpen(false);
  };

  return (
    <>
      {/* Announcement strip */}
      <div className="bg-ink text-white/75 text-xs">
        <div className="mx-auto max-w-[1280px] px-5 py-2 flex items-center justify-center gap-x-6 flex-wrap text-center">
          <span>Free delivery on orders over ₦50,000</span>
          <span className="hidden sm:inline text-white/25">•</span>
          <span className="hidden sm:inline">Secure payments by Paystack</span>
          <span className="hidden md:inline text-white/25">•</span>
          <span className="hidden md:inline">7-day easy returns</span>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-brand text-white shadow-[0_4px_20px_rgba(0,0,0,0.12)]">
        <div className="mx-auto max-w-[1280px] px-3 sm:px-5">
          <div className="flex items-center gap-3 py-3">
            <button
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="lg:hidden grid place-items-center w-10 h-10 rounded-lg hover:bg-white/15 transition"
            >
              <MenuIcon />
            </button>

            <Link href="/" className="flex items-center gap-2 shrink-0 select-none">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-white text-brand font-display font-extrabold text-lg shadow-sm">
                S
              </span>
              <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight">
                Shop<span className="text-gold">Lyft</span>
              </span>
            </Link>

            <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-2xl mx-2">
              <div className="flex w-full bg-white rounded-lg overflow-hidden ring-2 ring-transparent focus-within:ring-gold transition">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  type="text"
                  placeholder="Search products, brands and categories…"
                  className="flex-1 px-4 py-2.5 text-ink text-sm outline-none placeholder:text-mute"
                />
                <button className="flex items-center gap-2 bg-ink hover:bg-ink-soft px-5 text-sm font-semibold transition">
                  <SearchIcon width={18} height={18} />
                  <span className="hidden lg:inline">Search</span>
                </button>
              </div>
            </form>

            <nav className="ml-auto flex items-center gap-1 sm:gap-2">
              <Link href="/account" className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/15 transition text-sm font-medium">
                {session?.user?.image ? (
                  <Avatar name={session.user.name} image={session.user.image} size={24} className="ring-white/50" />
                ) : (
                  <UserIcon width={20} height={20} />
                )}
                <span className="hidden lg:inline" suppressHydrationWarning>{firstName ? `Hi, ${firstName}` : "Account"}</span>
              </Link>
              <NotificationBell />
              <Link href="/wishlist" className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/15 transition text-sm font-medium">
                <span className="relative">
                  <HeartIcon width={20} height={20} />
                  <Badge count={hydrated ? wishlist.length : 0} />
                </span>
                <span className="hidden lg:inline">Saved</span>
              </Link>
              <Link href="/cart" className="relative flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/15 transition text-sm font-medium">
                <span className="relative">
                  <CartIcon width={20} height={20} />
                  <Badge count={hydrated ? cartCount : 0} />
                </span>
                <span className="hidden lg:inline">Cart</span>
              </Link>
            </nav>
          </div>

          {/* Mobile search row */}
          <form onSubmit={submitSearch} className="md:hidden pb-3">
            <div className="flex w-full bg-white rounded-lg overflow-hidden">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="text"
                placeholder="Search ShopLyft…"
                className="flex-1 px-4 py-2.5 text-ink text-sm outline-none placeholder:text-mute"
              />
              <button className="grid place-items-center bg-ink px-4 text-white">
                <SearchIcon width={18} height={18} />
              </button>
            </div>
          </form>
        </div>

        <div className="hidden lg:block border-t border-white/15">
          <div className="mx-auto max-w-[1280px] px-5">
            <ul className="flex items-center gap-6 h-11 text-sm font-medium">
              {navLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="opacity-90 hover:opacity-100 hover:text-gold transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-[60] lg:hidden transition ${open ? "visible" : "invisible"}`} aria-hidden={!open}>
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[82%] max-w-sm bg-white shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between bg-brand text-white px-4 py-4">
            <span className="font-display font-extrabold text-lg">
              Shop<span className="text-gold">Lyft</span>
            </span>
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="p-1">
              <CloseIcon />
            </button>
          </div>
          <div className="px-4 py-3 border-b border-line grid grid-cols-3 gap-2 text-center text-xs font-medium">
            <Link href="/account" onClick={() => setOpen(false)} className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-cloud text-ink">
              <UserIcon width={20} height={20} className="text-brand" /> Account
            </Link>
            <Link href="/wishlist" onClick={() => setOpen(false)} className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-cloud text-ink">
              <HeartIcon width={20} height={20} className="text-brand" /> Saved
            </Link>
            <Link href="/cart" onClick={() => setOpen(false)} className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-cloud text-ink">
              <CartIcon width={20} height={20} className="text-brand" /> Cart
            </Link>
          </div>
          <nav className="overflow-y-auto h-[calc(100%-160px)] py-2">
            <p className="px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-mute font-semibold">Categories</p>
            <ul>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/category/${c.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-cloud transition"
                  >
                    <span className="flex items-center gap-3 text-sm font-medium text-ink">
                      {c.image ? (
                        <span className="relative inline-block w-7 h-7 rounded-full overflow-hidden ring-1 ring-line shrink-0">
                          <Image src={c.image} alt="" fill sizes="28px" className="object-cover" />
                        </span>
                      ) : (
                        <span className="text-lg">{c.glyph}</span>
                      )}{" "}
                      {c.name}
                    </span>
                    <ChevronRight width={16} height={16} className="text-mute" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </>
  );
}
