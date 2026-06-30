"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { bootstrapAdminLogin } from "@/app/actions/auth";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // First login for an allowlisted admin email sets+saves its password; a
    // no-op for everyone else.
    const boot = await bootstrapAdminLogin(email, password);
    if (!boot.ok) {
      setLoading(false);
      setError(boot.error);
      return;
    }
    const { error } = await signIn.email({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message || "Could not sign you in. Check your details and try again.");
      return;
    }
    router.push("/account");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Sign in" }]} />

      <div className="mx-auto mt-6 w-full max-w-md rounded-2xl bg-white ring-1 ring-line p-6 sm:p-8">
        <h1 className="font-display font-extrabold text-2xl text-ink">Welcome back</h1>
        <p className="text-sm text-mute mt-1">Sign in to your ShopLyft account.</p>

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
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-ink mb-1.5">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-mute">
          New to ShopLyft?{" "}
          <Link href="/signup" className="font-semibold text-brand hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
