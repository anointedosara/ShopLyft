import { z } from "zod";
import { ValidationError } from "@/lib/errors";

// Validation layer. Server Actions are reachable via direct POST, so the input
// type is a lie until it's parsed — every mutation boundary should run its
// payload through a schema here rather than trusting the TypeScript signature.
//
// `parseInput` turns a Zod failure into a typed ValidationError carrying
// field-level messages, so the web boundary can surface them uniformly.

export function parseInput<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_";
      if (!(key in fields)) fields[key] = issue.message;
    }
    throw new ValidationError("Please check the highlighted fields.", fields);
  }
  return result.data;
}

// ── Shared field builders ────────────────────────────────────────────────────
export const zId = z.string().min(1).max(64);
export const zName = z.string().trim().min(2, "Enter at least 2 characters").max(120);
export const zEmail = z.string().trim().toLowerCase().email("Enter a valid email");
export const zNaira = z.number().int("Amount must be whole Naira").nonnegative();
export const zQty = z.number().int().positive("Quantity must be at least 1").max(999, "Quantity too large");

// ── Order / checkout ─────────────────────────────────────────────────────────
export const orderItemSchema = z.object({
  productId: zId,
  qty: zQty,
});

export const newOrderSchema = z.object({
  name: zName,
  address: z.string().trim().min(5, "Enter your full delivery address").max(500),
  items: z.array(orderItemSchema).min(1, "Your cart is empty").max(100, "Too many items in one order"),
});

// ── Store / seller onboarding ────────────────────────────────────────────────
export const becomeSellerSchema = z.object({
  name: zName,
  description: z.string().trim().max(500).optional(),
});

export const updateStoreSchema = z.object({
  name: zName,
  description: z.string().trim().max(500).optional().or(z.literal("")),
  logo: z.string().trim().url("Logo must be a valid URL").max(500).optional().or(z.literal("")),
});

// ── Seller Center: wallet / coupons ──────────────────────────────────────────
export const withdrawalSchema = z.object({
  amount: z.number().int("Enter a whole amount").positive("Enter an amount greater than 0").max(100_000_000),
});

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "At least 3 characters")
    .max(24)
    .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, - and _ only"),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().int().positive("Enter a value greater than 0"),
  minSpend: z.number().int().nonnegative().nullish(),
  maxUses: z.number().int().positive().nullish(),
  perUserLimit: z.number().int().positive().nullish(),
  startsAt: z.coerce.date().nullish(),
  expiresAt: z.coerce.date().nullish(),
  active: z.boolean().optional(),
});

// ── Seller Center: settings / shipping / tax ─────────────────────────────────
export const storeSettingsSchema = z.object({
  processingDays: z.number().int().min(0).max(60),
  returnWindowDays: z.number().int().min(0).max(90),
  autoAcceptReturns: z.boolean(),
  supportEmail: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  supportPhone: z.string().trim().max(20).optional().or(z.literal("")),
  payoutBankName: z.string().trim().max(80).optional().or(z.literal("")),
  payoutAccountName: z.string().trim().max(120).optional().or(z.literal("")),
  vacationMode: z.boolean(),
});

export const shippingZoneSchema = z.object({
  name: z.string().trim().min(2, "At least 2 characters").max(60),
  regions: z.array(z.string().trim().min(1)).min(1, "Add at least one region").max(37),
});

export const shippingRateSchema = z.object({
  zoneId: zId,
  method: z.enum(["STANDARD", "EXPRESS", "PICKUP"]),
  price: z.number().int().nonnegative(),
  freeOver: z.number().int().positive().nullish(),
  minDays: z.number().int().min(0).max(60),
  maxDays: z.number().int().min(0).max(90),
});

export const taxRateSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(40),
  region: z.string().trim().max(60).optional().or(z.literal("")),
  percent: z.number().min(0).max(100),
  inclusive: z.boolean(),
  active: z.boolean(),
});

// ── Returns ───────────────────────────────────────────────────────────────────
export const returnTransitionSchema = z.object({
  next: z.enum(["APPROVED", "REJECTED", "IN_TRANSIT", "RECEIVED", "REFUNDED", "CANCELLED"]),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  refundAmount: z.number().int().positive().nullish(),
});

// ── Profile ──────────────────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  name: zName,
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  image: z.string().trim().url("Image must be a valid URL").max(500).optional().or(z.literal("")),
});
