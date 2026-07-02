"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/orders";
import { getStoreByOwner, createStoreForUser, updateStoreForOwner } from "@/lib/stores";
import { parseInput, becomeSellerSchema, updateStoreSchema } from "@/lib/validation";
import { handleActionError, ValidationError } from "@/lib/errors";

type BecomeSellerResult = { ok: true; slug: string } | { ok: false; error: string };

// Turns the signed-in user into a seller by creating their store (pending approval)
// and promoting their role. Idempotent: returns the existing store if they have one.
export async function becomeSellerAction(input: unknown): Promise<BecomeSellerResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in first." };

  let data;
  try {
    data = parseInput(becomeSellerSchema, input);
  } catch (e) {
    if (e instanceof ValidationError) return { ok: false, error: e.clientMessage };
    return { ok: false, error: "Invalid store details." };
  }

  const existing = await getStoreByOwner(user.id);
  if (existing) return { ok: true, slug: existing.slug };

  try {
    const store = await createStoreForUser(user.id, {
      name: data.name,
      description: data.description?.trim() || null,
    });
    return { ok: true, slug: store.slug };
  } catch (e) {
    return handleActionError(e, "becomeSellerAction");
  }
}

type UpdateStoreResult = { ok: true } | { ok: false; error: string };

// Lets a seller edit their own store profile (name, description, logo).
export async function updateStoreAction(input: unknown): Promise<UpdateStoreResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in first." };

  let data;
  try {
    data = parseInput(updateStoreSchema, input);
  } catch (e) {
    if (e instanceof ValidationError) return { ok: false, error: e.clientMessage };
    return { ok: false, error: "Invalid store details." };
  }

  const updated = await updateStoreForOwner(user.id, {
    name: data.name,
    description: data.description?.trim() || null,
    logo: data.logo?.trim() || null,
  });
  if (!updated) return { ok: false, error: "You don't have a store yet." };

  revalidatePath("/seller");
  return { ok: true };
}
