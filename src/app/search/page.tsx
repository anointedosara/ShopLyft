import { searchCatalog } from "@/lib/catalog";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductBrowser from "@/components/ProductBrowser";
import ProductGrid from "@/components/ProductGrid";
import { SearchEmptyIcon } from "@/components/icons";

export const metadata = { title: "Search — ShopLyft" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query ? await searchCatalog(query) : [];

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Search" }]} />

      <div className="mt-4 mb-6">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">
          {query ? <>Results for “{query}”</> : "Search ShopLyft"}
        </h1>
        {query && (
          <p className="text-mute text-sm mt-1">
            {results.length} product{results.length !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {!query ? (
        <div className="rounded-2xl bg-white ring-1 ring-line p-12 text-center">
          <span className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-cloud text-mute mb-3">
            <SearchEmptyIcon width={24} height={24} />
          </span>
          <p className="font-display font-bold text-lg text-ink">What are you looking for?</p>
          <p className="text-mute text-sm mt-1">Use the search bar above to find products, brands and categories.</p>
        </div>
      ) : results.length > 0 ? (
        <ProductBrowser products={results} />
      ) : (
        <ProductGrid products={[]} />
      )}
    </div>
  );
}
