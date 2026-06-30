"use client";

import { useState } from "react";
import { BoltIcon } from "./icons";

export default function Newsletter() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
              setEmail(""); // clear the field once subscribed
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 rounded-xl px-4 py-3.5 text-ink outline-none ring-2 ring-transparent focus:ring-gold"
            />
            <button className="rounded-xl bg-ink hover:bg-ink-soft px-6 py-3.5 font-semibold transition active:scale-[0.98] whitespace-nowrap">
              {sent ? "You're subscribed" : "Subscribe"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
