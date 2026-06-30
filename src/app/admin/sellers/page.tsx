import Link from "next/link";
import type { SellerStatus } from "@prisma/client";
import { listVerifications, getStatusCounts } from "@/lib/admin";
import SellerStatusBadge from "@/components/admin/SellerStatusBadge";
import StatusTabs from "@/components/admin/StatusTabs";
import { ChevronRight, StoreIcon, PackageIcon } from "@/components/icons";

const VALID = new Set<string>([
  "queue", "all", "DRAFT", "PENDING_REVIEW", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED",
]);

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = (status && VALID.has(status) ? status : "queue") as SellerStatus | "all" | "queue";

  const [rows, counts] = await Promise.all([listVerifications(filter), getStatusCounts()]);

  // Tab counts: real statuses from groupBy, plus the two derived tabs.
  const tabCounts: Record<string, number> = {
    ...counts,
    queue: counts.PENDING_REVIEW + counts.UNDER_REVIEW,
    all: Object.values(counts).reduce((a, b) => a + b, 0),
  };

  return (
    <div className="mx-auto max-w-[1100px] px-3 sm:px-5 py-6 sm:py-8">
      <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">Seller applications</h1>
      <p className="text-mute text-sm mt-1">Approve, reject or suspend stores. Approving makes a store&apos;s products go live.</p>

      <div className="mt-5">
        <StatusTabs active={filter} counts={tabCounts} />
      </div>

      {rows.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {rows.map((v) => (
            <li key={v.id}>
              <Link
                href={`/admin/sellers/${v.id}`}
                className="flex items-center gap-4 rounded-2xl bg-white ring-1 ring-line p-4 sm:p-5 hover:ring-brand/40 transition"
              >
                <span className="grid place-items-center w-11 h-11 rounded-xl bg-cloud text-mute shrink-0">
                  <StoreIcon width={20} height={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-ink truncate">{v.store.name}</p>
                  <p className="text-sm text-mute truncate">
                    {v.store.owner?.name ? `${v.store.owner.name} · ` : ""}{v.store.owner?.email ?? "no owner"}
                  </p>
                </div>
                <span className="hidden sm:flex items-center gap-1.5 text-sm text-mute shrink-0">
                  <PackageIcon width={15} height={15} /> {v.store._count.products}
                </span>
                <span className="hidden md:block text-xs text-mute shrink-0 w-28 text-right">
                  {v.submittedAt
                    ? new Date(v.submittedAt).toLocaleDateString("en-NG", { dateStyle: "medium" })
                    : "—"}
                </span>
                <SellerStatusBadge status={v.status} />
                <ChevronRight width={16} height={16} className="text-mute shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 text-center rounded-2xl bg-white ring-1 ring-line py-14">
          <span className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-cloud text-mute">
            <StoreIcon width={24} height={24} />
          </span>
          <p className="text-mute text-sm mt-3">No applications in this view.</p>
        </div>
      )}
    </div>
  );
}
