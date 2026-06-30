import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// Server-side order layer. Orders are owned by the DB and tied to the signed-in
// user. Prices/names are read from the DB at order time — the client only sends
// product ids + quantities, never prices, so a tampered cart can't change cost.

export const DELIVERY_FEE = 1500;
export const FREE_DELIVERY_OVER = 50000;

export function deliveryFor(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_OVER || subtotal === 0 ? 0 : DELIVERY_FEE;
}

export type NewOrderInput = {
  name: string;
  address: string;
  items: { productId: string; qty: number }[];
};

export type StockIssue = { productId: string; name: string; available: number; requested: number };

// Validates requested quantities against live stock. Returns the lines that
// can't be fulfilled — sold out (available 0) or not enough left. Products with
// null stockLeft are untracked (treated as unlimited) and never flagged.
export async function checkStock(items: { productId: string; qty: number }[]): Promise<StockIssue[]> {
  const ids = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, stockLeft: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const issues: StockIssue[] = [];
  for (const item of items) {
    const p = byId.get(item.productId);
    if (!p || p.stockLeft == null) continue; // unknown items are dropped at order time; null = untracked
    const requested = Math.max(1, Math.floor(item.qty));
    if (p.stockLeft < requested) {
      issues.push({ productId: p.id, name: p.name, available: p.stockLeft, requested });
    }
  }
  return issues;
}

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function createOrderForUser(userId: string, input: NewOrderInput) {
  const ids = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, price: true, storeId: true, stockLeft: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  // Rebuild every line from DB data; drop anything that no longer exists.
  // storeId is snapshotted onto the line so each seller can later see and
  // fulfil the items that belong to their store. Quantities are clamped to the
  // available stock (sold-out lines fall away) so an order can never exceed it —
  // a backstop in case stock changed after the checkout-time check.
  const lines = input.items
    .map((i) => {
      const p = byId.get(i.productId);
      if (!p) return null;
      const requested = Math.max(1, Math.floor(i.qty));
      const qty = p.stockLeft != null ? Math.min(requested, p.stockLeft) : requested;
      return qty > 0 ? { productId: p.id, name: p.name, price: p.price, storeId: p.storeId, qty } : null;
    })
    .filter((l): l is { productId: string; name: string; price: number; storeId: string; qty: number } => l !== null);

  if (lines.length === 0) throw new Error("No valid items to order");

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const total = subtotal + deliveryFor(subtotal);

  return prisma.order.create({
    data: {
      userId,
      status: "PENDING", // becomes PAID once Paystack confirms (Milestone 4)
      total,
      name: input.name,
      address: input.address,
      items: { create: lines },
    },
    include: { items: true },
  });
}

export async function getUserOrders() {
  const user = await getSessionUser();
  if (!user) return [];
  return prisma.order.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrder(id: string) {
  const user = await getSessionUser();
  if (!user) return null;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  // Ownership check: never expose another user's order.
  if (!order || order.userId !== user.id) return null;
  return order;
}

// Flip an order to PAID after Paystack confirms. Safe to call repeatedly (webhook
// + callback can both fire) — stock is only decremented on the first transition.
export async function markOrderPaid(orderId: string, paystackRef: string, paidAmountKobo?: number) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return { ok: false as const, reason: "not_found" as const };

    // Guard against an amount that doesn't match what we expected to charge.
    if (paidAmountKobo != null && paidAmountKobo !== order.total * 100) {
      return { ok: false as const, reason: "amount_mismatch" as const };
    }

    // Already settled — no-op (idempotent).
    if (order.status === "PAID" || order.status === "FULFILLED") {
      return { ok: true as const, alreadyPaid: true, order };
    }

    // Decrement stock for items that track it.
    for (const item of order.items) {
      await tx.product.updateMany({
        where: { id: item.productId, stockLeft: { not: null } },
        data: { stockLeft: { decrement: item.qty } },
      });
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: "PAID", paystackRef },
      include: { items: true },
    });
    return { ok: true as const, alreadyPaid: false, order: updated };
  });
}
