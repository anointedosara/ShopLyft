import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/orders";
import { getStoreByOwner } from "@/lib/stores";
import { getCategories } from "@/lib/catalog";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductForm from "@/components/seller/ProductForm";

export const metadata = { title: "Add product — ShopLyft" };

export default async function NewProductPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const store = await getStoreByOwner(user.id);
  if (!store) redirect("/sell");
  // Only verified (approved) sellers may list products.
  if (!store.approved) redirect("/seller/verification");

  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-[760px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Seller Dashboard", href: "/seller" }, { label: "Add product" }]} />
      <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink mt-4 mb-5">Add a product</h1>
      <div className="rounded-2xl bg-white ring-1 ring-line p-6 sm:p-8">
        <ProductForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
      </div>
    </div>
  );
}
