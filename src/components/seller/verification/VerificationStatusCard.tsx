import Link from "next/link";
import type { SellerStatus } from "@prisma/client";
import SellerStatusBadge from "@/components/admin/SellerStatusBadge";
import { CheckIcon, ClockIcon, AlertIcon, ShieldIcon } from "@/components/icons";

// Read-only state shown once an application has been submitted (or approved /
// suspended). Drafts and rejected applications get the editable flow instead.

const STEPS = [
  { key: "personal", label: "Personal information" },
  { key: "business", label: "Business information" },
  { key: "identity", label: "Identity upload" },
  { key: "bank", label: "Bank details" },
];

export default function VerificationStatusCard({
  status,
  storeName,
  submittedAt,
  requestedInfo,
}: {
  status: SellerStatus;
  storeName: string;
  submittedAt: Date | null;
  requestedInfo: string | null;
}) {
  if (status === "APPROVED") {
    return (
      <div className="rounded-3xl bg-white ring-1 ring-line overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white p-8 text-center">
          <span className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-white text-emerald-600">
            <CheckIcon width={30} height={30} />
          </span>
          <h2 className="font-display font-extrabold text-2xl mt-4">You&apos;re verified</h2>
          <p className="text-white/80 mt-1">{storeName} is approved to list and sell on ShopLyft.</p>
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-3">
          <Link href="/seller/products/new" className="rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold py-3 text-center transition">
            List a product
          </Link>
          <Link href="/seller" className="rounded-xl bg-cloud hover:bg-line text-ink-soft font-semibold py-3 text-center transition">
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (status === "SUSPENDED") {
    return (
      <div className="rounded-3xl bg-white ring-1 ring-line p-8 text-center">
        <span className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-orange-50 text-orange-600">
          <AlertIcon width={28} height={28} />
        </span>
        <h2 className="font-display font-extrabold text-2xl text-ink mt-4">Account suspended</h2>
        <p className="text-mute mt-1 max-w-md mx-auto">
          Selling on {storeName} has been paused. Please contact support to resolve this and restore your account.
        </p>
        <Link href="/help" className="inline-flex mt-5 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-6 py-3 transition">
          Contact support
        </Link>
      </div>
    );
  }

  // PENDING_REVIEW / UNDER_REVIEW
  return (
    <div className="rounded-3xl bg-white ring-1 ring-line overflow-hidden">
      <div className="bg-gradient-to-br from-ink to-ink-soft text-white p-8">
        <div className="flex items-center justify-between gap-3">
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-white/10 ring-1 ring-white/15">
            <ShieldIcon width={24} height={24} />
          </span>
          <SellerStatusBadge status={status} />
        </div>
        <h2 className="font-display font-extrabold text-2xl mt-4">Application under review</h2>
        <p className="text-white/70 mt-1">
          Thanks for submitting {storeName}. Our team is reviewing your details — we&apos;ll email you the moment it&apos;s decided.
        </p>
        {submittedAt && (
          <p className="text-white/50 text-xs mt-3">Submitted {submittedAt.toLocaleDateString()}</p>
        )}
      </div>

      <div className="p-6">
        {requestedInfo && (
          <p className="mb-4 rounded-xl bg-amber-50 text-amber-800 text-sm px-4 py-3">
            <span className="font-semibold">More information requested:</span> {requestedInfo}
          </p>
        )}
        <ul className="space-y-3">
          {STEPS.map((s) => (
            <li key={s.key} className="flex items-center gap-3">
              <span className="grid place-items-center w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                <CheckIcon width={15} height={15} />
              </span>
              <span className="text-sm text-ink">{s.label}</span>
            </li>
          ))}
          <li className="flex items-center gap-3">
            <span className="grid place-items-center w-7 h-7 rounded-full bg-amber-50 text-amber-600 shrink-0">
              <ClockIcon width={15} height={15} />
            </span>
            <span className="text-sm font-medium text-ink">Awaiting admin review</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
