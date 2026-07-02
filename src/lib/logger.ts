// Structured logger — dependency-free and edge-safe (usable from proxy.ts too).
//
// There was no logging in the codebase before this. Rules:
//  - JSON lines in production (machine-parseable for any log drain); pretty in dev.
//  - Automatic redaction of sensitive keys so PII / secrets never hit the logs
//    (the schema encrypts idNumber/accountNumber — logs must not undo that).
//  - No throw: logging must never break a request.
//
// Swap seam: replace `sink()` to ship to Datadog/Axiom/etc. without touching
// call sites.

type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL: number = LEVELS[(process.env.LOG_LEVEL as Level) || (process.env.NODE_ENV === "production" ? "info" : "debug")];

const SENSITIVE = /(password|secret|token|authorization|cookie|idnumber|accountnumber|cvv|pin|otp|apikey|api_key)/i;

function redact(value: unknown, depth = 0): unknown {
  if (value == null || depth > 4) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE.test(k) ? "[redacted]" : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

function sink(line: Record<string, unknown>) {
  const fn = line.level === "error" ? console.error : line.level === "warn" ? console.warn : console.log;
  if (process.env.NODE_ENV === "production") {
    fn(JSON.stringify(line));
  } else {
    const { level, msg, time, ...rest } = line;
    fn(`[${String(level).toUpperCase()}] ${msg}`, Object.keys(rest).length ? redact(rest) : "");
  }
}

function log(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (LEVELS[level] < MIN_LEVEL) return;
  try {
    sink({
      level,
      msg,
      time: new Date().toISOString(),
      ...(meta ? (redact(meta) as Record<string, unknown>) : {}),
    });
  } catch {
    // Logging must never throw.
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
};
