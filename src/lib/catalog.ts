import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { type Category, type Product, type EnrichedProduct, enrich } from "@/lib/data";

// Server-only catalog access layer. Everything the storefront shows about
// products/categories now flows through these DB-backed functions instead of the
// static arrays in data.ts. Each is wrapped in React.cache so repeated calls in
// a single request (e.g. the layout + page both needing categories) hit the DB once.

// Prisma rows have `null` for optional columns; the app's Product type uses
// `undefined`. This maps a row to a fully enriched product the UI expects.
type ProductRow = {
  id: string;
  name: string;
  glyph: string;
  gradient: string;
  price: number;
  oldPrice: number | null;
  rating: number;
  reviews: number;
  categoryId: string;
  brand: string;
  badge: string | null;
  stockLeft: number | null;
  stockTotal: number | null;
  tags: string[];
  image: string | null;
};

function toEnriched(row: ProductRow): EnrichedProduct {
  const product: Product = {
    id: row.id,
    name: row.name,
    glyph: row.glyph,
    gradient: row.gradient,
    price: row.price,
    oldPrice: row.oldPrice ?? undefined,
    rating: row.rating,
    reviews: row.reviews,
    categoryId: row.categoryId,
    brand: row.brand,
    badge: row.badge ?? undefined,
    stockLeft: row.stockLeft ?? undefined,
    stockTotal: row.stockTotal ?? undefined,
    tags: row.tags,
    image: row.image ?? undefined,
  };
  return enrich(product);
}

const BY_SORT = { sortOrder: "asc" } as const;
const CATEGORY_FIELDS = { id: true, name: true, glyph: true, gradient: true, image: true } as const;

type CategoryRow = { id: string; name: string; glyph: string; gradient: string; image: string | null };
const toCategory = (c: CategoryRow): Category => ({ ...c, image: c.image ?? undefined });

export const getCategories = cache(async (): Promise<Category[]> => {
  const rows = await prisma.category.findMany({ orderBy: BY_SORT, select: CATEGORY_FIELDS });
  return rows.map(toCategory);
});

export const getCategory = cache(async (id: string): Promise<Category | null> => {
  const row = await prisma.category.findUnique({ where: { id }, select: CATEGORY_FIELDS });
  return row ? toCategory(row) : null;
});

// Only products from approved stores are publicly visible. (getProductsByStore
// is intentionally unfiltered — its callers already control visibility.)
const PUBLIC = { store: { approved: true } } as const;

export const getProduct = cache(async (id: string): Promise<EnrichedProduct | null> => {
  const row = await prisma.product.findFirst({ where: { id, ...PUBLIC } });
  return row ? toEnriched(row) : null;
});

export const getAllProducts = cache(async (): Promise<EnrichedProduct[]> => {
  const rows = await prisma.product.findMany({ where: { ...PUBLIC }, orderBy: BY_SORT });
  return rows.map(toEnriched);
});

export const getProductsByCategory = cache(async (categoryId: string): Promise<EnrichedProduct[]> => {
  const rows = await prisma.product.findMany({ where: { categoryId, ...PUBLIC }, orderBy: BY_SORT });
  return rows.map(toEnriched);
});

export const getProductsByStore = cache(async (storeId: string): Promise<EnrichedProduct[]> => {
  const rows = await prisma.product.findMany({ where: { storeId }, orderBy: BY_SORT });
  return rows.map(toEnriched);
});

const getProductsByTag = cache(async (tag: string): Promise<EnrichedProduct[]> => {
  const rows = await prisma.product.findMany({ where: { tags: { has: tag }, ...PUBLIC }, orderBy: BY_SORT });
  return rows.map(toEnriched);
});

export const getFlashSales = () => getProductsByTag("flash");
export const getTopDeals = () => getProductsByTag("deal");
export const getRecommended = () => getProductsByTag("rec");

export const getDealsAndFlash = cache(async (): Promise<EnrichedProduct[]> => {
  const rows = await prisma.product.findMany({
    where: { tags: { hasSome: ["flash", "deal"] }, ...PUBLIC },
    orderBy: BY_SORT,
  });
  return rows.map(toEnriched);
});

export const getRelatedProducts = cache(
  async (product: { id: string; categoryId: string }, limit = 6): Promise<EnrichedProduct[]> => {
    const rows = await prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, ...PUBLIC },
      orderBy: BY_SORT,
      take: limit,
    });
    return rows.map(toEnriched);
  }
);

export const searchCatalog = cache(async (query: string): Promise<EnrichedProduct[]> => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const [all, categories] = await Promise.all([getAllProducts(), getCategories()]);
  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  const terms = q.split(/\s+/);
  return all.filter((p) => {
    const haystack = `${p.name} ${p.brand} ${nameById.get(p.categoryId) ?? ""}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
});
