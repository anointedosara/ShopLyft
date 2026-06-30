import "server-only";
import { prisma } from "@/lib/db";

// Store (seller storefront) data access.

function baseSlug(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "store"
  );
}

async function uniqueSlug(name: string) {
  const base = baseSlug(name);
  let slug = base;
  let n = 1;
  // Append -2, -3, … until the slug is free.
  while (await prisma.store.findUnique({ where: { slug }, select: { id: true } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function getStoreByOwner(userId: string) {
  return prisma.store.findUnique({ where: { ownerId: userId } });
}

export async function getStoreBySlug(slug: string) {
  return prisma.store.findUnique({ where: { slug } });
}

// Creates a seller's store and promotes them to SELLER in one transaction.
// Store starts unapproved. The SellerVerification (KYC) is created lazily as a
// DRAFT by ensureVerificationForUser when the seller first opens
// /seller/verification — it only enters the admin review queue once they submit.
export async function createStoreForUser(
  userId: string,
  data: { name: string; description?: string | null }
) {
  const slug = await uniqueSlug(data.name);
  return prisma.$transaction(async (tx) => {
    const store = await tx.store.create({
      data: {
        name: data.name,
        slug,
        description: data.description ?? null,
        approved: false,
        ownerId: userId,
      },
    });
    await tx.user.update({ where: { id: userId }, data: { role: "SELLER" } });
    return store;
  });
}

// Updates the caller's own store (looked up by ownerId). Slug stays stable so
// existing store links don't break on rename.
export async function updateStoreForOwner(
  userId: string,
  data: { name: string; description?: string | null; logo?: string | null }
) {
  const store = await prisma.store.findUnique({ where: { ownerId: userId }, select: { id: true } });
  if (!store) return null;
  return prisma.store.update({
    where: { id: store.id },
    data: { name: data.name, description: data.description ?? null, logo: data.logo ?? null },
  });
}

// Public directory: approved stores only, with how many products each has.
export async function getApprovedStores() {
  return prisma.store.findMany({
    where: { approved: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo: true,
      _count: { select: { products: true } },
    },
  });
}
