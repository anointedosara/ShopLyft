import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/orders";
import { ensureVerificationForUser } from "@/lib/kyc";
import { getCategories } from "@/lib/catalog";
import { decrypt } from "@/lib/crypto";
import Breadcrumbs from "@/components/Breadcrumbs";
import VerificationFlow, { type VerificationInitial } from "@/components/seller/verification/VerificationFlow";
import VerificationStatusCard from "@/components/seller/verification/VerificationStatusCard";

export const metadata = { title: "Seller Verification — ShopLyft" };

const ID_DOC_TYPES = ["NATIONAL_ID", "DRIVERS_LICENSE", "PASSPORT", "VOTERS_CARD"];

function dateInput(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export default async function VerificationPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/seller/verification");

  const ctx = await ensureVerificationForUser(user.id);
  if (!ctx) redirect("/sell");

  const { store, verification } = ctx;
  const v = verification;
  const editable = v.status === "DRAFT" || v.status === "REJECTED";
  const categories = editable ? await getCategories() : [];

  return (
    <div className="mx-auto max-w-[860px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Seller Dashboard", href: "/seller" }, { label: "Verification" }]} />
      <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink mt-4">Seller verification</h1>
      <p className="text-mute mt-1">
        Verify your identity and business to start selling. Your information is encrypted and only used for review.
      </p>

      <div className="mt-6">
        {editable ? (
          <VerificationFlow initial={buildInitial()} />
        ) : (
          <VerificationStatusCard
            status={v.status}
            storeName={store.name}
            submittedAt={v.submittedAt}
            requestedInfo={v.requestedInfo}
          />
        )}
      </div>

      <div className="mt-6">
        <Link href="/seller" className="text-sm font-semibold text-brand hover:underline">← Back to dashboard</Link>
      </div>
    </div>
  );

  // Maps the stored verification onto the plain, client-safe shape the form
  // needs. Sensitive numbers are decrypted only for their owner (this page is
  // ownership-gated) so the seller can review/edit what they entered.
  function buildInitial(): VerificationInitial {
    const p = v.profile;
    const social = (p?.socialLinks ?? {}) as Record<string, string>;
    const idDoc = v.documents.find((d) => ID_DOC_TYPES.includes(d.type));

    return {
      storeName: store.name,
      completedSteps: v.completedSteps,
      rejectionReason: v.rejectionReason,
      requestedInfo: v.requestedInfo,
      categories: categories.map((c) => ({ id: c.id, name: c.name })),
      personal: {
        fullLegalName: p?.fullLegalName ?? "",
        dateOfBirth: dateInput(p?.dateOfBirth ?? null),
        gender: p?.gender ?? "",
        phone: p?.phone ?? "",
        email: p?.email ?? "",
        residentialAddress: p?.residentialAddress ?? "",
        city: p?.city ?? "",
        state: p?.state ?? "",
        country: p?.country ?? "",
      },
      business: {
        businessType: p?.businessType ?? "",
        businessDescription: p?.businessDescription ?? "",
        productCategories: p?.productCategories ?? [],
        cacNumber: p?.cacNumber ?? "",
        tin: p?.tin ?? "",
        yearsInBusiness: p?.yearsInBusiness != null ? String(p.yearsInBusiness) : "",
        businessAddress: p?.businessAddress ?? "",
        website: p?.website ?? "",
        instagram: social.instagram ?? "",
        twitter: social.twitter ?? "",
      },
      identity: {
        idType: p?.idType ?? "",
        idNumber: decrypt(p?.idNumberEnc) ?? "",
        idExpiry: dateInput(p?.idExpiry ?? null),
        document: idDoc ? { id: idDoc.id, url: idDoc.url, type: idDoc.type } : null,
      },
      bank: {
        bankName: p?.bankName ?? "",
        accountName: p?.accountName ?? "",
        accountNumber: decrypt(p?.accountNumberEnc) ?? "",
      },
    };
  }
}
