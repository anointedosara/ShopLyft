"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/rbac";
import { requestWithdrawal } from "@/lib/seller/wallet";
import { parseInput, withdrawalSchema } from "@/lib/validation";
import { handleActionError } from "@/lib/errors";
import { rateLimit, RatePolicy } from "@/lib/rate-limit";
import { fail } from "@/lib/result";

type WithdrawResult = { ok: true; id: string } | { ok: false; error: string; code?: string };

// Requests a payout of `amount` (whole Naira) from the seller's available wallet
// balance. Permission-gated via requireSeller; the balance debit happens
// atomically in requestWithdrawal so a double-submit can't over-draw.
export async function requestWithdrawalAction(input: unknown): Promise<WithdrawResult> {
  const { store } = await requireSeller();

  const rl = await rateLimit(`withdraw:${store.id}`, RatePolicy.mutation);
  if (!rl.allowed) return fail("Too many requests. Please wait a moment and try again.");

  try {
    const data = parseInput(withdrawalSchema, input);
    const withdrawal = await requestWithdrawal(store.id, { amount: data.amount });
    revalidatePath("/seller/wallet");
    return { ok: true, id: withdrawal.id };
  } catch (e) {
    return handleActionError(e, "requestWithdrawalAction");
  }
}
