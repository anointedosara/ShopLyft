import "server-only";
import { prisma } from "@/lib/db";
import { ValidationError, NotFoundError, ConflictError } from "@/lib/errors";
import type { CouponType } from "@prisma/client";

// Seller coupon service. All queries scoped by storeId so a seller can only ever
// touch their own coupons. Redemption limits are enforced server-side.

export type CouponInput = {
  code: string;
  type: CouponType;
  value: number;
  minSpend?: number | null;
  maxUses?: number | null;
  perUserLimit?: number | null;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  active?: boolean;
};

function assertValid(input: CouponInput) {
  if (input.type === "PERCENT" && (input.value < 1 || input.value > 100)) {
    throw new ValidationError("Percentage must be between 1 and 100.", { value: "1–100 for a percentage" });
  }
  if (input.type === "FIXED" && input.value < 1) {
    throw new ValidationError("Fixed discount must be at least ₦1.", { value: "Must be at least ₦1" });
  }
  if (input.expiresAt && input.startsAt && input.expiresAt <= input.startsAt) {
    throw new ValidationError("Expiry must be after the start date.", { expiresAt: "Must be after start" });
  }
}

export async function listCoupons(storeId: string) {
  return prisma.coupon.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  });
}

export async function createCoupon(storeId: string, input: CouponInput) {
  assertValid(input);
  const code = input.code.trim().toUpperCase();
  const existing = await prisma.coupon.findUnique({ where: { storeId_code: { storeId, code } } });
  if (existing) throw new ConflictError("You already have a coupon with that code.");
  return prisma.coupon.create({
    data: {
      storeId,
      code,
      type: input.type,
      value: input.value,
      minSpend: input.minSpend ?? null,
      maxUses: input.maxUses ?? null,
      perUserLimit: input.perUserLimit ?? null,
      startsAt: input.startsAt ?? null,
      expiresAt: input.expiresAt ?? null,
      active: input.active ?? true,
    },
  });
}

export async function updateCoupon(storeId: string, couponId: string, input: CouponInput) {
  assertValid(input);
  // Ownership check baked into the where clause.
  const owned = await prisma.coupon.findFirst({ where: { id: couponId, storeId }, select: { id: true } });
  if (!owned) throw new NotFoundError("Coupon not found.");
  const code = input.code.trim().toUpperCase();
  return prisma.coupon.update({
    where: { id: couponId },
    data: {
      code,
      type: input.type,
      value: input.value,
      minSpend: input.minSpend ?? null,
      maxUses: input.maxUses ?? null,
      perUserLimit: input.perUserLimit ?? null,
      startsAt: input.startsAt ?? null,
      expiresAt: input.expiresAt ?? null,
      active: input.active ?? true,
    },
  });
}

export async function setCouponActive(storeId: string, couponId: string, active: boolean) {
  const res = await prisma.coupon.updateMany({ where: { id: couponId, storeId }, data: { active } });
  if (res.count === 0) throw new NotFoundError("Coupon not found.");
}

export async function deleteCoupon(storeId: string, couponId: string) {
  const res = await prisma.coupon.deleteMany({ where: { id: couponId, storeId } });
  if (res.count === 0) throw new NotFoundError("Coupon not found.");
}

// Validate a code against an order subtotal for a given buyer, returning the
// discount in Naira. Enforces window, active flag, min spend, and usage caps.
// This is the authoritative check the checkout flow calls (never trust a
// client-computed discount).
export async function evaluateCoupon(
  storeId: string,
  code: string,
  subtotal: number,
  userId: string,
): Promise<{ discount: number; couponId: string }> {
  const coupon = await prisma.coupon.findUnique({
    where: { storeId_code: { storeId, code: code.trim().toUpperCase() } },
  });
  if (!coupon || !coupon.active) throw new ValidationError("That coupon code isn't valid.");

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new ValidationError("That coupon isn't active yet.");
  if (coupon.expiresAt && coupon.expiresAt < now) throw new ValidationError("That coupon has expired.");
  if (coupon.minSpend && subtotal < coupon.minSpend) {
    throw new ValidationError("Your order doesn't meet this coupon's minimum spend.");
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    throw new ValidationError("This coupon has reached its usage limit.");
  }
  if (coupon.perUserLimit != null) {
    const used = await prisma.couponRedemption.count({ where: { couponId: coupon.id, userId } });
    if (used >= coupon.perUserLimit) throw new ValidationError("You've already used this coupon.");
  }

  const discount =
    coupon.type === "PERCENT" ? Math.floor((subtotal * coupon.value) / 100) : Math.min(coupon.value, subtotal);
  return { discount, couponId: coupon.id };
}
