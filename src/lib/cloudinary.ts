import "server-only";
import { v2 as cloudinary } from "cloudinary";

// Secure file storage for KYC documents, selfies, utility bills and store
// imagery. Identity documents are uploaded as `authenticated` assets (never
// publicly reachable) into a private folder; admins view them through
// short-lived signed URLs minted server-side. Only secure URLs + public ids are
// saved in the database.
//
// Feature-flagged: if the CLOUDINARY_* env vars are absent, `isConfigured` is
// false and callers fall back to a local stub so the app keeps working in dev
// without an account.

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export const KYC_FOLDER = process.env.CLOUDINARY_KYC_FOLDER || "shoplyft/kyc";

export const isConfigured = Boolean(CLOUD_NAME && API_KEY && API_SECRET);

if (isConfigured) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
}

export type SignedUpload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  type: "authenticated" | "upload";
};

// Produces the params a browser needs to upload one file directly to Cloudinary
// (so large documents never pass through our server) while the api_secret stays
// here. `private` files (ID docs, selfies, utility bills) go to `authenticated`
// delivery; public assets (store logo/banner) use the default `upload` type.
export function signUpload(opts: { folder?: string; privateFile?: boolean }): SignedUpload {
  if (!isConfigured) throw new Error("Cloudinary is not configured.");
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = opts.folder || KYC_FOLDER;
  const type: "authenticated" | "upload" = opts.privateFile ? "authenticated" : "upload";

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, type },
    API_SECRET as string
  );

  return { cloudName: CLOUD_NAME as string, apiKey: API_KEY as string, timestamp, signature, folder, type };
}

// Mints a signed, expiring URL for a private (authenticated) asset so an admin
// can view an uploaded document. Defaults to a 10-minute lifetime.
export function signedDeliveryUrl(publicId: string, expiresInSeconds = 600): string {
  if (!isConfigured) throw new Error("Cloudinary is not configured.");
  return cloudinary.url(publicId, {
    type: "authenticated",
    sign_url: true,
    secure: true,
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
}

export { cloudinary };
