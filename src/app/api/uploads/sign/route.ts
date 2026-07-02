import { getSessionUser } from "@/lib/orders";
import { isConfigured, signUpload, KYC_FOLDER } from "@/lib/cloudinary";
import { rateLimit, RatePolicy } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// Mints a one-shot Cloudinary upload signature so the browser can upload a file
// directly (it never passes through our server) while the API secret stays
// server-side. Auth-gated and rate-limited.
//
// Hardening (from the audit): the target folder is resolved from an allowlist,
// so a caller can't scatter files across the Cloudinary account. Privacy is
// derived from the folder, not trusted from the client — KYC documents are
// ALWAYS signed for `authenticated` (private) delivery even if the client asks
// for public.
//
// Residual: file size/MIME can't be fully constrained at signature time without
// signing those params too; the recommended production control is a Cloudinary
// upload preset with `allowed_formats` + `max_file_size`. Tracked as follow-up.

const PUBLIC_FOLDERS = new Set([
  "shoplyft/stores",
  "shoplyft/products",
  "shoplyft/avatars",
  "shoplyft/reviews",
]);

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const rl = await rateLimit(`upload-sign:${user.id}`, RatePolicy.upload);
  if (!rl.allowed) {
    return new Response("Too many requests", { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } });
  }

  if (!isConfigured) {
    return Response.json({ ok: false, configured: false });
  }

  let body: { privateFile?: boolean; folder?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty/invalid body — KYC defaults below apply
  }

  const requested = typeof body.folder === "string" ? body.folder : undefined;
  let folder: string;
  let privateFile: boolean;

  if (!requested || requested === KYC_FOLDER) {
    // No folder → KYC document uploader. Always private.
    folder = KYC_FOLDER;
    privateFile = true;
  } else if (PUBLIC_FOLDERS.has(requested)) {
    folder = requested;
    privateFile = false;
  } else {
    logger.warn("uploads.sign: rejected folder", { userId: user.id, folder: requested });
    return new Response("Invalid upload folder", { status: 400 });
  }

  const params = signUpload({ privateFile, folder });
  return Response.json({ ok: true, configured: true, ...params });
}
