"use server";

import { headers } from "next/headers";
import { getSessionUser, createOrderForUser, checkStock, type NewOrderInput, type StockIssue } from "@/lib/orders";
import { initializeTransaction } from "@/lib/paystack";

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
export async function startPaymentAction(input: NewOrderInput): Promise<StartPaymentResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in to place your order." };

  if (!input.items?.length) return { ok: false, error: "Your cart is empty." };
  if (!input.name?.trim() || !input.address?.trim()) {
    return { ok: false, error: "Please provide your name and delivery address." };
  }

  // Block checkout if anything in the cart is sold out or short on stock.
  const issues = await checkStock(input.items);
  if (issues.length) return { ok: false, error: stockErrorMessage(issues) };

  let order;
  try {
    order = await createOrderForUser(user.id, {
      name: input.name.trim(),
      address: input.address.trim(),
      items: input.items,
    });
  } catch {
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
  } catch {
    return { ok: false, error: "Could not start payment. Please try again." };
  }
}
