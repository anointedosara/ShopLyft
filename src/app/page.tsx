import Hero from "@/components/hero/Hero";
import CategorySidebar from "@/components/CategorySidebar";
import ServiceBar from "@/components/ServiceBar";
import FlashSales from "@/components/FlashSales";
import CategoryGrid from "@/components/CategoryGrid";
import PromoBanners from "@/components/PromoBanners";
import ProductRail from "@/components/ProductRail";
import Newsletter from "@/components/Newsletter";
import { topDeals, recommended } from "@/lib/data";

export default function Home() {
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
      <FlashSales />
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
