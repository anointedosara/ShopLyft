"use server";

import { getSessionUser } from "@/lib/orders";
import { updateUserProfile } from "@/lib/users";

type UpdateProfileResult = { ok: true } | { ok: false; error: string };

// Updates the signed-in user's own profile. Re-checks the session server-side.
export async function updateProfileAction(input: {
  name: string;
  phone?: string;
  image?: string;
}): Promise<UpdateProfileResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in to update your profile." };

  const name = input.name?.trim();
  if (!name) return { ok: false, error: "Your name can't be empty." };

  try {
    await updateUserProfile(user.id, {
      name,
      phone: input.phone?.trim() || null,
      image: input.image?.trim() || null,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save your profile. Please try again." };
  }
}
