// Typed error layer.
//
// Two audiences for every failure: the client (needs a safe, human message and
// maybe a stable code to branch on) and the operator (needs the real cause in
// the logs). AppError carries both. Anything unexpected that reaches
// `handleActionError` is logged in full but returned to the client as a generic
// message — so internals never leak (a finding from the audit).
//
// Convention: services THROW these; the web boundary (server actions / route
// handlers) CATCHES them via `handleActionError` and turns them into an
// ActionResult or HTTP response. This keeps `use server` functions returning
// values for expected errors while still having a single catch-all.

import { fail, type Err } from "@/lib/result";
import { logger } from "@/lib/logger";

export type ErrorCode =
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PAYMENT"
  | "INTERNAL";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  // Message safe to show a user. `message` (from Error) is the internal detail.
  readonly clientMessage: string;
  // Optional structured context for logs (never sent to the client).
  readonly context?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    httpStatus: number,
    clientMessage: string,
    internalMessage?: string,
    context?: Record<string, unknown>,
  ) {
    super(internalMessage || clientMessage);
    this.name = new.target.name;
    this.code = code;
    this.httpStatus = httpStatus;
    this.clientMessage = clientMessage;
    this.context = context;
  }
}

export class ValidationError extends AppError {
  // Field-level messages, e.g. { price: "Must be greater than 0" }.
  readonly fields?: Record<string, string>;
  constructor(clientMessage = "Please check the highlighted fields.", fields?: Record<string, string>) {
    super("VALIDATION", 400, clientMessage);
    this.fields = fields;
  }
}

export class UnauthenticatedError extends AppError {
  constructor(clientMessage = "Please sign in to continue.") {
    super("UNAUTHENTICATED", 401, clientMessage);
  }
}

export class ForbiddenError extends AppError {
  constructor(clientMessage = "You don't have permission to do that.") {
    super("FORBIDDEN", 403, clientMessage);
  }
}

export class NotFoundError extends AppError {
  constructor(clientMessage = "Not found.") {
    super("NOT_FOUND", 404, clientMessage);
  }
}

export class ConflictError extends AppError {
  constructor(clientMessage = "That conflicts with existing data.", internal?: string) {
    super("CONFLICT", 409, clientMessage, internal);
  }
}

export class RateLimitError extends AppError {
  readonly retryAfterSeconds: number;
  constructor(retryAfterSeconds: number, clientMessage = "Too many requests. Please slow down.") {
    super("RATE_LIMITED", 429, clientMessage);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class PaymentError extends AppError {
  constructor(clientMessage = "We couldn't process that payment.", internal?: string, context?: Record<string, unknown>) {
    super("PAYMENT", 402, clientMessage, internal, context);
  }
}

// Convert any caught value into a safe ActionResult. Known AppErrors pass their
// client message through; everything else is logged and generalized.
export function handleActionError(e: unknown, where: string): Err {
  if (e instanceof AppError) {
    // Expected/known failures: log at warn, return the safe message + code.
    logger.warn(`${where}: ${e.code}`, { message: e.message, context: e.context });
    return fail(e.clientMessage, e.code);
  }
  logger.error(`${where}: unhandled`, { error: e instanceof Error ? e.stack || e.message : String(e) });
  return fail("Something went wrong. Please try again.", "INTERNAL");
}

// Map an AppError (or unknown) to an HTTP status + body for route handlers.
export function toHttpError(e: unknown, where: string): { status: number; body: { error: string; code: ErrorCode } } {
  if (e instanceof AppError) {
    logger.warn(`${where}: ${e.code}`, { message: e.message });
    return { status: e.httpStatus, body: { error: e.clientMessage, code: e.code } };
  }
  logger.error(`${where}: unhandled`, { error: e instanceof Error ? e.stack || e.message : String(e) });
  return { status: 500, body: { error: "Internal server error.", code: "INTERNAL" } };
}
