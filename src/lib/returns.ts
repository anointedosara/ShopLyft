import "server-only";
import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { ReturnStatus, ReturnReason } from "@prisma/client";

// Return/refund service. Shared by the Seller Center (its Returns queue), the
// Admin panel (refund requests) and the Logistics return workflow. Buyers create
// requests; sellers/admins transition them through a guarded state machine.

// Allowed forward transitions. Terminal states (REFUNDED/REJECTED/CANCELLED)
// have no outgoing edges.
const TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  REQUESTED: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["IN_TRANSIT", "RECEIVED", "REFUNDED", "CANCELLED"],
  IN_TRANSIT: ["RECEIVED", "CANCELLED"],
  RECEIVED: ["REFUNDED"],
  REFUNDED: [],
  REJECTED: [],
  CANCELLED: [],
};

export type CreateReturnInput = {
  orderId: string;
  reason: ReturnReason;
  detail?: string | null;
  photos?: string[];
  items: { orderItemId: string; qty: number }[];
};

// Buyer opens a return against their own paid order. The store is derived from
// the order's line items (single-store returns for now).
export async function createReturnRequest(buyerId: string, input: CreateReturnInput) {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, userId: buyerId },
    select: { id: true, status: true, items: { select: { id: true, storeId: true } } },
  });
  if (!order) throw new NotFoundError("Order not found.");
  if (order.status !== "PAID" && order.status !== "FULFILLED") {
    throw new ValidationError("Only paid orders can be returned.");
  }
  const ids = new Set(input.items.map((i) => i.orderItemId));
  const lines = order.items.filter((it) => ids.has(it.id));
  if (lines.length === 0) throw new ValidationError("Select at least one item to return.");
  const storeId = lines[0]!.storeId;
  if (!storeId) throw new ValidationError("These items can't be returned.");
  if (!lines.every((l) => l.storeId === storeId)) {
    throw new ValidationError("Please open a separate return per store.");
  }

  return prisma.returnRequest.create({
    data: {
      orderId: order.id,
      storeId,
      buyerId,
      reason: input.reason,
      detail: input.detail ?? null,
      photos: input.photos ?? [],
      items: { create: input.items.map((i) => ({ orderItemId: i.orderItemId, qty: i.qty })) },
    },
  });
}

export async function listStoreReturns(storeId: string, status?: ReturnStatus) {
  return prisma.returnRequest.findMany({
    where: { storeId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    include: { items: true, order: { select: { name: true } } },
    take: 100,
  });
}

export async function getStoreReturn(storeId: string, id: string) {
  return prisma.returnRequest.findFirst({
    where: { id, storeId },
    include: { items: true, order: { select: { name: true, address: true } } },
  });
}

export type TransitionOpts = { note?: string | null; refundAmount?: number | null; resolvedById?: string };

// Move a return to `next`, enforcing the state machine. Scoped to storeId so a
// seller can only act on their own store's returns.
export async function transitionReturn(
  storeId: string,
  id: string,
  next: ReturnStatus,
  opts: TransitionOpts = {},
) {
  const current = await prisma.returnRequest.findFirst({ where: { id, storeId }, select: { status: true } });
  if (!current) throw new NotFoundError("Return not found.");
  if (!TRANSITIONS[current.status].includes(next)) {
    throw new ValidationError(`Can't move a ${current.status.toLowerCase()} return to ${next.toLowerCase()}.`);
  }
  if (next === "REFUNDED" && (opts.refundAmount == null || opts.refundAmount <= 0)) {
    throw new ValidationError("Enter the refund amount.");
  }
  const updated = await prisma.returnRequest.update({
    where: { id },
    data: {
      status: next,
      resolutionNote: opts.note ?? undefined,
      refundAmount: next === "REFUNDED" ? opts.refundAmount : undefined,
      resolvedById: opts.resolvedById ?? undefined,
    },
  });
  logger.info("returns.transition", { id, from: current.status, to: next, storeId });
  return updated;
}
