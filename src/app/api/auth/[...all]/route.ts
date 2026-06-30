import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Catch-all handler that backs every Better Auth endpoint (sign-up, sign-in, session, sign-out).
export const { GET, POST } = toNextJsHandler(auth);
