import { requireSeller } from "@/lib/rbac";
import { getStoreSettings, listTaxRates } from "@/lib/seller/settings";
import Breadcrumbs from "@/components/Breadcrumbs";
import SettingsForm from "@/components/seller/SettingsForm";
import TaxManager from "@/components/seller/TaxManager";

export const metadata = { title: "Settings — Seller Center" };

export default async function SellerSettingsPage() {
  const { store } = await requireSeller();
  const [settings, taxes] = await Promise.all([getStoreSettings(store.id), listTaxRates(store.id)]);

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Seller Dashboard", href: "/seller" }, { label: "Settings" }]} />
      <h1 className="mt-4 font-display font-extrabold text-2xl sm:text-3xl text-ink">Store settings</h1>
      <p className="text-mute text-sm mt-1">Fulfilment defaults, support contacts, payout details and tax.</p>

      <div className="mt-6 space-y-6">
        <SettingsForm
          initial={{
            processingDays: settings.processingDays,
            returnWindowDays: settings.returnWindowDays,
            autoAcceptReturns: settings.autoAcceptReturns,
            supportEmail: settings.supportEmail,
            supportPhone: settings.supportPhone,
            payoutBankName: settings.payoutBankName,
            payoutAccountName: settings.payoutAccountName,
            vacationMode: settings.vacationMode,
          }}
        />
        <TaxManager
          initial={taxes.map((t) => ({
            id: t.id,
            name: t.name,
            region: t.region,
            percent: t.percent,
            inclusive: t.inclusive,
            active: t.active,
          }))}
        />
      </div>
    </div>
  );
}
