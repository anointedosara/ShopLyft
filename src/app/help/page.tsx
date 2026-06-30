import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { TruckIcon, ReturnIcon, ShieldIcon, CartIcon, SupportIcon, UserIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Help Center — ShopLyft" };

const topics = [
  { icon: <TruckIcon />, title: "Orders & Delivery", text: "Track orders, delivery times, and shipping fees.", href: "/account" },
  { icon: <ReturnIcon />, title: "Returns & Refunds", text: "Start a return and check your refund status.", href: "/returns" },
  { icon: <CartIcon />, title: "Payments", text: "Cards, USSD, and Pay on Delivery options.", href: "/cart" },
  { icon: <ShieldIcon />, title: "Buyer Protection", text: "Shop with confidence on every order.", href: "/help" },
  { icon: <UserIcon />, title: "My Account", text: "Manage your profile, orders, and saved items.", href: "/account" },
  { icon: <SupportIcon />, title: "Contact Us", text: "Reach our support team 24/7.", href: "/help" },
];

const faqs = [
  {
    q: "How do I track my order?",
    a: "Go to My Account → My Orders and select any order to see its live status and delivery estimate. Your most recent order also shows on the confirmation screen right after checkout.",
  },
  {
    q: "How long does delivery take?",
    a: "Most orders arrive within 2–4 business days. Delivery times vary by location, and you'll see an estimate on your order details page.",
  },
  {
    q: "Can I return an item?",
    a: "Yes. Eligible items can be returned within 7 days of delivery. Head to the Returns page to start a request from any of your orders.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept VISA, Mastercard, Verve, USSD bank transfers, and Pay on Delivery in supported areas.",
  },
  {
    q: "How do I cancel an order?",
    a: "Orders can be cancelled before they're dispatched. Open the order from My Orders and use the cancel option, or contact support for help.",
  },
  {
    q: "Is my payment information secure?",
    a: "Absolutely. Every transaction is protected by ShopLyft Buyer Protection and encrypted end to end.",
  },
];

export default function HelpCenterPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Help Center" }]} />

      {/* hero */}
      <div className="mt-4 rounded-3xl bg-gradient-to-br from-brand to-brand-700 text-white p-8 sm:p-12 text-center">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl">How can we help?</h1>
        <p className="text-white/85 mt-2 max-w-xl mx-auto">
          Search our help topics or browse the most common questions below.
        </p>
      </div>

      {/* topics */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((t) => (
          <Link
            key={t.title}
            href={t.href}
            className="flex items-start gap-3 rounded-2xl bg-white ring-1 ring-line p-5 hover:ring-brand-200 hover:-translate-y-0.5 transition"
          >
            <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand-50 text-brand shrink-0">{t.icon}</span>
            <div>
              <p className="font-semibold text-ink">{t.title}</p>
              <p className="text-sm text-mute mt-0.5">{t.text}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* faqs */}
      <section className="mt-10">
        <h2 className="font-display font-bold text-xl text-ink mb-4">Frequently asked questions</h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl bg-white ring-1 ring-line p-5 [&_summary]:list-none">
              <summary className="flex cursor-pointer items-center justify-between gap-3 font-semibold text-ink">
                {f.q}
                <span className="text-brand text-xl transition group-open:rotate-45">+</span>
              </summary>
              <p className="text-sm text-ink-soft mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* contact */}
      <section className="mt-10 rounded-3xl bg-cloud p-8 text-center">
        <span className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-white ring-1 ring-line text-brand mb-2">
          <SupportIcon width={24} height={24} />
        </span>
        <h2 className="font-display font-bold text-xl text-ink">Still need help?</h2>
        <p className="text-mute mt-1">Our support team is available 24/7 to assist you.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a href="mailto:support@shoplyft.example" className="rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-6 py-3 transition">
            Email support
          </a>
          <Link href="/returns" className="rounded-xl bg-white ring-1 ring-line hover:ring-brand-200 text-ink font-semibold px-6 py-3 transition">
            Start a return
          </Link>
        </div>
      </section>
    </div>
  );
}
