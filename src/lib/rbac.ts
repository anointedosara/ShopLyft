import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/orders";
import { getStoreByOwner } from "@/lib/stores";
import type { UserRole } from "@prisma/client";

// Role-based authorization. The Better Auth session doesn't carry our custom
// `role` field, so role is always read from the database here — never trusted
// from the client/session.

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export type AppUser = { id: string; name: string; email: string; role: UserRole };

// Is this email on the admin allowlist? Used both to mint admins and to gate the
// first-login admin bootstrap.
export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

// Promotes a user to ADMIN if their email is in the ADMIN_EMAILS allowlist.
// This is how the first admins are minted — no manual DB editing required.
// Returns the (possibly updated) role.
export async function ensureAdminFromEnv(user: { id: string; email: string; role: UserRole }) {
  if (user.role !== "ADMIN" && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
    return "ADMIN" as const;
  }
  return user.role;
}

// Returns the signed-in user with their DB role (applying env promotion), or
// null if not signed in. Does not redirect — use for conditional UI.
export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await getSessionUser();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) return null;
  const role = await ensureAdminFromEnv(user);
  return { ...user, role };
}

export function isAdmin(user: { role: UserRole } | null | undefined): boolean {
  return user?.role === "ADMIN";
}

// Guards an admin-only route/action. Redirects non-admins away (to /login when
// signed out, home otherwise) and returns the admin user when allowed.
export async function requireAdmin(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

// Guards any authenticated route. Redirects to login (preserving intended
// destination) when signed out. Use for /account, checkout, etc.
export async function requireUser(next = "/account"): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

// Guards a seller-only route and resolves the caller's store in one step.
// Closes the audit gap where /seller/* pages checked only for a session (a
// BUYER could load seller forms). Non-sellers without a store are sent to /sell
// to start onboarding; signed-out users to /login. Admins are allowed through
// (they can act on any store via admin tooling, but here we still require an
// owned store, so admins without a store are redirected to /sell as well).
export async function requireSeller(
  next = "/seller",
): Promise<{ user: AppUser; store: NonNullable<Awaited<ReturnType<typeof getStoreByOwner>>> }> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  const store = await getStoreByOwner(user.id);
  // A user is a "seller" iff they own a store. Role and store are kept in sync
  // at onboarding; the store lookup is the authoritative check.
  if (!store) redirect("/sell");
  return { user, store };
}
