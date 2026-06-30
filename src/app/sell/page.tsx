import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/orders";
import { getStoreByOwner } from "@/lib/stores";
import Breadcrumbs from "@/components/Breadcrumbs";
import StoreOnboardingForm from "@/components/seller/StoreOnboardingForm";
import { StoreIcon, TruckIcon, ShieldIcon, BoltIcon } from "@/components/icons";

export const metadata = { title: "Sell on ShopLyft" };

const perks = [
  { icon: <StoreIcon width={20} height={20} />, title: "Your own storefront", text: "A branded store page buyers can browse." },
  { icon: <BoltIcon width={20} height={20} />, title: "Reach more buyers", text: "List your products to the whole marketplace." },
  { icon: <TruckIcon width={20} height={20} />, title: "Simple order management", text: "Track and fulfil orders in one place." },
  { icon: <ShieldIcon width={20} height={20} />, title: "Secure payouts", text: "Payments handled safely via Paystack." },
];

export default async function SellPage() {
  const user = await getSessionUser();

  // Logged-out: pitch + sign-in / create-seller-account CTAs.
  if (!user) {
    return (
      <div className="mx-auto max-w-[760px] px-3 sm:px-5 py-5 sm:py-8">
        <Breadcrumbs items={[{ label: "Sell on ShopLyft" }]} />
        <div className="mt-4 rounded-3xl bg-gradient-to-br from-ink to-ink-soft text-white p-8 sm:p-10">
          <span className="grid place-items-center w-14 h-14 rounded-2xl bg-white/10 ring-1 ring-white/15">
            <StoreIcon width={26} height={26} />
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl mt-4">Start selling on ShopLyft</h1>
          <p className="text-white/70 mt-2 max-w-md">Open a store, list your products, and reach buyers across the marketplace.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup" className="rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-6 py-3 transition">Create a seller account</Link>
            <Link href="/login" className="rounded-xl bg-white/10 ring-1 ring-white/20 hover:bg-white/20 text-white font-semibold px-6 py-3 transition">Sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  // Already a seller → straight to the dashboard.
  const store = await getStoreByOwner(user.id);
  if (store) redirect("/seller");

  return (
    <div className="mx-auto max-w-[760px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Sell on ShopLyft" }]} />
      <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink mt-4">Set up your store</h1>
      <p className="text-mute mt-1">Just a name to get started — you can refine everything later.</p>

      <div className="mt-6 grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="rounded-2xl bg-white ring-1 ring-line p-6 sm:p-8">
          <StoreOnboardingForm />
        </div>
        <aside className="rounded-2xl bg-white ring-1 ring-line p-6 h-fit">
          <h2 className="font-display font-bold text-ink mb-4">Why sell with us</h2>
          <ul className="space-y-4">
            {perks.map((p) => (
              <li key={p.title} className="flex items-start gap-3">
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-50 text-brand shrink-0">{p.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-ink">{p.title}</p>
                  <p className="text-xs text-mute">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
