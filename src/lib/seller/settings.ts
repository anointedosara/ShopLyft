import "server-only";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import type { ShippingMethod } from "@prisma/client";

// Store settings, shipping zones/rates and tax rates. Everything scoped by
// storeId with ownership baked into each write's where-clause.

export async function getStoreSettings(storeId: string) {
  const existing = await prisma.storeSettings.findUnique({ where: { storeId } });
  if (existing) return existing;
  return prisma.storeSettings.create({ data: { storeId } });
}

export type StoreSettingsInput = {
  processingDays: number;
  returnWindowDays: number;
  autoAcceptReturns: boolean;
  supportEmail?: string | null;
  supportPhone?: string | null;
  payoutBankName?: string | null;
  payoutAccountName?: string | null;
  vacationMode: boolean;
};

export async function updateStoreSettings(storeId: string, input: StoreSettingsInput) {
  return prisma.storeSettings.upsert({
    where: { storeId },
    create: { storeId, ...input },
    update: input,
  });
}

// ── Shipping ─────────────────────────────────────────────────────────────────
export async function listShippingZones(storeId: string) {
  return prisma.shippingZone.findMany({
    where: { storeId },
    orderBy: { createdAt: "asc" },
    include: { rates: { orderBy: { price: "asc" } } },
  });
}

export async function createShippingZone(storeId: string, name: string, regions: string[]) {
  return prisma.shippingZone.create({ data: { storeId, name: name.trim(), regions } });
}

export async function deleteShippingZone(storeId: string, zoneId: string) {
  const res = await prisma.shippingZone.deleteMany({ where: { id: zoneId, storeId } });
  if (res.count === 0) throw new NotFoundError("Zone not found.");
}

export type ShippingRateInput = {
  method: ShippingMethod;
  price: number;
  freeOver?: number | null;
  minDays: number;
  maxDays: number;
};

export async function addShippingRate(storeId: string, zoneId: string, input: ShippingRateInput) {
  // Verify the zone belongs to this store before attaching a rate.
  const zone = await prisma.shippingZone.findFirst({ where: { id: zoneId, storeId }, select: { id: true } });
  if (!zone) throw new NotFoundError("Zone not found.");
  return prisma.shippingRate.create({ data: { zoneId, ...input, freeOver: input.freeOver ?? null } });
}

export async function deleteShippingRate(storeId: string, rateId: string) {
  // Ensure the rate's zone belongs to this store.
  const rate = await prisma.shippingRate.findFirst({
    where: { id: rateId, zone: { storeId } },
    select: { id: true },
  });
  if (!rate) throw new NotFoundError("Rate not found.");
  await prisma.shippingRate.delete({ where: { id: rateId } });
}

// ── Tax ──────────────────────────────────────────────────────────────────────
export async function listTaxRates(storeId: string) {
  return prisma.taxRate.findMany({ where: { storeId }, orderBy: { name: "asc" } });
}

export type TaxRateInput = {
  name: string;
  region?: string | null;
  percent: number;
  inclusive: boolean;
  active: boolean;
};

export async function createTaxRate(storeId: string, input: TaxRateInput) {
  return prisma.taxRate.create({ data: { storeId, ...input, region: input.region ?? null } });
}

export async function deleteTaxRate(storeId: string, taxId: string) {
  const res = await prisma.taxRate.deleteMany({ where: { id: taxId, storeId } });
  if (res.count === 0) throw new NotFoundError("Tax rate not found.");
}
