import { requireSeller } from "@/lib/rbac";
import { getWalletSummary, listWalletTransactions, listWithdrawals } from "@/lib/seller/wallet";
import { formatNaira } from "@/lib/data";
import Breadcrumbs from "@/components/Breadcrumbs";
import WithdrawForm from "@/components/seller/WithdrawForm";
import { WalletIcon, ClockIcon, BankIcon } from "@/components/icons";

export const metadata = { title: "Wallet — Seller Center" };

const TXN_LABEL: Record<string, string> = {
  SALE: "Sale",
  RELEASE: "Funds released",
  WITHDRAWAL: "Withdrawal",
  REFUND: "Refund",
  ADJUSTMENT: "Adjustment",
  FEE: "Platform fee",
};

const WITHDRAWAL_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  PAID: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
};

export default async function SellerWalletPage() {
  const { store } = await requireSeller();
  const [summary, txns, withdrawals] = await Promise.all([
    getWalletSummary(store.id),
    listWalletTransactions(store.id, 25),
    listWithdrawals(store.id),
  ]);

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Seller Dashboard", href: "/seller" }, { label: "Wallet" }]} />

      <h1 className="mt-4 font-display font-extrabold text-2xl sm:text-3xl text-ink">Wallet</h1>
      <p className="text-mute text-sm mt-1">
        Sales land in <span className="font-medium text-ink">pending</span> during the buyer-protection window, then move
        to <span className="font-medium text-ink">available</span> for withdrawal.
      </p>

      {/* balances */}
      <section className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-ink to-ink-soft text-white p-5">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-white/10"><WalletIcon width={18} height={18} /></span>
          <p className="mt-3 font-display font-extrabold text-2xl">{formatNaira(summary.available)}</p>
          <p className="text-white/60 text-sm">Available</p>
        </div>
        <div className="rounded-2xl bg-white ring-1 ring-line p-5">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-amber-100 text-amber-600"><ClockIcon width={18} height={18} /></span>
          <p className="mt-3 font-display font-extrabold text-2xl text-ink">{formatNaira(summary.pending)}</p>
          <p className="text-mute text-sm">Pending</p>
        </div>
        <div className="rounded-2xl bg-white ring-1 ring-line p-5">
          <p className="mt-1 font-display font-extrabold text-2xl text-ink">{formatNaira(summary.lifetimeEarned)}</p>
          <p className="text-mute text-sm">Lifetime earned</p>
        </div>
        <div className="rounded-2xl bg-white ring-1 ring-line p-5">
          <p className="mt-1 font-display font-extrabold text-2xl text-ink">{formatNaira(summary.withdrawn)}</p>
          <p className="text-mute text-sm">Withdrawn</p>
        </div>
      </section>

      <div className="mt-6 grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* ledger */}
        <section className="rounded-2xl bg-white ring-1 ring-line p-5 sm:p-6 order-2 lg:order-1">
          <h2 className="font-display font-bold text-ink mb-4">Transactions</h2>
          {txns.items.length > 0 ? (
            <ul className="divide-y divide-line">
              {txns.items.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink text-sm">{TXN_LABEL[t.type] ?? t.type}</p>
                    <p className="text-mute text-xs truncate">{t.note ?? new Date(t.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-semibold text-sm shrink-0 ${t.amount < 0 ? "text-red-600" : "text-green-600"}`}>
                    {t.amount < 0 ? "−" : "+"}
                    {formatNaira(Math.abs(t.amount))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-mute text-sm py-6 text-center">No transactions yet. Your sales will appear here.</p>
          )}
        </section>

        {/* withdraw + history */}
        <div className="order-1 lg:order-2 space-y-4">
          <WithdrawForm available={summary.available} />
          <section className="rounded-2xl bg-white ring-1 ring-line p-5">
            <h2 className="font-display font-bold text-ink mb-3 flex items-center gap-2">
              <BankIcon width={18} height={18} /> Withdrawals
            </h2>
            {withdrawals.length > 0 ? (
              <ul className="space-y-2">
                {withdrawals.map((w) => (
                  <li key={w.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-ink font-medium">{formatNaira(w.amount)}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${WITHDRAWAL_STYLE[w.status] ?? "bg-cloud text-mute"}`}>
                      {w.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-mute text-sm">No withdrawals yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
