import Link from "next/link";
import { ChevronUp, XSocialIcon, InstagramIcon, FacebookIcon, YouTubeIcon } from "./icons";

// known footer links that map to real routes; others stay as in-page anchors
const linkHrefs: Record<string, string> = {
  "Help Center": "/help",
  "Track My Order": "/account",
  "Returns & Refunds": "/returns",
  "Contact Us": "/help",
  "Today's Deals": "/deals",
  "Flash Sales": "/deals",
  "ShopLyft Mall": "/deals",
};

const columns = [
  {
    title: "Shop ShopLyft",
    links: ["Today's Deals", "Flash Sales", "New Arrivals", "Best Sellers", "Gift Cards", "ShopLyft Mall"],
  },
  {
    title: "Customer Care",
    links: ["Help Center", "Track My Order", "Returns & Refunds", "Shipping Info", "Payment Options", "Contact Us"],
  },
  {
    title: "Make Money",
    links: ["Sell on ShopLyft", "Become an Affiliate", "Vendor Hub", "Advertise with us", "ShopLyft Logistics"],
  },
  {
    title: "About",
    links: ["About ShopLyft", "Careers", "Press", "Sustainability", "Terms & Conditions", "Privacy Policy"],
  },
];

const socials = [
  { Icon: XSocialIcon, label: "X" },
  { Icon: InstagramIcon, label: "Instagram" },
  { Icon: FacebookIcon, label: "Facebook" },
  { Icon: YouTubeIcon, label: "YouTube" },
];
const pays = ["VISA", "Mastercard", "Verve", "Bank Transfer", "USSD"];

export default function Footer() {
  return (
    <footer className="mt-8 bg-ink text-white/70">
      {/* back to top */}
      <a href="#" className="flex items-center justify-center gap-1.5 bg-ink-soft py-3 text-sm font-medium text-white hover:text-gold transition">
        <ChevronUp width={16} height={16} /> Back to top
      </a>

      <div className="mx-auto max-w-[1280px] px-5 py-12 grid grid-cols-2 lg:grid-cols-5 gap-8">
        <div className="col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-white">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand font-display font-extrabold">S</span>
            <span className="font-display font-extrabold text-xl">
              Shop<span className="text-gold">Lyft</span>
            </span>
          </div>
          <p className="text-sm mt-4 max-w-xs">
            Africa&apos;s favorite online marketplace. Millions of products,
            delivered to your door — lifted higher, every day.
          </p>
          <div className="flex gap-2 mt-5">
            {socials.map(({ Icon, label }) => (
              <a key={label} href="#" aria-label={label} className="grid place-items-center w-9 h-9 rounded-full bg-white/10 hover:bg-brand text-white transition">
                <Icon width={16} height={16} />
              </a>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-white font-semibold text-sm mb-3">{col.title}</h3>
            <ul className="space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l}>
                  {linkHrefs[l] ? (
                    <Link href={linkHrefs[l]} className="hover:text-gold transition">{l}</Link>
                  ) : (
                    <a href="#" className="hover:text-gold transition">{l}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1280px] px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/50">© 2026 ShopLyft Inc. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-2">
            {pays.map((p) => (
              <span key={p} className="rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
