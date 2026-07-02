import { requireSeller } from "@/lib/rbac";
import { listShippingZones } from "@/lib/seller/settings";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShippingManager from "@/components/seller/ShippingManager";

export const metadata = { title: "Shipping — Seller Center" };

export default async function SellerShippingPage() {
  const { store } = await requireSeller();
  const zones = await listShippingZones(store.id);

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Seller Dashboard", href: "/seller" }, { label: "Shipping" }]} />
      <h1 className="mt-4 font-display font-extrabold text-2xl sm:text-3xl text-ink">Shipping zones &amp; rates</h1>
      <p className="text-mute text-sm mt-1">Group regions into zones and set delivery rates and estimated days for each.</p>
      <div className="mt-6">
        <ShippingManager
          initial={zones.map((z) => ({
            id: z.id,
            name: z.name,
            regions: z.regions,
            rates: z.rates.map((r) => ({
              id: r.id,
              method: r.method,
              price: r.price,
              freeOver: r.freeOver,
              minDays: r.minDays,
              maxDays: r.maxDays,
            })),
          }))}
        />
      </div>
    </div>
  );
}
