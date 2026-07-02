"use client";

import { useState } from "react";
import { subscribeNewsletterAction } from "@/app/actions/newsletter";
import { BoltIcon } from "./icons";

export default function Newsletter() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await subscribeNewsletterAction(email);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong. Please try again.");
      return;
    }
    setSent(true);
    setEmail("");
  };

  return (
    <section className="mx-auto max-w-[1280px] px-3 sm:px-5 py-6 sm:py-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-700 text-white p-8 sm:p-12">
        <div className="pointer-events-none absolute -top-16 -right-10 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
        <div className="relative grid lg:grid-cols-2 gap-6 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <BoltIcon width={14} height={14} /> Join 2M+ smart shoppers
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl mt-3">
              Get ₦2,000 off your first order
            </h2>
            <p className="text-white/85 mt-2 max-w-md">
              Subscribe for exclusive deals, early access to flash sales, and
              personalized recommendations.
            </p>
          </div>

          <div>
            <form
              onSubmit={submit}
              className="flex items-center gap-2 rounded-2xl bg-white p-1.5 ring-2 ring-transparent focus-within:ring-gold transition"
            >
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm text-ink outline-none placeholder:text-mute"
              />
              <button
                disabled={busy || sent}
                className="shrink-0 rounded-xl bg-ink hover:bg-ink-soft text-white px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98] whitespace-nowrap disabled:opacity-70"
              >
                {sent ? "You're subscribed" : busy ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
            {sent && <p className="mt-2 text-sm text-white/90">Check your inbox — we&apos;ve sent your welcome offer. 🎉</p>}
            {error && <p className="mt-2 text-sm text-white bg-red-500/30 rounded-lg px-3 py-1.5 inline-block">{error}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
