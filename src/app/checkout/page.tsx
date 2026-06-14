"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreProvider";
import { formatNaira } from "@/lib/data";
import Breadcrumbs from "@/components/Breadcrumbs";

const DELIVERY = 1500;
const FREE_OVER = 50000;
const payMethods = [
  { id: "card", label: "Debit / Credit Card", glyph: "💳" },
  { id: "transfer", label: "Bank Transfer", glyph: "🏦" },
  { id: "ussd", label: "USSD", glyph: "📲" },
  { id: "delivery", label: "Pay on Delivery", glyph: "🚚" },
];

export default function CheckoutPage() {
  const { cartLines, subtotal, placeOrder, hydrated } = useStore();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", city: "", pay: "card" });

  const delivery = subtotal >= FREE_OVER || subtotal === 0 ? 0 : DELIVERY;
  const total = subtotal + delivery;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const order = placeOrder({ name: form.name, address: `${form.address}, ${form.city}` });
    if (order) router.push("/order-confirmed");
  };

  if (hydrated && cartLines.length === 0) {
    return (
      <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
        <Breadcrumbs items={[{ label: "Checkout" }]} />
        <div className="mt-6 rounded-3xl bg-white ring-1 ring-line p-12 text-center">
          <p className="text-6xl mb-4">🧾</p>
          <h1 className="font-display font-extrabold text-2xl text-ink">Nothing to check out</h1>
          <p className="text-mute mt-2">Your cart is empty.</p>
          <Link href="/deals" className="inline-flex mt-6 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-6 py-3 transition">
            Browse deals
          </Link>
        </div>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl ring-1 ring-line bg-white px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-brand transition";

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
      <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink mt-4 mb-5">Checkout</h1>

      <form onSubmit={submit} className="grid lg:grid-cols-[1fr_360px] gap-5">
        <div className="space-y-5">
          {/* contact */}
          <section className="rounded-2xl bg-white ring-1 ring-line p-5">
            <h2 className="font-display font-bold text-ink mb-4 flex items-center gap-2">
              <span className="grid place-items-center w-6 h-6 rounded-full bg-brand text-white text-xs">1</span>
              Contact information
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input required placeholder="Full name" value={form.name} onChange={set("name")} className={inputCls} />
              <input required type="email" placeholder="Email address" value={form.email} onChange={set("email")} className={inputCls} />
              <input required placeholder="Phone number" value={form.phone} onChange={set("phone")} className={`${inputCls} sm:col-span-2`} />
            </div>
          </section>

          {/* address */}
          <section className="rounded-2xl bg-white ring-1 ring-line p-5">
            <h2 className="font-display font-bold text-ink mb-4 flex items-center gap-2">
              <span className="grid place-items-center w-6 h-6 rounded-full bg-brand text-white text-xs">2</span>
              Delivery address
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input required placeholder="Street address" value={form.address} onChange={set("address")} className={`${inputCls} sm:col-span-2`} />
              <input required placeholder="City" value={form.city} onChange={set("city")} className={inputCls} />
              <input placeholder="State / Region" className={inputCls} />
            </div>
          </section>

          {/* payment */}
          <section className="rounded-2xl bg-white ring-1 ring-line p-5">
            <h2 className="font-display font-bold text-ink mb-4 flex items-center gap-2">
              <span className="grid place-items-center w-6 h-6 rounded-full bg-brand text-white text-xs">3</span>
              Payment method
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {payMethods.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center gap-3 rounded-xl ring-1 px-4 py-3 cursor-pointer transition ${
                    form.pay === m.id ? "ring-brand bg-brand-50" : "ring-line hover:ring-brand-200"
                  }`}
                >
                  <input type="radio" name="pay" checked={form.pay === m.id} onChange={() => setForm((f) => ({ ...f, pay: m.id }))} className="accent-brand" />
                  <span className="text-xl">{m.glyph}</span>
                  <span className="text-sm font-medium text-ink">{m.label}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* summary */}
        <aside className="lg:sticky lg:top-28 self-start">
          <div className="rounded-2xl bg-white ring-1 ring-line p-5">
            <h2 className="font-display font-bold text-ink mb-4">Your order</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {cartLines.map((l) => (
                <div key={l.product.id} className="flex items-center gap-3">
                  <span className={`relative grid place-items-center w-12 h-12 rounded-lg bg-gradient-to-br ${l.product.gradient} shrink-0`}>
                    <span className="text-2xl">{l.product.glyph}</span>
                    <span className="absolute -top-1.5 -right-1.5 grid place-items-center min-w-4 h-4 px-1 rounded-full bg-ink text-white text-[10px] font-bold">{l.qty}</span>
                  </span>
                  <span className="flex-1 text-xs text-ink-soft line-clamp-2">{l.product.name}</span>
                  <span className="text-sm font-semibold text-ink whitespace-nowrap">{formatNaira(l.lineTotal)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-line mt-4 pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-mute">Subtotal</span><span className="font-semibold" suppressHydrationWarning>{formatNaira(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-mute">Delivery</span><span className="font-semibold" suppressHydrationWarning>{delivery === 0 ? <span className="text-green-600">Free</span> : formatNaira(delivery)}</span></div>
              <div className="flex justify-between border-t border-line pt-2">
                <span className="font-bold text-ink">Total</span>
                <span className="font-display font-extrabold text-xl text-ink" suppressHydrationWarning>{formatNaira(total)}</span>
              </div>
            </div>

            <button type="submit" className="mt-5 w-full rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold py-3.5 transition active:scale-[0.98] shadow-[var(--shadow-pop)]">
              Place order
            </button>
            <p className="mt-3 text-center text-xs text-mute">By placing your order you agree to ShopLyft&apos;s terms.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
