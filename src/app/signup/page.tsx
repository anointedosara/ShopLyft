"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CartIcon, StoreIcon } from "@/components/icons";

type AccountType = "buyer" | "seller";

export default function SignupPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>("buyer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const { error } = await signUp.email({ name, email, password });
    setLoading(false);
    if (error) {
      setError(error.message || "Could not create your account. Try again.");
      return;
    }
    // Sellers go straight into store onboarding; buyers to their account.
    router.push(accountType === "seller" ? "/sell" : "/account");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Create account" }]} />

      <div className="mx-auto mt-6 w-full max-w-md rounded-2xl bg-white ring-1 ring-line p-6 sm:p-8">
        <h1 className="font-display font-extrabold text-2xl text-ink">Create your account</h1>
        <p className="text-sm text-mute mt-1">Join ShopLyft — shop deals, track orders and more.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <span className="block text-sm font-semibold text-ink mb-1.5">I want to</span>
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: "buyer", icon: <CartIcon width={20} height={20} />, title: "Shop", text: "Buy products" },
                { key: "seller", icon: <StoreIcon width={20} height={20} />, title: "Sell", text: "Open a store" },
              ] as const).map((opt) => {
                const active = accountType === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setAccountType(opt.key)}
                    aria-pressed={active}
                    className={`flex flex-col items-start gap-1 rounded-xl p-4 text-left ring-1 transition ${
                      active ? "ring-brand bg-brand-50" : "ring-line hover:ring-brand-200"
                    }`}
                  >
                    <span className={`grid place-items-center w-9 h-9 rounded-lg ${active ? "bg-brand text-white" : "bg-cloud text-ink-soft"}`}>
                      {opt.icon}
                    </span>
                    <span className="font-semibold text-sm text-ink mt-1">{opt.title}</span>
                    <span className="text-xs text-mute">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-ink mb-1.5">Full name</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full rounded-xl bg-cloud px-4 py-3 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand transition"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-ink mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl bg-cloud px-4 py-3 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand transition"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-ink mb-1.5">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-xl bg-cloud px-4 py-3 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand transition"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold py-3 transition active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-mute">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
