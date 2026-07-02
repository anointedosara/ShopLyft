// Canonical result contract for every server action and service call.
//
// Server Actions in Next.js are reachable via direct POST — the framework docs
// are explicit that *expected* errors should be modelled as return values, not
// thrown. This is that return value, unified in one place so actions stop
// hand-rolling their own `{ ok, error }` unions (each slightly different).
//
// - `ok(data)`  → success, carrying a typed payload (or nothing).
// - `fail(msg)` → a safe, user-facing error string, optionally with a stable
//                 machine `code` the client can branch on (e.g. "OUT_OF_STOCK").

export type Ok<T> = { ok: true; data: T };
export type Err = { ok: false; error: string; code?: string };
export type ActionResult<T = void> = Ok<T> | Err;

export function ok(): Ok<void>;
export function ok<T>(data: T): Ok<T>;
export function ok<T>(data?: T): Ok<T> {
  return { ok: true, data: data as T };
}

export function fail(error: string, code?: string): Err {
  return code ? { ok: false, error, code } : { ok: false, error };
}

// Narrowing helpers for call sites that prefer guards over destructuring.
export function isOk<T>(r: ActionResult<T>): r is Ok<T> {
  return r.ok;
}
export function isErr<T>(r: ActionResult<T>): r is Err {
  return !r.ok;
}

// Unwrap or throw — for internal server-to-server calls where an error really is
// exceptional (never expose the thrown value directly to a client).
export function unwrap<T>(r: ActionResult<T>): T {
  if (!r.ok) throw new Error(r.error);
  return r.data;
}
