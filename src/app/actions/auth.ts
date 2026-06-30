"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/rbac";

// First-login bootstrap for allowlisted admin accounts.
//
// If the signing-in email is in ADMIN_EMAILS *and* has no account yet, the
// password entered on this first login is used to create the account and
// becomes its saved password (and the user is promoted to ADMIN). Every future
// login then requires that same password through the normal flow.
//
// Strictly scoped so this is an admin *setup* step, not a backdoor:
//   • non-allowlisted emails fall through untouched (normal sign-in)
//   • an email that already has an account falls through untouched
//     (the real password is required — "any password" only works to claim an
//      unclaimed admin email)
type Result = { ok: true; bootstrapped: boolean } | { ok: false; error: string };

export async function bootstrapAdminLogin(email: string, password: string): Promise<Result> {
  const normalized = email.trim().toLowerCase();

  if (!isAdminEmail(normalized)) return { ok: true, bootstrapped: false };

  const existing = await prisma.user.findUnique({ where: { email: normalized }, select: { id: true } });
  if (existing) return { ok: true, bootstrapped: false };

  // Better Auth enforces an 8-char minimum; surface that clearly since this
  // password is being set, not just checked.
  if (password.length < 8) {
    return { ok: false, error: "Choose a password with at least 8 characters — it becomes your admin password." };
  }

  try {
    await auth.api.signUpEmail({ body: { name: "Admin", email: normalized, password } });
  } catch {
    return { ok: false, error: "Could not set up the admin account. Please try again." };
  }

  await prisma.user.update({ where: { email: normalized }, data: { role: "ADMIN" } });
  return { ok: true, bootstrapped: true };
}
