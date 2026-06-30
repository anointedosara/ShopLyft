import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Field-level encryption for sensitive KYC values (government ID numbers, bank
// account numbers). We store the ciphertext (…Enc) and a separate sha256 (…Hash)
// used only for duplicate detection — never the plaintext.
//
// AES-256-GCM: authenticated encryption, so tampering is detected on decrypt.
// The 32-byte key is derived (sha256) from KYC_ENCRYPTION_KEY. In dev, if that
// isn't set we fall back to BETTER_AUTH_SECRET so the flow always works; set a
// dedicated KYC_ENCRYPTION_KEY in production (rotating it makes old rows
// undecryptable, so treat it as durable).

const IV_LEN = 12; // GCM standard nonce length
const TAG_LEN = 16;

function key(): Buffer {
  const secret = process.env.KYC_ENCRYPTION_KEY || process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "No encryption secret: set KYC_ENCRYPTION_KEY (or BETTER_AUTH_SECRET) in the environment."
    );
  }
  // Derive a fixed 32-byte key from whatever length the secret is.
  return createHash("sha256").update(secret).digest();
}

// Encrypts plaintext → base64( iv | authTag | ciphertext ). Returns null for
// empty input so optional fields stay null rather than encrypting "".
export function encrypt(plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === "") return null;
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

// Reverses encrypt(). Returns null for null/blank input.
export function decrypt(payload: string | null | undefined): string | null {
  if (payload == null || payload === "") return null;
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

// Lower-cases, trims and strips spaces/dashes so "0123-456 789" and "0123456789"
// hash identically — used for fuzzy duplicate detection across sellers.
export function normalize(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[\s-]+/g, "").trim();
}

// Deterministic, non-reversible fingerprint of a normalized value. Stored in
// the …Hash columns and compared to flag duplicate phones/IDs/accounts.
export function fingerprint(value: string | null | undefined): string | null {
  const n = normalize(value);
  if (!n) return null;
  return createHash("sha256").update(n).digest("hex");
}
