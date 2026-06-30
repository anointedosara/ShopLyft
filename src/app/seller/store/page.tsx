import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/orders";
import { getStoreByOwner } from "@/lib/stores";
import Breadcrumbs from "@/components/Breadcrumbs";
import StoreProfileForm from "@/components/seller/StoreProfileForm";

export const metadata = { title: "Store profile — ShopLyft" };

export default async function StoreProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const store = await getStoreByOwner(user.id);
  if (!store) redirect("/sell");

  return (
    <div className="mx-auto max-w-[640px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Seller Dashboard", href: "/seller" }, { label: "Store profile" }]} />
      <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink mt-4 mb-1">Store profile</h1>
      <p className="text-mute text-sm mb-5">Your public store address is <span className="font-medium text-ink-soft">/store/{store.slug}</span></p>
      <div className="rounded-2xl bg-white ring-1 ring-line p-6 sm:p-8">
        <StoreProfileForm initial={{ name: store.name, description: store.description, logo: store.logo }} />
      </div>
    </div>
  );
}
