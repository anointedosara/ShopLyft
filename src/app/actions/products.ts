"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/orders";
import { getStoreByOwner } from "@/lib/stores";
import { createProduct, updateProduct, deleteProduct, type ProductInput } from "@/lib/seller-products";

export type ProductFormValues = {
  name: string;
  brand?: string;
  categoryId: string;
  price: number;
  oldPrice?: number | null;
  stock: number;
  image?: string;
};

type ActionResult =
  | { ok: true; id?: string; status?: "PENDING" | "PUBLISHED" }
  | { ok: false; error: string };

async function requireStore() {
  const user = await getSessionUser();
  if (!user) return null;
  return getStoreByOwner(user.id);
}

// Prohibited-goods screen — an automated guardrail that runs for every seller,
// trusted or not. A hit is a hard reject (not just a review hold).
const BANNED_TERMS = [
  "gun", "firearm", "rifle", "pistol", "ammo", "ammunition",
  "cocaine", "heroin", "meth", "cannabis", "weed", "narcotic",
  "counterfeit", "fake id", "human", "organ",
];
const MAX_PRICE = 1_000_000_000; // ₦1bn — anything above is a fat-finger

function screenContent(text: string): string | null {
  const hay = text.toLowerCase();
  const hit = BANNED_TERMS.find((t) => new RegExp(`\\b${t}\\b`).test(hay));
  return hit ? `"${hit}" isn't allowed on ShopLyft. Prohibited items can't be listed.` : null;
}

function validate(v: ProductFormValues): { ok: true; data: ProductInput } | { ok: false; error: string } {
  const name = v.name?.trim();
  if (!name) return { ok: false, error: "Product name is required." };
  if (!v.categoryId) return { ok: false, error: "Choose a category." };
  if (!Number.isFinite(v.price) || v.price <= 0) return { ok: false, error: "Enter a valid price." };
  if (v.price > MAX_PRICE) return { ok: false, error: "That price looks too high — please check it." };
  if (!Number.isFinite(v.stock) || v.stock < 0) return { ok: false, error: "Enter a valid stock quantity." };
  if (v.oldPrice != null && v.oldPrice !== 0 && v.oldPrice <= v.price) {
    return { ok: false, error: "Original price should be higher than the selling price." };
  }
  const banned = screenContent(`${name} ${v.brand ?? ""}`);
  if (banned) return { ok: false, error: banned };
  return {
    ok: true,
    data: {
      name,
      brand: v.brand?.trim() || name,
      categoryId: v.categoryId,
      price: Math.round(v.price),
      oldPrice: v.oldPrice ? Math.round(v.oldPrice) : null,
      stock: Math.round(v.stock),
      image: v.image?.trim() || null,
    },
  };
}

export async function createProductAction(values: ProductFormValues): Promise<ActionResult> {
  const store = await requireStore();
  if (!store) return { ok: false, error: "You need a seller store first." };
  // Gate: a store only goes `approved` once its seller verification is APPROVED.
  if (!store.approved) {
    return { ok: false, error: "Your store must be verified before you can list products." };
  }
  const v = validate(values);
  if (!v.ok) return v;
  // Guardrail: a listing needs a photo before it can go live.
  if (!v.data.image) return { ok: false, error: "Add a product photo before listing." };
  try {
    const product = await createProduct(store.id, v.data);
    // Surface the new product across the storefront right away (a PUBLISHED one,
    // anyway — a PENDING one is held, but revalidating is harmless).
    revalidatePath("/seller");
    revalidatePath("/products");
    revalidatePath(`/category/${v.data.categoryId}`);
    revalidatePath("/");
    revalidatePath("/admin/products");
    return { ok: true, id: product.id, status: product.status as "PENDING" | "PUBLISHED" };
  } catch {
    return { ok: false, error: "Could not create the product. Please try again." };
  }
}

export async function updateProductAction(productId: string, values: ProductFormValues): Promise<ActionResult> {
  const store = await requireStore();
  if (!store) return { ok: false, error: "You need a seller store first." };
  const v = validate(values);
  if (!v.ok) return v;
  const updated = await updateProduct(store.id, productId, v.data);
  if (!updated) return { ok: false, error: "Product not found." };
  revalidatePath("/seller");
  return { ok: true, id: productId };
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  const store = await requireStore();
  if (!store) return { ok: false, error: "You need a seller store first." };
  const res = await deleteProduct(store.id, productId);
  if (!res.ok) {
    return { ok: false, error: res.reason === "has_orders" ? "This product has orders and can't be deleted." : "Product not found." };
  }
  revalidatePath("/seller");
  return { ok: true };
}
