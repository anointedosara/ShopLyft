"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/rbac";
import { transitionReturn } from "@/lib/returns";
import { parseInput, returnTransitionSchema } from "@/lib/validation";
import { handleActionError } from "@/lib/errors";

type Result = { ok: true } | { ok: false; error: string; code?: string };

// Seller transitions one of their store's returns (approve/reject/receive/refund).
// The state machine + store scoping live in the service.
export async function transitionReturnAction(returnId: string, input: unknown): Promise<Result> {
  const { user, store } = await requireSeller();
  try {
    const d = parseInput(returnTransitionSchema, input);
    await transitionReturn(store.id, returnId, d.next, {
      note: d.note && d.note.trim() ? d.note.trim() : null,
      refundAmount: d.refundAmount ?? null,
      resolvedById: user.id,
    });
    revalidatePath("/seller/returns");
    return { ok: true };
  } catch (e) {
    return handleActionError(e, "transitionReturnAction");
  }
}
