"use server";

import { headers } from "next/headers";
import { getSessionUser, createOrderForUser, checkStock, type StockIssue } from "@/lib/orders";
import { initializeTransaction } from "@/lib/paystack";
import { parseInput, newOrderSchema } from "@/lib/validation";
import { ValidationError } from "@/lib/errors";
import { rateLimit, RatePolicy } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

type StartPaymentResult = { ok: true; authorizationUrl: string } | { ok: false; error: string };

// Lets the cart/checkout UI show live stock state without exposing the DB layer
// to the client. Returns only the problem lines (sold out / not enough left).
export async function checkCartStockAction(
  items: { productId: string; qty: number }[]
): Promise<StockIssue[]> {
  if (!items?.length) return [];
  return checkStock(items);
}

function stockErrorMessage(issues: StockIssue[]): string {
  const parts = issues.map((i) =>
    i.available <= 0 ? `${i.name} is sold out` : `only ${i.available} left of ${i.name}`
  );
  return `Some items are no longer available: ${parts.join(", ")}. Update your cart and try again.`;
}

// Creates a PENDING order (DB-authoritative pricing) and starts a Paystack
// transaction for it, returning the URL the browser should redirect to.
// `input` is typed `unknown`: this is a POST-reachable boundary, so the payload
// is validated with Zod before anything trusts its shape (a tampered client
// could otherwise send `{ items: "x" }` past a naive `.length` check).
export async function startPaymentAction(input: unknown): Promise<StartPaymentResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in to place your order." };

  // Rate limit checkout per user — caps order/payment-init spam.
  const rl = await rateLimit(`checkout:${user.id}`, RatePolicy.mutation);
  if (!rl.allowed) return { ok: false, error: "Too many attempts. Please wait a moment and try again." };

  let data;
  try {
    data = parseInput(newOrderSchema, input);
  } catch (e) {
    if (e instanceof ValidationError) return { ok: false, error: e.clientMessage };
    return { ok: false, error: "Invalid order details." };
  }

  // Block checkout if anything in the cart is sold out or short on stock.
  const issues = await checkStock(data.items);
  if (issues.length) return { ok: false, error: stockErrorMessage(issues) };

  let order;
  try {
    order = await createOrderForUser(user.id, {
      name: data.name,
      address: data.address,
      items: data.items,
    });
  } catch (e) {
    logger.error("startPaymentAction: order creation failed", {
      userId: user.id,
      error: e instanceof Error ? e.message : String(e),
    });
    return { ok: false, error: "Something went wrong creating your order. Please try again." };
  }

  try {
    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    const origin = `${proto}://${host}`;

    const init = await initializeTransaction({
      email: user.email,
      amountKobo: order.total * 100,
      reference: order.id,
      callbackUrl: `${origin}/checkout/verify`,
      channels: ["card", "bank_transfer", "ussd"],
      metadata: { orderId: order.id, userId: user.id },
    });
    return { ok: true, authorizationUrl: init.authorization_url };
  } catch (e) {
    logger.error("startPaymentAction: payment init failed", {
      orderId: order.id,
      error: e instanceof Error ? e.message : String(e),
    });
    return { ok: false, error: "Could not start payment. Please try again." };
  }
}
