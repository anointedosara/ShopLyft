import crypto from "crypto";
import { markOrderPaid } from "@/lib/orders";
import { verifyTransaction } from "@/lib/paystack";
import { logger } from "@/lib/logger";
import { rateLimit, RatePolicy, clientIp } from "@/lib/rate-limit";

// Production source of truth for payment confirmation. Paystack POSTs charge
// events here, signed with HMAC-SHA512 of the raw body using the secret key.
//
// Idempotency: settlement is deduped by order status inside markOrderPaid (the
// webhook and the client callback can both fire), and the amount is verified
// there against the order total — an amount that doesn't match is refused and
// logged at error level as a potential tampering/fraud signal.

const EXPECTED_CURRENCY = process.env.PAYSTACK_CURRENCY || "NGN";

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
  // A missing secret must never accept a forged-but-consistent HMAC.
  if (!secret) {
    logger.error("paystack.webhook: PAYSTACK_SECRET_KEY not configured");
    return new Response("Webhook not configured", { status: 503 });
  }

  // Defense-in-depth flood protection. The signature already gates authenticity;
  // this caps how hard an attacker (or a misconfigured retrier) can hammer us.
  const ip = clientIp(request.headers);
  const rl = await rateLimit(`webhook:paystack:${ip}`, RatePolicy.webhook);
  if (!rl.allowed) {
    logger.warn("paystack.webhook: rate limited", { ip, retryAfter: rl.retryAfterSeconds });
    return new Response("Too many requests", { status: 429 });
  }

  const body = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  const expected = crypto.createHmac("sha512", secret).update(body).digest();
  const provided = Buffer.from(signature ?? "", "hex");
  // Constant-time compare (after a length check, which timingSafeEqual requires).
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    logger.warn("paystack.webhook: invalid signature", { ip });
    return new Response("Invalid signature", { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string; currency?: string } };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  // Only charge.success drives settlement. Ack anything else so Paystack stops
  // retrying events we intentionally ignore.
  if (event.event !== "charge.success" || !event.data?.reference) {
    return new Response("ok", { status: 200 });
  }

  const reference = event.data.reference;
  try {
    // Re-verify with Paystack rather than trusting the payload beyond its signature.
    const verification = await verifyTransaction(reference);
    if (!verification || verification.status !== "success") {
      logger.warn("paystack.webhook: verification not successful", { reference, status: verification?.status });
      return new Response("ok", { status: 200 });
    }
    // Guard against a settlement in an unexpected currency (amount comparison
    // downstream assumes kobo of the expected currency).
    if (verification.currency && verification.currency !== EXPECTED_CURRENCY) {
      logger.error("paystack.webhook: unexpected currency", { reference, currency: verification.currency });
      return new Response("ok", { status: 200 });
    }

    const result = await markOrderPaid(reference, reference, verification.amount);
    if (!result.ok) {
      // amount_mismatch means the paid amount != the order total — refuse and
      // alert (security-relevant). not_found means we have no such order.
      // Both are deterministic, so retrying won't help — ack, but log loudly.
      const level = result.reason === "amount_mismatch" ? "error" : "warn";
      logger[level]("paystack.webhook: settlement refused", {
        reference,
        reason: result.reason,
        paidAmountKobo: verification.amount,
      });
      return new Response("ok", { status: 200 });
    }

    logger.info("paystack.webhook: order settled", { reference, alreadyPaid: result.alreadyPaid });
    return new Response("ok", { status: 200 });
  } catch (e) {
    // Transient failure (DB/network/Paystack) — return 500 so Paystack retries
    // this event later instead of us dropping a real payment on the floor.
    logger.error("paystack.webhook: processing error", {
      reference,
      error: e instanceof Error ? e.message : String(e),
    });
    return new Response("Processing error", { status: 500 });
  }
}
