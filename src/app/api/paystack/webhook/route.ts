import crypto from "crypto";
import { markOrderPaid } from "@/lib/orders";
import { verifyTransaction } from "@/lib/paystack";

// Production source of truth for payment confirmation. Paystack POSTs charge
// events here, signed with HMAC-SHA512 of the raw body using the secret key.
export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
  // A missing secret must never accept a forged-but-consistent HMAC.
  if (!secret) {
    return new Response("Webhook not configured", { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  const expected = crypto.createHmac("sha512", secret).update(body).digest();
  const provided = Buffer.from(signature ?? "", "hex");
  // Constant-time compare (after a length check, which timingSafeEqual requires).
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    const reference = event.data.reference;
    // Re-verify with Paystack rather than trusting the payload beyond its signature.
    const verification = await verifyTransaction(reference);
    if (verification?.status === "success") {
      await markOrderPaid(reference, reference, verification.amount);
    }
  }

  // Always 200 so Paystack doesn't keep retrying for events we ignore.
  return new Response("ok", { status: 200 });
}
