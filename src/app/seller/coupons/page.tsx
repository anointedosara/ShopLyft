import { requireSeller } from "@/lib/rbac";
import { listCoupons } from "@/lib/seller/coupons";
import Breadcrumbs from "@/components/Breadcrumbs";
import CouponManager from "@/components/seller/CouponManager";

export const metadata = { title: "Coupons — Seller Center" };

export default async function SellerCouponsPage() {
  const { store } = await requireSeller();
  const coupons = await listCoupons(store.id);

  const rows = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    minSpend: c.minSpend,
    maxUses: c.maxUses,
    perUserLimit: c.perUserLimit,
    usedCount: c.usedCount,
    redemptions: c._count.redemptions,
    startsAt: c.startsAt ? c.startsAt.toISOString() : null,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    active: c.active,
  }));

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Seller Dashboard", href: "/seller" }, { label: "Coupons" }]} />
      <h1 className="mt-4 font-display font-extrabold text-2xl sm:text-3xl text-ink">Coupons &amp; discounts</h1>
      <p className="text-mute text-sm mt-1">Create codes buyers can apply at checkout. Usage limits are enforced automatically.</p>
      <div className="mt-6">
        <CouponManager initial={rows} />
      </div>
    </div>
  );
}
