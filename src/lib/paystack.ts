import "server-only";

// Thin wrapper over the Paystack REST API. Secret key never leaves the server.
const BASE = "https://api.paystack.co";

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

export type InitInput = {
  email: string;
  amountKobo: number; // Paystack charges in kobo (₦1 = 100 kobo)
  reference: string;
  callbackUrl: string;
  channels?: string[]; // e.g. ["card", "bank_transfer", "ussd"]
  metadata?: Record<string, unknown>;
};

export async function initializeTransaction(input: InitInput) {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: authHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      callback_url: input.callbackUrl,
      channels: input.channels,
      metadata: input.metadata,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json?.message || "Failed to initialize payment");
  }
  return json.data as { authorization_url: string; access_code: string; reference: string };
}

export type PaystackVerification = {
  status: string; // "success" | "failed" | "abandoned" | ...
  amount: number; // kobo
  reference: string;
  currency: string;
};

export async function verifyTransaction(reference: string): Promise<PaystackVerification | null> {
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.status) return null;
  return json.data as PaystackVerification;
}
