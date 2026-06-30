"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/orders";
import { getStoreByOwner, createStoreForUser, updateStoreForOwner } from "@/lib/stores";

type BecomeSellerResult = { ok: true; slug: string } | { ok: false; error: string };

// Turns the signed-in user into a seller by creating their store (pending approval)
// and promoting their role. Idempotent: returns the existing store if they have one.
export async function becomeSellerAction(input: {
  name: string;
  description?: string;
}): Promise<BecomeSellerResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in first." };

  const name = input.name?.trim();
  if (!name || name.length < 2) {
    return { ok: false, error: "Enter a store name (at least 2 characters)." };
  }

  const existing = await getStoreByOwner(user.id);
  if (existing) return { ok: true, slug: existing.slug };

  try {
    const store = await createStoreForUser(user.id, {
      name,
      description: input.description?.trim() || null,
    });
    return { ok: true, slug: store.slug };
  } catch {
    return { ok: false, error: "Could not create your store. Please try again." };
  }
}

type UpdateStoreResult = { ok: true } | { ok: false; error: string };

// Lets a seller edit their own store profile (name, description, logo).
export async function updateStoreAction(input: {
  name: string;
  description?: string;
  logo?: string;
}): Promise<UpdateStoreResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in first." };

  const name = input.name?.trim();
  if (!name || name.length < 2) return { ok: false, error: "Store name must be at least 2 characters." };

  const updated = await updateStoreForOwner(user.id, {
    name,
    description: input.description?.trim() || null,
    logo: input.logo?.trim() || null,
  });
  if (!updated) return { ok: false, error: "You don't have a store yet." };

  revalidatePath("/seller");
  return { ok: true };
}
