// Seeds Postgres from the static catalog in src/lib/data.ts.
// Idempotent (upsert) — safe to run repeatedly. This is the bridge that turns
// the hardcoded prototype catalog into real database rows.

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { categories, allProducts } from "../src/lib/data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// The platform's own store. All seeded catalog products belong to it; seller
// stores are created later through onboarding. Approved so its products show.
const OFFICIAL_STORE = {
  id: "shoplyft-official",
  name: "ShopLyft Official",
  slug: "shoplyft-official",
  description: "Curated essentials sold and shipped by ShopLyft.",
  approved: true,
};

async function main() {
  await prisma.store.upsert({
    where: { id: OFFICIAL_STORE.id },
    update: { name: OFFICIAL_STORE.name, slug: OFFICIAL_STORE.slug, description: OFFICIAL_STORE.description, approved: OFFICIAL_STORE.approved },
    create: OFFICIAL_STORE,
  });

  for (const [i, c] of categories.entries()) {
    const fields = { name: c.name, glyph: c.glyph, gradient: c.gradient, image: c.image ?? null, sortOrder: i };
    await prisma.category.upsert({
      where: { id: c.id },
      update: fields,
      create: { id: c.id, ...fields },
    });
  }

  for (const [i, p] of allProducts.entries()) {
    const fields = {
      name: p.name,
      glyph: p.glyph,
      gradient: p.gradient,
      price: p.price,
      oldPrice: p.oldPrice ?? null,
      rating: p.rating,
      reviews: p.reviews,
      brand: p.brand,
      badge: p.badge ?? null,
      stockLeft: p.stockLeft ?? null,
      stockTotal: p.stockTotal ?? null,
      tags: p.tags,
      image: p.image ?? null,
      sortOrder: i,
      categoryId: p.categoryId,
      storeId: OFFICIAL_STORE.id,
    };
    await prisma.product.upsert({
      where: { id: p.id },
      update: fields,
      create: { id: p.id, ...fields },
    });
  }

  await backfillSellerVerification();

  const [cats, prods] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
  ]);
  console.log(`Seeded ${cats} categories and ${prods} products.`);
}

// One-time-safe backfill so existing seller stores keep working after KYC lands.
// Every *owned* store gets a SellerProfile + SellerVerification. Already-approved
// stores are marked APPROVED (they were vetted under the old flow); the rest start
// as DRAFT — the seller completes and submits their application via
// /seller/verification, matching the live onboarding flow. The platform store
// (null owner) is skipped — it isn't a KYC seller. Idempotent: upserts keyed on
// the unique storeId, runs cleanly on every seed.
async function backfillSellerVerification() {
  const stores = await prisma.store.findMany({
    where: { ownerId: { not: null } },
    select: {
      id: true,
      ownerId: true,
      approved: true,
      owner: { select: { email: true, phone: true } },
    },
  });

  let created = 0;
  for (const store of stores) {
    const userId = store.ownerId!;
    const status = store.approved ? "APPROVED" : "DRAFT";

    const profile = await prisma.sellerProfile.upsert({
      where: { storeId: store.id },
      update: {},
      create: {
        storeId: store.id,
        userId,
        email: store.owner?.email ?? null,
        phone: store.owner?.phone ?? null,
      },
      select: { id: true },
    });

    await prisma.sellerVerification.upsert({
      where: { storeId: store.id },
      update: {},
      create: {
        profileId: profile.id,
        storeId: store.id,
        status,
        completedSteps: store.approved
          ? ["personal", "business", "identity", "bank"]
          : [],
        submittedAt: store.approved ? new Date() : null,
        reviewedAt: store.approved ? new Date() : null,
      },
    });
    created += 1;
  }

  if (created) console.log(`Backfilled verification for ${created} seller store(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
