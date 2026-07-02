import { requireSeller } from "@/lib/rbac";
import { listStoreReturns } from "@/lib/returns";
import Breadcrumbs from "@/components/Breadcrumbs";
import ReturnsQueue from "@/components/seller/ReturnsQueue";

export const metadata = { title: "Returns — Seller Center" };

export default async function SellerReturnsPage() {
  const { store } = await requireSeller();
  const returns = await listStoreReturns(store.id);

  const rows = returns.map((r) => ({
    id: r.id,
    orderShort: r.orderId.slice(-8).toUpperCase(),
    buyerName: r.order.name,
    reason: r.reason,
    detail: r.detail,
    status: r.status,
    refundAmount: r.refundAmount,
    units: r.items.reduce((a, it) => a + it.qty, 0),
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Seller Dashboard", href: "/seller" }, { label: "Returns" }]} />
      <h1 className="mt-4 font-display font-extrabold text-2xl sm:text-3xl text-ink">Returns &amp; refunds</h1>
      <p className="text-mute text-sm mt-1">Review return requests, mark items received, and issue refunds.</p>
      <div className="mt-6">
        <ReturnsQueue initial={rows} />
      </div>
    </div>
  );
}
