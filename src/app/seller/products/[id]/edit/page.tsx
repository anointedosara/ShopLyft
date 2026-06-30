import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/orders";
import { getStoreByOwner } from "@/lib/stores";
import { getSellerProduct } from "@/lib/seller-products";
import { getCategories } from "@/lib/catalog";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductForm from "@/components/seller/ProductForm";

export const metadata = { title: "Edit product — ShopLyft" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const store = await getStoreByOwner(user.id);
  if (!store) redirect("/sell");

  const product = await getSellerProduct(store.id, id);
  if (!product) notFound();

  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-[760px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Seller Dashboard", href: "/seller" }, { label: "Edit product" }]} />
      <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink mt-4 mb-5">Edit product</h1>
      <div className="rounded-2xl bg-white ring-1 ring-line p-6 sm:p-8">
        <ProductForm
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          productId={product.id}
          initial={{
            name: product.name,
            brand: product.brand,
            categoryId: product.categoryId,
            price: product.price,
            oldPrice: product.oldPrice,
            stock: product.stockLeft ?? 0,
            image: product.image,
          }}
        />
      </div>
    </div>
  );
}
