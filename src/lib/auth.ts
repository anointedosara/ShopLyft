import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { verificationEmail, passwordResetEmail } from "@/lib/email-templates";
import { logger } from "@/lib/logger";

// Origins Better Auth will accept requests from. Without this, requests whose
// Origin header doesn't exactly match BETTER_AUTH_URL are rejected with
// INVALID_ORIGIN — which breaks local dev (localhost) and even prod when the
// env URL has a trailing slash. We normalise (strip trailing slash) and always
// allow localhost for development.
const trustedOrigins = Array.from(
  new Set(
    [
      process.env.BETTER_AUTH_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      "http://localhost:3000",
    ]
      .filter((u): u is string => Boolean(u))
      .map((u) => u.replace(/\/+$/, ""))
  )
);

// Better Auth owns users/sessions/accounts in our own Postgres (no third-party host).
// Email + password only for V1; social logins / email verification come later.
export const auth = betterAuth({
  baseURL: (process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/+$/, ""),
  trustedOrigins,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Require a verified email before sign-in. Defaults OFF so existing accounts
    // (created before verification existed) aren't locked out; flip
    // AUTH_REQUIRE_EMAIL_VERIFICATION=true once the back-catalogue is verified.
    requireEmailVerification: process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "true",
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
    // Sign every session out of an account whose password was just reset — closes
    // the window where a leaked-then-reset password leaves old sessions live.
    revokeSessionsOnPasswordReset: true,
    // Better Auth calls this with a ready-made, tokenised reset URL.
    sendResetPassword: async ({ user, url }) => {
      const { subject, html } = passwordResetEmail(user.name, url);
      const res = await sendEmail({ to: user.email, type: "GENERAL", subject, html, relatedUserId: user.id });
      if (!res.ok) logger.error("auth.sendResetPassword: email failed", { userId: user.id, error: res.error });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const { subject, html } = verificationEmail(user.name, url);
      const res = await sendEmail({ to: user.email, type: "GENERAL", subject, html, relatedUserId: user.id });
      if (!res.ok) logger.error("auth.sendVerificationEmail: email failed", { userId: user.id, error: res.error });
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Tell every admin when a new account is created. Best-effort: a
        // notification failure must never break sign-up. The new user is
        // excluded so the very first admin doesn't get notified about itself.
        after: async (user) => {
          try {
            const admins = await prisma.user.findMany({
              where: { role: "ADMIN", id: { not: user.id } },
              select: { id: true, email: true },
            });
            await Promise.all(
              admins.map((a) =>
                notify({
                  userId: a.id,
                  type: "GENERAL",
                  title: "New user signed up",
                  body: `${user.name || "A new user"} (${user.email}) just created an account.`,
                  href: "/admin",
                  toEmail: a.email,
                })
              )
            );
          } catch {
            // swallow — sign-up must succeed regardless
          }
        },
      },
    },
  },
  // nextCookies() must be last — it lets sign-in/up set cookies from server actions.
  plugins: [nextCookies()],
});
