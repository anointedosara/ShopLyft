import "server-only";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

// Seller-owned product mutations. Every function is scoped to a storeId so a
// seller can only ever touch their own products (ownership enforced server-side).

// Prototype-only visual fields (glyph/gradient) get neutral defaults — seller
// products are shown by their uploaded image, not these fallbacks.
const DEFAULT_GRADIENT = "from-stone-200 to-stone-400";

export type ProductInput = {
  name: string;
  brand: string;
  categoryId: string;
  price: number;
  oldPrice?: number | null;
  stock: number;
  image?: string | null;
};

export async function getSellerProduct(storeId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.storeId !== storeId) return null;
  return product;
}

export async function createProduct(storeId: string, data: ProductInput) {
  return prisma.product.create({
    data: {
      id: randomUUID(),
      name: data.name,
      brand: data.brand,
      categoryId: data.categoryId,
      storeId,
      price: data.price,
      oldPrice: data.oldPrice ?? null,
      stockLeft: data.stock,
      stockTotal: data.stock,
      image: data.image ?? null,
      glyph: "",
      gradient: DEFAULT_GRADIENT,
      rating: 0,
      reviews: 0,
      tags: [],
    },
  });
}

export async function updateProduct(storeId: string, productId: string, data: ProductInput) {
  const existing = await getSellerProduct(storeId, productId);
  if (!existing) return null;
  return prisma.product.update({
    where: { id: productId },
    data: {
      name: data.name,
      brand: data.brand,
      categoryId: data.categoryId,
      price: data.price,
      oldPrice: data.oldPrice ?? null,
      stockLeft: data.stock,
      stockTotal: data.stock,
      image: data.image ?? null,
    },
  });
}

export async function deleteProduct(storeId: string, productId: string) {
  const existing = await getSellerProduct(storeId, productId);
  if (!existing) return { ok: false as const, reason: "not_found" as const };
  try {
    await prisma.product.delete({ where: { id: productId } });
    return { ok: true as const };
  } catch {
    // FK restrict — the product is referenced by existing order items.
    return { ok: false as const, reason: "has_orders" as const };
  }
}
