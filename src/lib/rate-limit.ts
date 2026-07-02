// Rate limiting — fixed-window counter with a pluggable store.
//
// Closes the Critical "no rate limiting anywhere" finding. Default store is an
// in-process Map (zero deps, works today). NOTE: an in-memory store is
// per-instance — correct for a single node / dev / low traffic, but on
// multi-instance hosting each instance counts independently. The `RateStore`
// interface is the seam: drop in an Upstash/Redis implementation and set it via
// `setRateStore()` with no call-site changes.
//
// Usage (in a server action or route handler):
//   const rl = await rateLimit(`login:${ip}`, { limit: 5, windowMs: 60_000 });
//   if (!rl.allowed) throw new RateLimitError(rl.retryAfterSeconds);

export type RateResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterSeconds: number;
};

export type RateStore = {
  // Atomically increment the counter for `key`, creating it with a `windowMs`
  // TTL if absent. Returns the new count and ms until the window resets.
  incr(key: string, windowMs: number): Promise<{ count: number; resetInMs: number }>;
};

// ── Default in-memory store ──────────────────────────────────────────────────
class MemoryStore implements RateStore {
  private buckets = new Map<string, { count: number; expiresAt: number }>();
  private lastSweep = 0;

  async incr(key: string, windowMs: number) {
    const now = Date.now();
    this.sweep(now);
    const b = this.buckets.get(key);
    if (!b || b.expiresAt <= now) {
      const expiresAt = now + windowMs;
      this.buckets.set(key, { count: 1, expiresAt });
      return { count: 1, resetInMs: windowMs };
    }
    b.count += 1;
    return { count: b.count, resetInMs: b.expiresAt - now };
  }

  // Opportunistic cleanup so the Map can't grow unbounded.
  private sweep(now: number) {
    if (now - this.lastSweep < 30_000) return;
    this.lastSweep = now;
    for (const [k, v] of this.buckets) if (v.expiresAt <= now) this.buckets.delete(k);
  }
}

let store: RateStore = new MemoryStore();
export function setRateStore(s: RateStore) {
  store = s;
}

export type RateOptions = { limit: number; windowMs: number };

export async function rateLimit(key: string, opts: RateOptions): Promise<RateResult> {
  const { count, resetInMs } = await store.incr(key, opts.windowMs);
  const remaining = Math.max(0, opts.limit - count);
  return {
    allowed: count <= opts.limit,
    remaining,
    limit: opts.limit,
    retryAfterSeconds: Math.ceil(resetInMs / 1000),
  };
}

// Named policies so limits live in one place, not scattered as magic numbers.
export const RatePolicy = {
  auth: { limit: 5, windowMs: 60_000 }, // 5 login/signup attempts per minute per IP
  passwordReset: { limit: 3, windowMs: 15 * 60_000 },
  upload: { limit: 20, windowMs: 60_000 },
  webhook: { limit: 120, windowMs: 60_000 },
  mutation: { limit: 60, windowMs: 60_000 }, // general write actions per user
  search: { limit: 60, windowMs: 60_000 },
} as const satisfies Record<string, RateOptions>;

// Best-effort client IP from standard proxy headers (Vercel/most hosts set these).
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return headers.get("x-real-ip") || "unknown";
}
