"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VerificationDocumentType } from "@prisma/client";
import {
  savePersonalAction,
  saveBusinessAction,
  saveIdentityAction,
  saveBankAction,
  submitVerificationAction,
} from "@/app/actions/kyc";
import FileUpload from "@/components/seller/FileUpload";
import StepProgress from "@/components/seller/verification/StepProgress";
import { ChevronLeft, AlertIcon } from "@/components/icons";

const inputCls =
  "w-full rounded-xl bg-cloud px-4 py-3 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand transition";

const GENDERS = [
  ["MALE", "Male"],
  ["FEMALE", "Female"],
  ["OTHER", "Other"],
  ["PREFER_NOT_TO_SAY", "Prefer not to say"],
] as const;

const BUSINESS_TYPES = [
  ["SOLE_PROPRIETOR", "Sole proprietor"],
  ["PARTNERSHIP", "Partnership"],
  ["LIMITED_LIABILITY", "Limited liability company"],
  ["ENTERPRISE", "Registered enterprise"],
  ["NGO", "NGO / Non-profit"],
  ["OTHER", "Other"],
] as const;

const ID_TYPES = [
  ["NATIONAL_ID", "National ID Card (NIN)"],
  ["DRIVERS_LICENSE", "Driver's License"],
  ["PASSPORT", "International Passport"],
  ["VOTERS_CARD", "Voter's Card"],
] as const;

const STEPS = [
  { key: "personal", label: "Personal" },
  { key: "business", label: "Business" },
  { key: "identity", label: "Identity" },
  { key: "bank", label: "Bank" },
  { key: "review", label: "Review" },
];

export type VerificationInitial = {
  storeName: string;
  completedSteps: string[];
  rejectionReason: string | null;
  requestedInfo: string | null;
  categories: { id: string; name: string }[];
  personal: {
    fullLegalName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    email: string;
    residentialAddress: string;
    city: string;
    state: string;
    country: string;
  };
  business: {
    businessType: string;
    businessDescription: string;
    productCategories: string[];
    cacNumber: string;
    tin: string;
    yearsInBusiness: string;
    businessAddress: string;
    website: string;
    instagram: string;
    twitter: string;
  };
  identity: {
    idType: string;
    idNumber: string;
    idExpiry: string;
    document: { id: string; url: string; type: string } | null;
  };
  bank: { bankName: string; accountName: string; accountNumber: string };
};

function Label({ children }: { children: React.ReactNode }) {
  return <span className="block text-sm font-semibold text-ink mb-1.5">{children}</span>;
}

function Optional() {
  return <span className="text-mute font-normal">(optional)</span>;
}

export default function VerificationFlow({ initial }: { initial: VerificationInitial }) {
  const router = useRouter();

  // Start on the first step the seller hasn't finished yet.
  const firstIncomplete = STEPS.findIndex(
    (s) => s.key !== "review" && !initial.completedSteps.includes(s.key)
  );
  const [step, setStep] = useState(firstIncomplete === -1 ? STEPS.length - 1 : firstIncomplete);
  const [completed, setCompleted] = useState<string[]>(initial.completedSteps);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [personal, setPersonal] = useState(initial.personal);
  const [business, setBusiness] = useState(initial.business);
  const [identity, setIdentity] = useState(initial.identity);
  const [hasIdDoc, setHasIdDoc] = useState(Boolean(initial.identity.document));
  const [bank, setBank] = useState(initial.bank);

  const setP = (k: keyof typeof personal, v: string) => setPersonal((s) => ({ ...s, [k]: v }));
  const setB = (k: keyof typeof business, v: string) => setBusiness((s) => ({ ...s, [k]: v }));
  const setI = (k: keyof typeof identity, v: string) => setIdentity((s) => ({ ...s, [k]: v }));
  const setBk = (k: keyof typeof bank, v: string) => setBank((s) => ({ ...s, [k]: v }));

  const markDone = (key: string) =>
    setCompleted((c) => (c.includes(key) ? c : [...c, key]));

  async function saveAndNext(key: string, run: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    setSaving(true);
    const res = await run();
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    markDone(key);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  const toggleCategory = (id: string) =>
    setBusiness((s) => ({
      ...s,
      productCategories: s.productCategories.includes(id)
        ? s.productCategories.filter((c) => c !== id)
        : [...s.productCategories, id],
    }));

  const submit = async () => {
    setError(null);
    setSaving(true);
    const res = await submitVerificationAction();
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh(); // page re-renders into the "under review" status card
  };

  const socialLinks = () => {
    const out: Record<string, string> = {};
    if (business.instagram.trim()) out.instagram = business.instagram.trim();
    if (business.twitter.trim()) out.twitter = business.twitter.trim();
    return Object.keys(out).length ? out : null;
  };

  return (
    <div className="space-y-6">
      {(initial.rejectionReason || initial.requestedInfo) && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-amber-100 text-amber-700 shrink-0">
            <AlertIcon width={18} height={18} />
          </span>
          <div className="text-sm text-amber-800">
            {initial.rejectionReason && (
              <p><span className="font-semibold">Application not approved:</span> {initial.rejectionReason}</p>
            )}
            {initial.requestedInfo && (
              <p className={initial.rejectionReason ? "mt-1" : ""}>
                <span className="font-semibold">More information needed:</span> {initial.requestedInfo}
              </p>
            )}
            <p className="mt-1 text-amber-700">Update the details below and resubmit.</p>
          </div>
        </div>
      )}

      <StepProgress steps={STEPS} currentIndex={step} completedKeys={completed} onJump={setStep} />

      <div className="rounded-2xl bg-white ring-1 ring-line p-6 sm:p-8">
        {/* ── Personal ───────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-5">
            <Header title="Personal information" subtitle="Tell us who's behind the store. This must match your ID." />
            <div>
              <Label>Full legal name</Label>
              <input className={inputCls} value={personal.fullLegalName} onChange={(e) => setP("fullLegalName", e.target.value)} placeholder="As shown on your ID" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Date of birth</Label>
                <input type="date" className={inputCls} value={personal.dateOfBirth} onChange={(e) => setP("dateOfBirth", e.target.value)} />
              </div>
              <div>
                <Label>Gender</Label>
                <select className={inputCls} value={personal.gender} onChange={(e) => setP("gender", e.target.value)}>
                  <option value="" disabled>Select…</option>
                  {GENDERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Phone number</Label>
                <input className={inputCls} value={personal.phone} onChange={(e) => setP("phone", e.target.value)} placeholder="e.g. 0803 000 0000" />
              </div>
              <div>
                <Label>Email address</Label>
                <input type="email" className={inputCls} value={personal.email} onChange={(e) => setP("email", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Residential address</Label>
              <input className={inputCls} value={personal.residentialAddress} onChange={(e) => setP("residentialAddress", e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div><Label>City</Label><input className={inputCls} value={personal.city} onChange={(e) => setP("city", e.target.value)} /></div>
              <div><Label>State</Label><input className={inputCls} value={personal.state} onChange={(e) => setP("state", e.target.value)} /></div>
              <div><Label>Country</Label><input className={inputCls} value={personal.country} onChange={(e) => setP("country", e.target.value)} placeholder="Nigeria" /></div>
            </div>
            <Nav onNext={() => saveAndNext("personal", () => savePersonalAction(personal))} saving={saving} />
          </div>
        )}

        {/* ── Business ───────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <Header title="Business information" subtitle={`Details about ${initial.storeName}.`} />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Business type</Label>
                <select className={inputCls} value={business.businessType} onChange={(e) => setB("businessType", e.target.value)}>
                  <option value="" disabled>Select…</option>
                  {BUSINESS_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <Label>Years in business <Optional /></Label>
                <input type="number" min="0" className={inputCls} value={business.yearsInBusiness} onChange={(e) => setB("yearsInBusiness", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Business description</Label>
              <textarea rows={3} className={`${inputCls} resize-none`} value={business.businessDescription} onChange={(e) => setB("businessDescription", e.target.value)} placeholder="What does your business sell?" />
            </div>
            <div>
              <Label>Product categories</Label>
              <div className="flex flex-wrap gap-2">
                {initial.categories.map((c) => {
                  const on = business.productCategories.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition ${
                        on ? "bg-brand text-white ring-brand" : "bg-cloud text-ink-soft ring-line hover:ring-brand-200"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>CAC registration number <Optional /></Label>
                <input className={inputCls} value={business.cacNumber} onChange={(e) => setB("cacNumber", e.target.value)} placeholder="RC / BN number" />
              </div>
              <div>
                <Label>Tax Identification Number <Optional /></Label>
                <input className={inputCls} value={business.tin} onChange={(e) => setB("tin", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Business address <Optional /></Label>
              <input className={inputCls} value={business.businessAddress} onChange={(e) => setB("businessAddress", e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>Website <Optional /></Label>
                <input type="url" className={inputCls} value={business.website} onChange={(e) => setB("website", e.target.value)} placeholder="https://…" />
              </div>
              <div>
                <Label>Instagram <Optional /></Label>
                <input className={inputCls} value={business.instagram} onChange={(e) => setB("instagram", e.target.value)} placeholder="@handle" />
              </div>
              <div>
                <Label>X / Twitter <Optional /></Label>
                <input className={inputCls} value={business.twitter} onChange={(e) => setB("twitter", e.target.value)} placeholder="@handle" />
              </div>
            </div>
            <Nav
              onBack={() => setStep(0)}
              onNext={() =>
                saveAndNext("business", () =>
                  saveBusinessAction({
                    businessType: business.businessType,
                    businessDescription: business.businessDescription,
                    productCategories: business.productCategories,
                    cacNumber: business.cacNumber || null,
                    tin: business.tin || null,
                    yearsInBusiness: business.yearsInBusiness ? Number(business.yearsInBusiness) : null,
                    businessAddress: business.businessAddress || null,
                    website: business.website || null,
                    socialLinks: socialLinks(),
                  })
                )
              }
              saving={saving}
            />
          </div>
        )}

        {/* ── Identity ───────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <Header title="Identity verification" subtitle="Upload one government-issued ID. Stored securely and only seen by our review team." />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>ID type</Label>
                <select className={inputCls} value={identity.idType} onChange={(e) => setI("idType", e.target.value)}>
                  <option value="" disabled>Select…</option>
                  {ID_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <Label>ID number</Label>
                <input className={inputCls} value={identity.idNumber} onChange={(e) => setI("idNumber", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Expiry date <Optional /></Label>
              <input type="date" className={inputCls} value={identity.idExpiry} onChange={(e) => setI("idExpiry", e.target.value)} />
            </div>
            {identity.idType ? (
              <FileUpload
                key={identity.idType}
                type={identity.idType as VerificationDocumentType}
                label="ID document"
                hint="A clear photo or scan of the selected ID"
                initial={
                  initial.identity.document && initial.identity.document.type === identity.idType
                    ? { id: initial.identity.document.id, url: initial.identity.document.url }
                    : null
                }
                onChange={(v) => setHasIdDoc(Boolean(v))}
              />
            ) : (
              <p className="rounded-xl bg-cloud text-mute text-sm px-4 py-3">Choose an ID type to upload your document.</p>
            )}
            <Nav
              onBack={() => setStep(1)}
              onNext={() =>
                saveAndNext("identity", () =>
                  saveIdentityAction({ idType: identity.idType, idNumber: identity.idNumber, idExpiry: identity.idExpiry || null })
                )
              }
              saving={saving}
              nextDisabled={!hasIdDoc}
            />
          </div>
        )}

        {/* ── Bank ───────────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <Header title="Banking details" subtitle="Where we'll send your payouts. Your account number is encrypted at rest." />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Bank name</Label>
                <input className={inputCls} value={bank.bankName} onChange={(e) => setBk("bankName", e.target.value)} />
              </div>
              <div>
                <Label>Account number</Label>
                <input inputMode="numeric" className={inputCls} value={bank.accountNumber} onChange={(e) => setBk("accountNumber", e.target.value)} placeholder="10-digit NUBAN" />
              </div>
            </div>
            <div>
              <Label>Account name</Label>
              <input className={inputCls} value={bank.accountName} onChange={(e) => setBk("accountName", e.target.value)} placeholder="As shown on your bank account" />
            </div>
            <Nav
              onBack={() => setStep(2)}
              onNext={() => saveAndNext("bank", () => saveBankAction(bank))}
              saving={saving}
            />
          </div>
        )}

        {/* ── Review & submit ────────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <Header title="Review & submit" subtitle="Confirm everything looks right, then submit for review." />
            <dl className="rounded-xl ring-1 ring-line divide-y divide-line text-sm">
              <Row label="Name" value={personal.fullLegalName} />
              <Row label="Contact" value={[personal.email, personal.phone].filter(Boolean).join(" · ")} />
              <Row label="Location" value={[personal.city, personal.state, personal.country].filter(Boolean).join(", ")} />
              <Row label="Business type" value={BUSINESS_TYPES.find(([v]) => v === business.businessType)?.[1] ?? "—"} />
              <Row label="Categories" value={`${business.productCategories.length} selected`} />
              <Row label="ID" value={ID_TYPES.find(([v]) => v === identity.idType)?.[1] ?? "—"} />
              <Row label="ID document" value={hasIdDoc ? "Uploaded" : "Missing"} />
              <Row label="Bank" value={[bank.bankName, bank.accountName].filter(Boolean).join(" · ")} />
            </dl>
            <p className="text-xs text-mute">
              By submitting, you confirm the information provided is accurate and that you&apos;re authorised to sell these products.
            </p>
            {error && <p className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setStep(3)} className="rounded-xl bg-cloud hover:bg-line text-ink-soft font-semibold px-5 py-3 transition">
                Back
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="flex-1 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold py-3 transition active:scale-[0.99] disabled:opacity-60"
              >
                {saving ? "Submitting…" : "Submit for review"}
              </button>
            </div>
          </div>
        )}

        {step !== 4 && error && <p className="mt-4 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>}
      </div>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="font-display font-bold text-lg text-ink">{title}</h2>
      <p className="text-sm text-mute mt-0.5">{subtitle}</p>
    </div>
  );
}

function Nav({
  onBack,
  onNext,
  saving,
  nextDisabled,
}: {
  onBack?: () => void;
  onNext: () => void;
  saving: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 pt-1">
      {onBack && (
        <button type="button" onClick={onBack} className="grid place-items-center w-12 h-12 rounded-xl bg-cloud hover:bg-line text-ink-soft transition" aria-label="Back">
          <ChevronLeft width={18} height={18} />
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={saving || nextDisabled}
        className="flex-1 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold py-3 transition active:scale-[0.99] disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save & continue"}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-mute">{label}</dt>
      <dd className="text-ink font-medium text-right truncate">{value || "—"}</dd>
    </div>
  );
}
