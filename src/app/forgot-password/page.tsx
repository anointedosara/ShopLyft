"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // better-auth builds the tokenised URL pointing at /reset-password.
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setLoading(false);
    // Always show success even if the email isn't registered — never reveal
    // which addresses have accounts (prevents user enumeration).
    if (error && error.status !== 200) {
      // Only surface hard failures (e.g. rate limited); not "no such user".
      if (error.status === 429) {
        setError("Too many requests. Please wait a minute and try again.");
        return;
      }
    }
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Sign in", href: "/login" }, { label: "Reset password" }]} />

      <div className="mx-auto mt-6 w-full max-w-md rounded-2xl bg-white ring-1 ring-line p-6 sm:p-8">
        <h1 className="font-display font-extrabold text-2xl text-ink">Forgot your password?</h1>
        {sent ? (
          <>
            <p className="text-sm text-mute mt-3">
              If an account exists for <span className="font-semibold text-ink">{email}</span>, we&apos;ve sent a link to
              reset your password. Check your inbox (and spam).
            </p>
            <Link href="/login" className="mt-6 inline-block font-semibold text-brand hover:underline">
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-mute mt-1">Enter your email and we&apos;ll send you a reset link.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
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
              {error && <p className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold py-3 transition active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-mute">
              Remembered it?{" "}
              <Link href="/login" className="font-semibold text-brand hover:underline">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
