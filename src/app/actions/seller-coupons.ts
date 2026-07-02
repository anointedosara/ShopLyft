"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/rbac";
import { createCoupon, updateCoupon, deleteCoupon, setCouponActive, type CouponInput } from "@/lib/seller/coupons";
import { parseInput, couponSchema } from "@/lib/validation";
import { handleActionError } from "@/lib/errors";
import type { z } from "zod";

type Result = { ok: true } | { ok: false; error: string; code?: string };

// Normalise the parsed schema (which allows undefined) into the service's
// null-based shape.
function toInput(data: z.infer<typeof couponSchema>): CouponInput {
  return {
    code: data.code,
    type: data.type,
    value: data.value,
    minSpend: data.minSpend ?? null,
    maxUses: data.maxUses ?? null,
    perUserLimit: data.perUserLimit ?? null,
    startsAt: data.startsAt ?? null,
    expiresAt: data.expiresAt ?? null,
    active: data.active,
  };
}

export async function createCouponAction(input: unknown): Promise<Result> {
  const { store } = await requireSeller();
  try {
    const data = parseInput(couponSchema, input);
    await createCoupon(store.id, toInput(data));
    revalidatePath("/seller/coupons");
    return { ok: true };
  } catch (e) {
    return handleActionError(e, "createCouponAction");
  }
}

export async function updateCouponAction(couponId: string, input: unknown): Promise<Result> {
  const { store } = await requireSeller();
  try {
    const data = parseInput(couponSchema, input);
    await updateCoupon(store.id, couponId, toInput(data));
    revalidatePath("/seller/coupons");
    return { ok: true };
  } catch (e) {
    return handleActionError(e, "updateCouponAction");
  }
}

export async function toggleCouponAction(couponId: string, active: boolean): Promise<Result> {
  const { store } = await requireSeller();
  try {
    await setCouponActive(store.id, couponId, active);
    revalidatePath("/seller/coupons");
    return { ok: true };
  } catch (e) {
    return handleActionError(e, "toggleCouponAction");
  }
}

export async function deleteCouponAction(couponId: string): Promise<Result> {
  const { store } = await requireSeller();
  try {
    await deleteCoupon(store.id, couponId);
    revalidatePath("/seller/coupons");
    return { ok: true };
  } catch (e) {
    return handleActionError(e, "deleteCouponAction");
  }
}
