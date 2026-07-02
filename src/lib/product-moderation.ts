import "server-only";
import { prisma } from "@/lib/db";
import type { ProductStatus } from "@prisma/client";

// Admin moderation layer for seller products (mirrors lib/admin.ts for stores).
// A product transition is a single-row status change, so a plain update is
// enough — no multi-table transaction needed. Each transition returns the
// seller's identity so the action layer can notify them after commit.

const ALL_STATUSES: ProductStatus[] = ["PENDING", "PUBLISHED", "REJECTED", "TAKEN_DOWN"];

export async function getProductStatusCounts(): Promise<Record<ProductStatus, number>> {
  const rows = await prisma.product.groupBy({ by: ["status"], _count: { _all: true } });
  const counts = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<ProductStatus, number>;
  for (const r of rows) counts[r.status] = r._count._all;
  return counts;
}

// Queue / list. `filter` is a single status or "all". PENDING is the review queue.
export async function listModerationProducts(filter: ProductStatus | "all" = "PENDING") {
  return prisma.product.findMany({
    where: filter === "all" ? {} : { status: filter },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      brand: true,
      price: true,
      oldPrice: true,
      image: true,
      status: true,
      moderationNote: true,
      createdAt: true,
      category: { select: { name: true } },
      store: {
        select: { name: true, slug: true, owner: { select: { id: true, name: true, email: true } } },
      },
    },
  });
}

export type ModerationResult =
  | { ok: true; sellerUserId: string | null; sellerEmail: string | null; productName: string; newStatus: ProductStatus }
  | { ok: false; reason: "not_found" | "invalid_transition" };

async function transition(opts: {
  productId: string;
  from: ProductStatus[]; // statuses this transition is legal from
  newStatus: ProductStatus;
  note?: string | null; // moderationNote; null clears, undefined leaves unchanged
}): Promise<ModerationResult> {
  const p = await prisma.product.findUnique({
    where: { id: opts.productId },
    select: { status: true, name: true, store: { select: { owner: { select: { id: true, email: true } } } } },
  });
  if (!p) return { ok: false, reason: "not_found" };
  if (!opts.from.includes(p.status)) return { ok: false, reason: "invalid_transition" };

  await prisma.product.update({
    where: { id: opts.productId },
    data: {
      status: opts.newStatus,
      reviewedAt: new Date(),
      ...(opts.note !== undefined ? { moderationNote: opts.note } : {}),
    },
  });

  return {
    ok: true,
    sellerUserId: p.store.owner?.id ?? null,
    sellerEmail: p.store.owner?.email ?? null,
    productName: p.name,
    newStatus: opts.newStatus,
  };
}

// Approve a held or previously-declined/pulled listing → goes live.
export function approveProduct(productId: string) {
  return transition({
    productId,
    from: ["PENDING", "REJECTED", "TAKEN_DOWN"],
    newStatus: "PUBLISHED",
    note: null, // clear any prior rejection note
  });
}

// Decline a held listing. Seller can edit & the next submit is reviewed again.
export function rejectProduct(productId: string, reason: string) {
  return transition({ productId, from: ["PENDING"], newStatus: "REJECTED", note: reason });
}

// Pull a live listing that shouldn't be for sale.
export function takeDownProduct(productId: string, reason: string) {
  return transition({ productId, from: ["PUBLISHED"], newStatus: "TAKEN_DOWN", note: reason });
}
