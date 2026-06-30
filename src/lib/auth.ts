import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";

// Better Auth owns users/sessions/accounts in our own Postgres (no third-party host).
// Email + password only for V1; social logins / email verification come later.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  // nextCookies() must be last — it lets sign-in/up set cookies from server actions.
  plugins: [nextCookies()],
});
