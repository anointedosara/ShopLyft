import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit, RatePolicy, clientIp } from "@/lib/rate-limit";

// Next.js 16 renamed Middleware → Proxy (same mechanism). Per the docs, Proxy is
// for optimistic, edge-level request gating — NOT full auth/session logic. We use
// it for exactly that: throttling auth mutations (sign-in / sign-up / password
// reset) by IP to close the "no rate limiting on auth" finding. Actual
// authentication/authorization stays in the actions and pages (read from DB).
//
// Note: the default in-memory rate store is per-instance; swap in a shared store
// (Upstash/Redis) via setRateStore() for multi-instance correctness.

export async function proxy(request: NextRequest) {
  // Only throttle state-changing auth calls. GET session lookups pass through.
  if (request.method !== "POST") return NextResponse.next();

  const path = request.nextUrl.pathname;
  // Tighter budget for password reset (enumeration/abuse target).
  const policy = /reset|forget|forgot/i.test(path) ? RatePolicy.passwordReset : RatePolicy.auth;

  const ip = clientIp(request.headers);
  const rl = await rateLimit(`auth:${ip}:${path}`, policy);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*"],
};
