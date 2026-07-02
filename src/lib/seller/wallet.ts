import "server-only";
import { prisma } from "@/lib/db";
import { ValidationError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";

// Seller wallet service. Money is whole Naira. Every balance change is journaled
// in WalletTransaction with the resulting `available` balance, so the ledger is
// auditable and reconstructable. Withdrawals debit `available` immediately (the
// funds are reserved) inside a transaction, so a double-submit can't over-draw.

export async function getOrCreateWallet(storeId: string) {
  const existing = await prisma.wallet.findUnique({ where: { storeId } });
  if (existing) return existing;
  return prisma.wallet.create({ data: { storeId } });
}

export type WalletSummary = {
  walletId: string;
  available: number;
  pending: number;
  currency: string;
  lifetimeEarned: number;
  withdrawn: number;
};

export async function getWalletSummary(storeId: string): Promise<WalletSummary> {
  const wallet = await getOrCreateWallet(storeId);
  const agg = await prisma.walletTransaction.groupBy({
    by: ["type"],
    where: { walletId: wallet.id },
    _sum: { amount: true },
  });
  let lifetimeEarned = 0;
  let withdrawn = 0;
  for (const g of agg) {
    const sum = g._sum.amount ?? 0;
    if (g.type === "SALE" || g.type === "RELEASE") lifetimeEarned += sum;
    if (g.type === "WITHDRAWAL") withdrawn += Math.abs(sum);
  }
  return {
    walletId: wallet.id,
    available: wallet.available,
    pending: wallet.pending,
    currency: wallet.currency,
    lifetimeEarned,
    withdrawn,
  };
}

export type Paged<T> = { items: T[]; nextCursor: string | null };

// Cursor-paginated ledger (newest first). Closes the "no pagination" finding for
// this list — we fetch limit+1 and use the extra row to compute the next cursor.
export async function listWalletTransactions(
  storeId: string,
  limit = 25,
  cursor?: string,
): Promise<Paged<{ id: string; type: string; amount: number; balanceAfter: number; note: string | null; createdAt: Date }>> {
  const wallet = await getOrCreateWallet(storeId);
  const rows = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, type: true, amount: true, balanceAfter: true, note: true, createdAt: true },
  });
  const nextCursor = rows.length > limit ? rows[limit - 1]!.id : null;
  return { items: rows.slice(0, limit), nextCursor };
}

export async function listWithdrawals(storeId: string) {
  return prisma.withdrawal.findMany({
    where: { storeId },
    orderBy: { requestedAt: "desc" },
    take: 50,
  });
}

// Credit a settled sale into the wallet's pending (escrow) balance. Called from
// the payment-settlement path (used by the trust/escrow workstream). Idempotent
// per order via the unique-ish note guard is the caller's responsibility; here we
// just journal atomically.
export async function creditSale(storeId: string, orderId: string, amount: number, note?: string) {
  if (amount <= 0) return;
  await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({
      where: { storeId },
      create: { storeId, pending: amount },
      update: { pending: { increment: amount } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "SALE",
        amount,
        balanceAfter: wallet.available, // available unchanged; sale lands in pending
        orderId,
        note: note ?? `Sale ${orderId.slice(-8).toUpperCase()}`,
      },
    });
  });
}

export type WithdrawalInput = {
  amount: number;
  bankName?: string | null;
  accountName?: string | null;
  accountLast4?: string | null;
};

export async function requestWithdrawal(storeId: string, input: WithdrawalInput) {
  const { amount } = input;
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { storeId } });
    if (!wallet) throw new NotFoundError("You don't have a wallet yet.");
    if (!Number.isInteger(amount) || amount <= 0) throw new ValidationError("Enter a valid amount.");
    if (amount > wallet.available) {
      throw new ValidationError("That exceeds your available balance.");
    }
    const newAvailable = wallet.available - amount;
    await tx.wallet.update({ where: { id: wallet.id }, data: { available: newAvailable } });
    const withdrawal = await tx.withdrawal.create({
      data: {
        walletId: wallet.id,
        storeId,
        amount,
        bankName: input.bankName ?? null,
        accountName: input.accountName ?? null,
        accountLast4: input.accountLast4 ?? null,
      },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "WITHDRAWAL",
        amount: -amount,
        balanceAfter: newAvailable,
        note: `Withdrawal request ${withdrawal.id.slice(-8).toUpperCase()}`,
      },
    });
    logger.info("wallet.requestWithdrawal", { storeId, amount, withdrawalId: withdrawal.id });
    return withdrawal;
  });
}
