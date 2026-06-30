import Link from "next/link";
import { notFound } from "next/navigation";
import { getVerificationDetail } from "@/lib/admin";
import SellerStatusBadge from "@/components/admin/SellerStatusBadge";
import ReviewActions from "@/components/admin/ReviewActions";
import AddNoteForm from "@/components/admin/AddNoteForm";
import {
  StoreIcon, UserCircleIcon, BriefcaseIcon, IdIcon, BankIcon, DocumentIcon,
  ClockIcon, ExternalLinkIcon, AlertIcon, ChevronLeft,
} from "@/components/icons";

// Turns SCREAMING_SNAKE enum values into readable text.
function pretty(value: string | null | undefined): string {
  if (!value) return "—";
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

const ACTION_LABEL: Record<string, string> = {
  SUBMITTED: "Application submitted",
  UNDER_REVIEW: "Review started",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
  INFO_REQUESTED: "Information requested",
  RESUBMITTED: "Resubmitted",
  NOTE_ADDED: "Note added",
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2">
      <dt className="text-xs text-mute">{label}</dt>
      <dd className="text-sm text-ink mt-0.5 break-words">{value || "—"}</dd>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white ring-1 ring-line p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-display font-bold text-ink mb-2">
        <span className="text-brand">{icon}</span> {title}
      </h2>
      {children}
    </section>
  );
}

export default async function AdminSellerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await getVerificationDetail(id);
  if (!v) notFound();

  const p = v.profile;
  const store = v.store;

  return (
    <div className="mx-auto max-w-[1100px] px-3 sm:px-5 py-6 sm:py-8">
      <Link href="/admin/sellers" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
        <ChevronLeft width={15} height={15} /> All applications
      </Link>

      {/* header */}
      <div className="mt-3 rounded-2xl bg-white ring-1 ring-line p-5 sm:p-6 flex flex-wrap items-center gap-4">
        <span className="grid place-items-center w-14 h-14 rounded-2xl bg-cloud text-mute shrink-0">
          <StoreIcon width={26} height={26} />
        </span>
        <div className="min-w-0">
          <h1 className="font-display font-extrabold text-2xl text-ink truncate">{store.name}</h1>
          <Link href={`/store/${store.slug}`} className="inline-flex items-center gap-1 text-sm text-mute hover:text-brand transition">
            /store/{store.slug} <ExternalLinkIcon width={13} height={13} />
          </Link>
        </div>
        <div className="ml-auto"><SellerStatusBadge status={v.status} /></div>
      </div>

      {/* status notices */}
      {v.requestedInfo && (
        <p className="mt-3 flex gap-2 rounded-xl bg-blue-50 text-blue-800 text-sm px-4 py-3">
          <AlertIcon width={18} height={18} className="shrink-0 mt-0.5" />
          <span><b>Information requested:</b> {v.requestedInfo}</span>
        </p>
      )}
      {v.status === "REJECTED" && v.rejectionReason && (
        <p className="mt-3 flex gap-2 rounded-xl bg-red-50 text-red-800 text-sm px-4 py-3">
          <AlertIcon width={18} height={18} className="shrink-0 mt-0.5" />
          <span><b>Rejection reason:</b> {v.rejectionReason}</span>
        </p>
      )}

      {/* actions */}
      <div className="mt-4 rounded-2xl bg-white ring-1 ring-line p-5 sm:p-6">
        <h2 className="font-display font-bold text-ink mb-3">Decision</h2>
        <ReviewActions id={v.id} status={v.status} />
      </div>

      <div className="mt-4 grid lg:grid-cols-[1fr_320px] gap-4 items-start">
        {/* left: application details */}
        <div className="space-y-4">
          <Section icon={<UserCircleIcon width={18} height={18} />} title="Seller">
            <dl className="grid sm:grid-cols-2 gap-x-6">
              <Field label="Account name" value={store.owner?.name} />
              <Field label="Account email" value={store.owner?.email} />
              <Field label="Account phone" value={store.owner?.phone} />
              <Field label="Joined" value={fmtDate(store.owner?.createdAt)} />
              <Field label="Full legal name" value={p.fullLegalName} />
              <Field label="Date of birth" value={p.dateOfBirth ? fmtDate(p.dateOfBirth).split(",")[0] : null} />
              <Field label="Gender" value={pretty(p.gender)} />
              <Field label="Residential address" value={p.residentialAddress} />
              <Field label="City / State" value={[p.city, p.state].filter(Boolean).join(", ") || null} />
              <Field label="Country" value={p.country} />
            </dl>
          </Section>

          <Section icon={<BriefcaseIcon width={18} height={18} />} title="Business">
            <dl className="grid sm:grid-cols-2 gap-x-6">
              <Field label="Business type" value={pretty(p.businessType)} />
              <Field label="CAC number" value={p.cacNumber} />
              <Field label="TIN" value={p.tin} />
              <Field label="Years in business" value={p.yearsInBusiness?.toString()} />
              <Field label="Business address" value={p.businessAddress} />
              <Field label="Website" value={p.website} />
              <Field label="Categories" value={p.productCategories?.length ? p.productCategories.join(", ") : null} />
              <Field label="Description" value={p.businessDescription} />
            </dl>
          </Section>

          <div className="grid sm:grid-cols-2 gap-4">
            <Section icon={<IdIcon width={18} height={18} />} title="Identity">
              <dl>
                <Field label="ID type" value={pretty(p.idType)} />
                <Field label="ID number" value={v.sensitive.idNumber} />
                <Field label="ID expiry" value={p.idExpiry ? fmtDate(p.idExpiry).split(",")[0] : null} />
              </dl>
            </Section>
            <Section icon={<BankIcon width={18} height={18} />} title="Bank (payouts)">
              <dl>
                <Field label="Bank" value={p.bankName} />
                <Field label="Account name" value={p.accountName} />
                <Field label="Account number" value={v.sensitive.accountNumber} />
              </dl>
            </Section>
          </div>

          <Section icon={<DocumentIcon width={18} height={18} />} title={`Documents (${v.documents.length})`}>
            {v.documents.length > 0 ? (
              <ul className="divide-y divide-line">
                {v.documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-sm text-ink">{pretty(d.type)}</span>
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
                      View <ExternalLinkIcon width={13} height={13} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-mute">No documents uploaded yet. Document upload arrives with Cloudinary (Phase 8).</p>
            )}
          </Section>
        </div>

        {/* right: store + audit + notes */}
        <div className="space-y-4">
          <Section icon={<StoreIcon width={18} height={18} />} title="Store">
            <dl>
              <Field label="Products" value={store._count.products.toString()} />
              <Field label="Publicly live" value={store.approved ? "Yes" : "No"} />
              <Field label="Created" value={fmtDate(store.createdAt)} />
              <Field label="Description" value={store.description} />
            </dl>
          </Section>

          <Section icon={<ClockIcon width={18} height={18} />} title="Activity">
            <ol className="space-y-3">
              {v.history.map((h) => (
                <li key={h.id} className="text-sm">
                  <p className="font-medium text-ink">{ACTION_LABEL[h.action] ?? pretty(h.action)}</p>
                  <p className="text-xs text-mute">
                    {fmtDate(h.createdAt)}
                    {h.admin?.name ? ` · ${h.admin.name}` : h.adminId ? "" : " · seller"}
                  </p>
                  {h.reason && <p className="text-xs text-ink-soft mt-0.5 italic">“{h.reason}”</p>}
                </li>
              ))}
            </ol>
          </Section>

          <Section icon={<DocumentIcon width={18} height={18} />} title={`Internal notes (${v.notes.length})`}>
            <AddNoteForm id={v.id} />
            {v.notes.length > 0 && (
              <ul className="mt-4 space-y-3">
                {v.notes.map((n) => (
                  <li key={n.id} className="rounded-xl bg-cloud p-3">
                    <p className="text-sm text-ink whitespace-pre-wrap">{n.body}</p>
                    <p className="text-xs text-mute mt-1">{n.admin?.name ?? "Admin"} · {fmtDate(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
