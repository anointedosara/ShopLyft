import "server-only";
import { prisma } from "@/lib/db";
import { encrypt, fingerprint } from "@/lib/crypto";
import { notify } from "@/lib/notifications";
import type {
  Prisma,
  SellerStatus,
  Gender,
  BusinessType,
  IdDocumentType,
  VerificationDocumentType,
} from "@prisma/client";

// Seller verification (KYC) domain helpers. The multi-step submission and admin
// review actions build on these in later increments; this foundation owns the
// status model and the one invariant that keeps the existing catalog working:
// Store.approved mirrors SellerVerification.status === APPROVED.

// The onboarding steps, in order. `completedSteps` on a verification records
// which of these the seller has filled; the last is implicit (review & submit).
export const KYC_STEPS = ["personal", "business", "identity", "bank"] as const;
export type KycStep = (typeof KYC_STEPS)[number];

// Only APPROVED sellers may list/sell.
export function canSell(status: SellerStatus | null | undefined): boolean {
  return status === "APPROVED";
}

// Human-readable label for a status (UI reuses this).
export const STATUS_LABEL: Record<SellerStatus, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending review",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

export async function getVerificationByStore(storeId: string) {
  return prisma.sellerVerification.findUnique({
    where: { storeId },
    include: { profile: true, documents: true },
  });
}

// The signed-in seller's own verification (via their store ownership).
export async function getVerificationForUser(userId: string) {
  const store = await prisma.store.findUnique({ where: { ownerId: userId }, select: { id: true } });
  if (!store) return null;
  return getVerificationByStore(store.id);
}

// The single source of truth for a seller's "can they sell?" gate. Keeps the
// legacy Store.approved boolean in lockstep with the verification status so the
// public catalog filter (store.approved) needs no changes. Accepts a Prisma
// transaction client so callers can fold it into a larger atomic change.
export async function syncStoreApproval(
  storeId: string,
  status: SellerStatus,
  client: Prisma.TransactionClient | typeof prisma = prisma
) {
  await client.store.update({
    where: { id: storeId },
    data: { approved: status === "APPROVED" },
  });
}

// The identity document types (excludes SELFIE/UTILITY_BILL) — at least one is
// required to satisfy identity verification.
const ID_DOC_TYPES: VerificationDocumentType[] = [
  "NATIONAL_ID",
  "DRIVERS_LICENSE",
  "PASSPORT",
  "VOTERS_CARD",
];

// Loads the seller's verification (with profile + documents), creating the
// SellerProfile + SellerVerification rows on first access if they don't exist
// yet. Returns null if the user has no store. This is the entry point every
// onboarding step uses, so a draft always has somewhere to save to.
export async function ensureVerificationForUser(userId: string) {
  const store = await prisma.store.findUnique({
    where: { ownerId: userId },
    select: { id: true, name: true, slug: true },
  });
  if (!store) return null;

  const existing = await prisma.sellerVerification.findUnique({
    where: { storeId: store.id },
    include: { profile: true, documents: { orderBy: { uploadedAt: "desc" } } },
  });
  if (existing) return { store, verification: existing };

  // First time — create the profile then its verification. Seed the profile's
  // contact fields from the user account as sensible defaults.
  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, phone: true },
  });
  const profile = await prisma.sellerProfile.create({
    data: {
      storeId: store.id,
      userId,
      email: account?.email ?? null,
      phone: account?.phone ?? null,
      emailHash: fingerprint(account?.email),
      phoneHash: fingerprint(account?.phone),
    },
  });
  const verification = await prisma.sellerVerification.create({
    data: { profileId: profile.id, storeId: store.id, status: "DRAFT", completedSteps: [] },
    include: { profile: true, documents: { orderBy: { uploadedAt: "desc" } } },
  });
  return { store, verification };
}

async function markStepComplete(verificationId: string, step: KycStep) {
  const v = await prisma.sellerVerification.findUnique({
    where: { id: verificationId },
    select: { completedSteps: true },
  });
  if (!v || v.completedSteps.includes(step)) return;
  await prisma.sellerVerification.update({
    where: { id: verificationId },
    data: { completedSteps: { set: [...v.completedSteps, step] } },
  });
}

export type PersonalInput = {
  fullLegalName: string;
  dateOfBirth: Date;
  gender: Gender;
  phone: string;
  email: string;
  residentialAddress: string;
  city: string;
  state: string;
  country: string;
};

export async function savePersonalInfo(userId: string, data: PersonalInput) {
  const ctx = await ensureVerificationForUser(userId);
  if (!ctx) return null;
  await prisma.sellerProfile.update({
    where: { id: ctx.verification.profileId },
    data: {
      fullLegalName: data.fullLegalName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      phone: data.phone,
      email: data.email,
      residentialAddress: data.residentialAddress,
      city: data.city,
      state: data.state,
      country: data.country,
      phoneHash: fingerprint(data.phone),
      emailHash: fingerprint(data.email),
    },
  });
  await markStepComplete(ctx.verification.id, "personal");
  return ctx.verification.id;
}

export type BusinessInput = {
  businessType: BusinessType;
  businessDescription: string;
  productCategories: string[];
  cacNumber?: string | null;
  tin?: string | null;
  yearsInBusiness?: number | null;
  businessAddress?: string | null;
  website?: string | null;
  socialLinks?: Record<string, string> | null;
};

export async function saveBusinessInfo(userId: string, data: BusinessInput) {
  const ctx = await ensureVerificationForUser(userId);
  if (!ctx) return null;
  await prisma.sellerProfile.update({
    where: { id: ctx.verification.profileId },
    data: {
      businessType: data.businessType,
      businessDescription: data.businessDescription,
      productCategories: { set: data.productCategories },
      cacNumber: data.cacNumber ?? null,
      tin: data.tin ?? null,
      yearsInBusiness: data.yearsInBusiness ?? null,
      businessAddress: data.businessAddress ?? null,
      website: data.website ?? null,
      socialLinks: (data.socialLinks ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
  await markStepComplete(ctx.verification.id, "business");
  return ctx.verification.id;
}

export type IdentityInput = {
  idType: IdDocumentType;
  idNumber: string;
  idExpiry?: Date | null;
};

// Saves identity fields (ID number stored encrypted + hashed). Only marks the
// step complete when a matching identity document has also been uploaded.
export async function saveIdentityInfo(userId: string, data: IdentityInput) {
  const ctx = await ensureVerificationForUser(userId);
  if (!ctx) return { ok: false as const, error: "No seller store found." };
  await prisma.sellerProfile.update({
    where: { id: ctx.verification.profileId },
    data: {
      idType: data.idType,
      idNumberEnc: encrypt(data.idNumber),
      idNumberHash: fingerprint(data.idNumber),
      idExpiry: data.idExpiry ?? null,
    },
  });
  const hasDoc = await prisma.verificationDocument.count({
    where: { verificationId: ctx.verification.id, type: { in: ID_DOC_TYPES } },
  });
  if (hasDoc > 0) await markStepComplete(ctx.verification.id, "identity");
  return { ok: true as const, hasDoc: hasDoc > 0 };
}

export type BankInput = { bankName: string; accountName: string; accountNumber: string };

export async function saveBankInfo(userId: string, data: BankInput) {
  const ctx = await ensureVerificationForUser(userId);
  if (!ctx) return null;
  await prisma.sellerProfile.update({
    where: { id: ctx.verification.profileId },
    data: {
      bankName: data.bankName,
      accountName: data.accountName,
      accountNumberEnc: encrypt(data.accountNumber),
      accountNumberHash: fingerprint(data.accountNumber),
    },
  });
  await markStepComplete(ctx.verification.id, "bank");
  return ctx.verification.id;
}

export type AttachDocumentInput = {
  type: VerificationDocumentType;
  url: string;
  publicId?: string | null;
  idNumber?: string | null;
  expiryDate?: Date | null;
};

// Records an uploaded document. For single-slot types (the ID types, selfie,
// utility bill) any previous document of that type is replaced so a re-upload
// doesn't leave stale rows.
export async function attachDocument(userId: string, data: AttachDocumentInput) {
  const ctx = await ensureVerificationForUser(userId);
  if (!ctx) return null;
  return prisma.$transaction(async (tx) => {
    await tx.verificationDocument.deleteMany({
      where: { verificationId: ctx.verification.id, type: data.type },
    });
    const doc = await tx.verificationDocument.create({
      data: {
        verificationId: ctx.verification.id,
        type: data.type,
        url: data.url,
        publicId: data.publicId ?? null,
        idNumber: data.idNumber ?? null,
        expiryDate: data.expiryDate ?? null,
      },
    });
    return doc;
  });
}

export async function removeDocument(userId: string, documentId: string) {
  const ctx = await ensureVerificationForUser(userId);
  if (!ctx) return { ok: false as const };
  // Scope the delete to the caller's own verification.
  const res = await prisma.verificationDocument.deleteMany({
    where: { id: documentId, verificationId: ctx.verification.id },
  });
  return { ok: res.count > 0 };
}

type VerificationWithProfileDocs = Prisma.SellerVerificationGetPayload<{
  include: { profile: true; documents: true };
}>;

// The list of sections still missing required data — the submit gate. Uses
// actual stored fields (not the completedSteps hint) so it can't be fooled.
export function missingForSubmit(v: VerificationWithProfileDocs): string[] {
  const p = v.profile;
  const missing: string[] = [];
  if (
    !p?.fullLegalName ||
    !p.dateOfBirth ||
    !p.gender ||
    !p.phone ||
    !p.email ||
    !p.residentialAddress ||
    !p.city ||
    !p.state ||
    !p.country
  ) {
    missing.push("Personal information");
  }
  if (!p?.businessType || !p.businessDescription || p.productCategories.length === 0) {
    missing.push("Business information");
  }
  const hasIdDoc = v.documents.some((d) => ID_DOC_TYPES.includes(d.type));
  if (!p?.idType || !p.idNumberEnc || !hasIdDoc) missing.push("Identity verification");
  if (!p?.bankName || !p.accountName || !p.accountNumberEnc) missing.push("Bank details");
  return missing;
}

type SubmitResult = { ok: true } | { ok: false; error: string };

// Transitions a complete DRAFT/REJECTED application to PENDING_REVIEW, writes an
// audit entry, and notifies the seller. The admin-notification email is wired in
// a later increment. IP is captured for the audit trail.
export async function submitVerification(userId: string, ipAddress?: string | null): Promise<SubmitResult> {
  const ctx = await ensureVerificationForUser(userId);
  if (!ctx) return { ok: false, error: "No seller store found." };

  const v = await prisma.sellerVerification.findUnique({
    where: { id: ctx.verification.id },
    include: { profile: true, documents: true },
  });
  if (!v) return { ok: false, error: "Verification not found." };

  if (v.status !== "DRAFT" && v.status !== "REJECTED") {
    return { ok: false, error: "Your application has already been submitted." };
  }

  const missing = missingForSubmit(v);
  if (missing.length) return { ok: false, error: `Please complete: ${missing.join(", ")}.` };

  const previousStatus = v.status;
  await prisma.$transaction([
    prisma.sellerVerification.update({
      where: { id: v.id },
      data: {
        status: "PENDING_REVIEW",
        submittedAt: new Date(),
        rejectionReason: null,
        requestedInfo: null,
      },
    }),
    prisma.verificationHistory.create({
      data: {
        verificationId: v.id,
        action: previousStatus === "REJECTED" ? "RESUBMITTED" : "SUBMITTED",
        previousStatus,
        newStatus: "PENDING_REVIEW",
        ipAddress: ipAddress ?? null,
      },
    }),
  ]);

  // Confirm to the seller…
  await notify({
    userId,
    type: "VERIFICATION_SUBMITTED",
    title: "Verification submitted",
    body: "Your seller application is under review. We'll let you know once it's been checked.",
    href: "/seller/verification",
  });

  // …and alert every admin that a new application is waiting.
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true, email: true } });
  await Promise.all(
    admins.map((a) =>
      notify({
        userId: a.id,
        type: "VERIFICATION_SUBMITTED",
        title: "New seller application",
        body: `${ctx.store.name} submitted a verification application for review.`,
        href: `/admin/sellers/${v.id}`,
        toEmail: a.email,
      })
    )
  );

  return { ok: true };
}
