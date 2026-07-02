"use server";

import { getSessionUser } from "@/lib/orders";
import { updateUserProfile } from "@/lib/users";
import { parseInput, updateProfileSchema } from "@/lib/validation";
import { handleActionError, ValidationError } from "@/lib/errors";

type UpdateProfileResult = { ok: true } | { ok: false; error: string };

// Updates the signed-in user's own profile. Re-checks the session server-side
// and validates the payload (POST-reachable boundary).
export async function updateProfileAction(input: unknown): Promise<UpdateProfileResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in to update your profile." };

  let data;
  try {
    data = parseInput(updateProfileSchema, input);
  } catch (e) {
    if (e instanceof ValidationError) return { ok: false, error: e.clientMessage };
    return { ok: false, error: "Invalid profile details." };
  }

  try {
    await updateUserProfile(user.id, {
      name: data.name,
      phone: data.phone?.trim() || null,
      image: data.image?.trim() || null,
    });
    return { ok: true };
  } catch (e) {
    return handleActionError(e, "updateProfileAction");
  }
}
