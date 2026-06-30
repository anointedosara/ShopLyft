import { getSessionUser } from "@/lib/orders";
import { isConfigured, signUpload } from "@/lib/cloudinary";

// Mints a one-shot Cloudinary upload signature so the browser can upload a KYC
// document directly (the file never passes through our server) while the API
// secret stays server-side. Auth-gated: only signed-in users can request one.
// When Cloudinary isn't configured we respond 200 with { configured: false } so
// the client falls back to manual URL entry instead of erroring.
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (!isConfigured) {
    return Response.json({ ok: false, configured: false });
  }

  let body: { privateFile?: boolean; folder?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty/invalid body — defaults below apply
  }

  // KYC documents default to private (authenticated) delivery.
  const params = signUpload({ privateFile: body.privateFile ?? true, folder: body.folder });
  return Response.json({ ok: true, configured: true, ...params });
}
