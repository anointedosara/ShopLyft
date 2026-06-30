import "server-only";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { syncStoreApproval } from "@/lib/kyc";
import type { SellerStatus, VerificationAction } from "@prisma/client";

// Admin review layer for seller verifications. Every state change runs in a
// transaction that keeps three things consistent: the verification status, the
// legacy Store.approved gate (via syncStoreApproval), and the append-only
// VerificationHistory audit trail. Side effects that aren't part of the atomic
// truth (notifications, emails) are fired by the action layer after commit.

// Statuses that need an admin's attention, newest submissions first.
export const REVIEW_QUEUE: SellerStatus[] = ["PENDING_REVIEW", "UNDER_REVIEW"];

const ALL_STATUSES: SellerStatus[] = [
  "DRAFT",
  "PENDING_REVIEW",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
];

export async function getStatusCounts(): Promise<Record<SellerStatus, number>> {
  const rows = await prisma.sellerVerification.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<SellerStatus, number>;
  for (const r of rows) counts[r.status] = r._count._all;
  return counts;
}

// Queue / list. `filter` is a single status, "queue" (needs attention), or "all".
export async function listVerifications(filter: SellerStatus | "all" | "queue" = "queue") {
  const where =
    filter === "all" ? {} : filter === "queue" ? { status: { in: REVIEW_QUEUE } } : { status: filter };

  return prisma.sellerVerification.findMany({
    where,
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      status: true,
      submittedAt: true,
      createdAt: true,
      store: {
        select: {
          name: true,
          slug: true,
          _count: { select: { products: true } },
          owner: { select: { name: true, email: true } },
        },
      },
      profile: { select: { fullLegalName: true, businessType: true } },
    },
  });
}

function decryptSafe(payload: string | null | undefined): string | null {
  if (!payload) return null;
  try {
    return decrypt(payload);
  } catch {
    // Key rotated or corrupt ciphertext — never break the admin view over it.
    return null;
  }
}

// Shows only the last 4 digits of a sensitive number to the admin.
function maskTail(value: string | null, visible = 4): string | null {
  if (!value) return null;
  const tail = value.slice(-visible);
  return `•••• ${tail}`;
}

// Full application for the detail page: profile, store + owner, documents, the
// audit history and internal notes (each with the acting admin), plus the
// decrypted-and-masked sensitive numbers.
export async function getVerificationDetail(id: string) {
  const v = await prisma.sellerVerification.findUnique({
    where: { id },
    include: {
      profile: true,
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          approved: true,
          createdAt: true,
          _count: { select: { products: true } },
          owner: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
        },
      },
      documents: { orderBy: { uploadedAt: "asc" } },
      history: { orderBy: { createdAt: "desc" }, include: { admin: { select: { name: true, email: true } } } },
      notes: { orderBy: { createdAt: "desc" }, include: { admin: { select: { name: true, email: true } } } },
    },
  });
  if (!v) return null;

  return {
    ...v,
    sensitive: {
      idNumber: maskTail(decryptSafe(v.profile.idNumberEnc)),
      accountNumber: maskTail(decryptSafe(v.profile.accountNumberEnc)),
    },
  };
}

// ── State transitions ───────────────────────────────────────────────────────

export type TransitionResult =
  | { ok: true; sellerUserId: string | null; sellerEmail: string | null; storeName: string; newStatus: SellerStatus }
  | { ok: false; reason: "not_found" | "invalid_transition" };

async function transition(opts: {
  id: string;
  adminId: string;
  action: VerificationAction;
  from: SellerStatus[]; // statuses this transition is legal from
  newStatus: SellerStatus;
  reason?: string | null; // pass null to clear; undefined to leave unchanged
  requestedInfo?: string | null;
}): Promise<TransitionResult> {
  return prisma.$transaction(async (tx) => {
    const v = await tx.sellerVerification.findUnique({
      where: { id: opts.id },
      select: {
        status: true,
        storeId: true,
        store: { select: { name: true, ownerId: true, owner: { select: { email: true } } } },
      },
    });
    if (!v) return { ok: false as const, reason: "not_found" as const };
    if (!opts.from.includes(v.status)) return { ok: false as const, reason: "invalid_transition" as const };

    const previousStatus = v.status;
    await tx.sellerVerification.update({
      where: { id: opts.id },
      data: {
        status: opts.newStatus,
        reviewedAt: new Date(),
        reviewedById: opts.adminId,
        ...(opts.reason !== undefined ? { rejectionReason: opts.reason } : {}),
        ...(opts.requestedInfo !== undefined ? { requestedInfo: opts.requestedInfo } : {}),
      },
    });
    await syncStoreApproval(v.storeId, opts.newStatus, tx);
    await tx.verificationHistory.create({
      data: {
        verificationId: opts.id,
        adminId: opts.adminId,
        action: opts.action,
        reason: opts.reason ?? opts.requestedInfo ?? null,
        previousStatus,
        newStatus: opts.newStatus,
      },
    });

    return {
      ok: true as const,
      sellerUserId: v.store.ownerId,
      sellerEmail: v.store.owner?.email ?? null,
      storeName: v.store.name,
      newStatus: opts.newStatus,
    };
  });
}

export function startReview(adminId: string, id: string) {
  return transition({ id, adminId, action: "UNDER_REVIEW", from: ["PENDING_REVIEW"], newStatus: "UNDER_REVIEW" });
}

export function approveVerification(adminId: string, id: string) {
  return transition({
    id,
    adminId,
    action: "APPROVED",
    from: ["PENDING_REVIEW", "UNDER_REVIEW", "REJECTED", "SUSPENDED"],
    newStatus: "APPROVED",
    reason: null, // clear any prior rejection reason / requested info
    requestedInfo: null,
  });
}

export function rejectVerification(adminId: string, id: string, reason: string) {
  return transition({
    id,
    adminId,
    action: "REJECTED",
    from: ["PENDING_REVIEW", "UNDER_REVIEW"],
    newStatus: "REJECTED",
    reason,
  });
}

export function requestInfo(adminId: string, id: string, message: string) {
  return transition({
    id,
    adminId,
    action: "INFO_REQUESTED",
    from: ["PENDING_REVIEW", "UNDER_REVIEW"],
    newStatus: "UNDER_REVIEW",
    requestedInfo: message,
  });
}

export function suspendVerification(adminId: string, id: string, reason: string) {
  return transition({ id, adminId, action: "SUSPENDED", from: ["APPROVED"], newStatus: "SUSPENDED", reason });
}

export function reinstateVerification(adminId: string, id: string) {
  return transition({ id, adminId, action: "APPROVED", from: ["SUSPENDED"], newStatus: "APPROVED", reason: null });
}

// Internal-only note. No status change, but recorded in the audit trail.
export async function addNote(adminId: string, id: string, body: string) {
  const v = await prisma.sellerVerification.findUnique({ where: { id }, select: { status: true } });
  if (!v) return { ok: false as const, reason: "not_found" as const };
  await prisma.$transaction([
    prisma.adminNote.create({ data: { verificationId: id, adminId, body } }),
    prisma.verificationHistory.create({
      data: { verificationId: id, adminId, action: "NOTE_ADDED", previousStatus: v.status, newStatus: v.status },
    }),
  ]);
  return { ok: true as const };
}
