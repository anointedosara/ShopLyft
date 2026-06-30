import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/orders";
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
