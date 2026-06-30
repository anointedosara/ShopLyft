import Hero from "@/components/hero/Hero";
import CategorySidebar from "@/components/CategorySidebar";
import ServiceBar from "@/components/ServiceBar";
import FlashSales from "@/components/FlashSales";
import CategoryGrid from "@/components/CategoryGrid";
import PromoBanners from "@/components/PromoBanners";
import ProductRail from "@/components/ProductRail";
import Newsletter from "@/components/Newsletter";
import { getFlashSales, getTopDeals, getRecommended } from "@/lib/catalog";

// Catalog is DB-backed and editable, so render fresh on each request.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [flashSales, topDeals, recommended] = await Promise.all([
    getFlashSales(),
    getTopDeals(),
    getRecommended(),
  ]);

  return (
    <>
      {/* Hero with Jumia-style category sidebar */}
      <section className="mx-auto max-w-[1280px] px-3 sm:px-5 pt-4">
        <div className="grid lg:grid-cols-[240px_1fr] gap-4">
          <CategorySidebar />
          <Hero />
        </div>
      </section>

      <ServiceBar />
      <FlashSales products={flashSales} />
      <CategoryGrid />
      <ProductRail
        title="Top deals for you"
        subtitle="Hand-picked offers updated hourly"
        products={topDeals}
        href="/deals"
      />
      <PromoBanners />
      <ProductRail
        title="Recommended for you"
        subtitle="Based on what's trending on ShopLyft"
        products={recommended}
        accent="accent"
        href="/category/electronics"
      />
      <Newsletter />
    </>
  );
}
