import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notifications";

// Better Auth owns users/sessions/accounts in our own Postgres (no third-party host).
// Email + password only for V1; social logins / email verification come later.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
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
