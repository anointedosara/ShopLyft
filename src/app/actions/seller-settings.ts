"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/rbac";
import {
  updateStoreSettings,
  createShippingZone,
  deleteShippingZone,
  addShippingRate,
  deleteShippingRate,
  createTaxRate,
  deleteTaxRate,
} from "@/lib/seller/settings";
import {
  parseInput,
  storeSettingsSchema,
  shippingZoneSchema,
  shippingRateSchema,
  taxRateSchema,
} from "@/lib/validation";
import { handleActionError } from "@/lib/errors";

type Result = { ok: true } | { ok: false; error: string; code?: string };

const orNull = (s?: string) => (s && s.trim() ? s.trim() : null);

export async function updateSettingsAction(input: unknown): Promise<Result> {
  const { store } = await requireSeller();
  try {
    const d = parseInput(storeSettingsSchema, input);
    await updateStoreSettings(store.id, {
      processingDays: d.processingDays,
      returnWindowDays: d.returnWindowDays,
      autoAcceptReturns: d.autoAcceptReturns,
      supportEmail: orNull(d.supportEmail),
      supportPhone: orNull(d.supportPhone),
      payoutBankName: orNull(d.payoutBankName),
      payoutAccountName: orNull(d.payoutAccountName),
      vacationMode: d.vacationMode,
    });
    revalidatePath("/seller/settings");
    return { ok: true };
  } catch (e) {
    return handleActionError(e, "updateSettingsAction");
  }
}

export async function createZoneAction(input: unknown): Promise<Result> {
  const { store } = await requireSeller();
  try {
    const d = parseInput(shippingZoneSchema, input);
    await createShippingZone(store.id, d.name, d.regions);
    revalidatePath("/seller/shipping");
    return { ok: true };
  } catch (e) {
    return handleActionError(e, "createZoneAction");
  }
}

export async function deleteZoneAction(zoneId: string): Promise<Result> {
  const { store } = await requireSeller();
  try {
    await deleteShippingZone(store.id, zoneId);
    revalidatePath("/seller/shipping");
    return { ok: true };
  } catch (e) {
    return handleActionError(e, "deleteZoneAction");
  }
}

export async function addRateAction(input: unknown): Promise<Result> {
  const { store } = await requireSeller();
  try {
    const d = parseInput(shippingRateSchema, input);
    await addShippingRate(store.id, d.zoneId, {
      method: d.method,
      price: d.price,
      freeOver: d.freeOver ?? null,
      minDays: d.minDays,
      maxDays: d.maxDays,
    });
    revalidatePath("/seller/shipping");
    return { ok: true };
  } catch (e) {
    return handleActionError(e, "addRateAction");
  }
}

export async function deleteRateAction(rateId: string): Promise<Result> {
  const { store } = await requireSeller();
  try {
    await deleteShippingRate(store.id, rateId);
    revalidatePath("/seller/shipping");
    return { ok: true };
  } catch (e) {
    return handleActionError(e, "deleteRateAction");
  }
}

export async function createTaxAction(input: unknown): Promise<Result> {
  const { store } = await requireSeller();
  try {
    const d = parseInput(taxRateSchema, input);
    await createTaxRate(store.id, {
      name: d.name,
      region: orNull(d.region),
      percent: d.percent,
      inclusive: d.inclusive,
      active: d.active,
    });
    revalidatePath("/seller/settings");
    return { ok: true };
  } catch (e) {
    return handleActionError(e, "createTaxAction");
  }
}

export async function deleteTaxAction(taxId: string): Promise<Result> {
  const { store } = await requireSeller();
  try {
    await deleteTaxRate(store.id, taxId);
    revalidatePath("/seller/settings");
    return { ok: true };
  } catch (e) {
    return handleActionError(e, "deleteTaxAction");
  }
}
