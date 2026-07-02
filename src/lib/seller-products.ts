import "server-only";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

// Seller-owned product mutations. Every function is scoped to a storeId so a
// seller can only ever touch their own products (ownership enforced server-side).

// Prototype-only visual fields (glyph/gradient) get neutral defaults — seller
// products are shown by their uploaded image, not these fallbacks.
const DEFAULT_GRADIENT = "from-stone-200 to-stone-400";

// Trust tiering: a store auto-publishes new listings once it has this many
// products already live. Below the threshold, each new listing is held for an
// admin to approve — so a seller's first few products are always reviewed.
export const TRUST_THRESHOLD = 3;

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

// Whether a store is trusted enough to auto-publish (has ≥ TRUST_THRESHOLD
// products already live).
export async function isTrustedStore(storeId: string): Promise<boolean> {
  const live = await prisma.product.count({ where: { storeId, status: "PUBLISHED" } });
  return live >= TRUST_THRESHOLD;
}

export async function createProduct(storeId: string, data: ProductInput) {
  // Trusted stores publish immediately; everyone else's listing waits for review.
  const status = (await isTrustedStore(storeId)) ? "PUBLISHED" : "PENDING";
  const product = await prisma.product.create({
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
      // Freshly listed products carry the "new" tag so the storefront can show a
      // "New" badge. Sellers can't set flash/deal/rec — those are curated.
      tags: ["new"],
      status,
    },
  });
  return product;
}

// Seller-facing listing for the dashboard — includes every status (PENDING,
// PUBLISHED, REJECTED, TAKEN_DOWN) so a seller sees their own held/declined
// products, unlike the public catalog which only shows PUBLISHED.
export async function listSellerProducts(storeId: string) {
  return prisma.product.findMany({
    where: { storeId },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      price: true,
      stockLeft: true,
      status: true,
      moderationNote: true,
    },
  });
}

export async function updateProduct(storeId: string, productId: string, data: ProductInput) {
  const existing = await getSellerProduct(storeId, productId);
  if (!existing) return null;
  // The form's "Stock" field is the available quantity (it's prefilled from
  // stockLeft). Set stockLeft to it, but only ever GROW stockTotal — otherwise
  // editing an unrelated field (name, price, image) would reset stockLeft and
  // resurrect already-sold units. stockTotal is the lifetime denominator used
  // for the "% sold" display.
  const stockTotal = Math.max(existing.stockTotal ?? 0, data.stock);
  return prisma.product.update({
    where: { id: productId },
    data: {
      name: data.name,
      brand: data.brand,
      categoryId: data.categoryId,
      price: data.price,
      oldPrice: data.oldPrice ?? null,
      stockLeft: data.stock,
      stockTotal,
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
