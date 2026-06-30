"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { getSessionUser } from "@/lib/orders";
import {
  savePersonalInfo,
  saveBusinessInfo,
  saveIdentityInfo,
  saveBankInfo,
  attachDocument,
  removeDocument,
  submitVerification,
} from "@/lib/kyc";

// Server actions for the seller verification (KYC) flow. Each step validates
// with zod, then delegates the DB write (and field encryption) to lib/kyc.
// Same return contract as the rest of the app: { ok: true } | { ok: false, error }.

type Result = { ok: true } | { ok: false; error: string };

// First zod issue as a human-readable message — matches the form-level error
// banner the existing forms render.
function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Please check the form and try again.";
}

async function clientIp(): Promise<string | null> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0]!.trim() : h.get("x-real-ip");
}

const trimmed = (label: string, min = 1) =>
  z.string().trim().min(min, `${label} is required.`);

const personalSchema = z.object({
  fullLegalName: trimmed("Full legal name", 2),
  dateOfBirth: z.coerce.date({ message: "Enter a valid date of birth." }),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]),
  phone: trimmed("Phone number", 7),
  email: z.string().trim().email("Enter a valid email address."),
  residentialAddress: trimmed("Residential address", 4),
  city: trimmed("City"),
  state: trimmed("State"),
  country: trimmed("Country"),
});

export async function savePersonalAction(input: unknown): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in first." };
  const parsed = personalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const saved = await savePersonalInfo(user.id, parsed.data);
  if (!saved) return { ok: false, error: "You need a seller store first." };
  revalidatePath("/seller/verification");
  return { ok: true };
}

const businessSchema = z.object({
  businessType: z.enum([
    "SOLE_PROPRIETOR",
    "PARTNERSHIP",
    "LIMITED_LIABILITY",
    "ENTERPRISE",
    "NGO",
    "OTHER",
  ]),
  businessDescription: trimmed("Business description", 10),
  productCategories: z.array(z.string()).min(1, "Choose at least one product category."),
  cacNumber: z.string().trim().optional().nullable(),
  tin: z.string().trim().optional().nullable(),
  yearsInBusiness: z.coerce.number().int().min(0).max(200).optional().nullable(),
  businessAddress: z.string().trim().optional().nullable(),
  website: z.union([z.string().trim().url("Enter a valid website URL."), z.literal("")]).optional().nullable(),
  socialLinks: z.record(z.string(), z.string()).optional().nullable(),
});

export async function saveBusinessAction(input: unknown): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in first." };
  const parsed = businessSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const { website, ...rest } = parsed.data;
  const saved = await saveBusinessInfo(user.id, {
    ...rest,
    website: website || null,
  });
  if (!saved) return { ok: false, error: "You need a seller store first." };
  revalidatePath("/seller/verification");
  return { ok: true };
}

const identitySchema = z.object({
  idType: z.enum(["NATIONAL_ID", "DRIVERS_LICENSE", "PASSPORT", "VOTERS_CARD"]),
  idNumber: trimmed("ID number", 3),
  idExpiry: z.coerce.date().optional().nullable(),
});

export async function saveIdentityAction(input: unknown): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in first." };
  const parsed = identitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const res = await saveIdentityInfo(user.id, parsed.data);
  if (!res.ok) return { ok: false, error: res.error };
  if (!res.hasDoc) {
    return { ok: false, error: "Upload a photo of your selected ID before continuing." };
  }
  revalidatePath("/seller/verification");
  return { ok: true };
}

const bankSchema = z.object({
  bankName: trimmed("Bank name", 2),
  accountName: trimmed("Account name", 2),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{6,20}$/, "Enter a valid account number (digits only)."),
});

export async function saveBankAction(input: unknown): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in first." };
  const parsed = bankSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const saved = await saveBankInfo(user.id, parsed.data);
  if (!saved) return { ok: false, error: "You need a seller store first." };
  revalidatePath("/seller/verification");
  return { ok: true };
}

const attachSchema = z.object({
  type: z.enum([
    "NATIONAL_ID",
    "DRIVERS_LICENSE",
    "PASSPORT",
    "VOTERS_CARD",
    "UTILITY_BILL",
  ]),
  url: z.string().trim().url("A valid document URL is required."),
  publicId: z.string().trim().optional().nullable(),
});

export async function attachDocumentAction(
  input: unknown
): Promise<{ ok: true; id: string; url: string } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in first." };
  const parsed = attachSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const doc = await attachDocument(user.id, parsed.data);
  if (!doc) return { ok: false, error: "You need a seller store first." };
  revalidatePath("/seller/verification");
  return { ok: true, id: doc.id, url: doc.url };
}

export async function removeDocumentAction(documentId: string): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in first." };
  const res = await removeDocument(user.id, documentId);
  if (!res.ok) return { ok: false, error: "Document not found." };
  revalidatePath("/seller/verification");
  return { ok: true };
}

export async function submitVerificationAction(): Promise<Result> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in first." };
  const res = await submitVerification(user.id, await clientIp());
  if (!res.ok) return res;
  revalidatePath("/seller/verification");
  revalidatePath("/seller");
  return { ok: true };
}
