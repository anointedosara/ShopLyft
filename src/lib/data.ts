// Unified catalog for ShopLyft. Visuals are gradient + glyph tiles so the whole
// store is self-contained (no external image dependency).

export type Category = {
  id: string;
  name: string;
  glyph: string;
  gradient: string;
  image?: string;
};

export type Spec = { label: string; value: string };

export type Product = {
  id: string;
  name: string;
  glyph: string;
  gradient: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  categoryId: string;
  brand: string;
  badge?: string;
  stockLeft?: number;
  stockTotal?: number;
  tags: string[]; // "flash" | "deal" | "rec"
  image?: string;
};

export type EnrichedProduct = Product & {
  description: string;
  highlights: string[];
  specs: Spec[];
};

export const formatNaira = (value: number) =>
  "₦ " + value.toLocaleString("en-NG", { maximumFractionDigits: 0 });

export const discountPct = (price: number, oldPrice?: number) =>
  oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

// Real product/category imagery. We pin a stable photo per item via loremflickr's
// `lock` param so each item keeps the same picture across renders. Each URL is just
// a DB field, so any photo can be swapped later by editing that row.
const buildImg = (keyword: string, lock: number) =>
  `https://loremflickr.com/600/600/${keyword}?lock=${lock}`;

const categoryImageKeyword: Record<string, string> = {
  phones: "smartphone",
  electronics: "electronics",
  fashion: "fashion",
  home: "furniture",
  beauty: "cosmetics",
  grocery: "supermarket",
  gaming: "videogame",
  computing: "laptop",
  baby: "baby",
  sports: "fitness",
  automobile: "car",
  books: "books",
};

const productImageKeyword: Record<string, string> = {
  fs1: "headphones", fs2: "smartphone", fs3: "airfryer", fs4: "smartwatch",
  fs5: "television", fs6: "gamepad", fs7: "espresso", fs8: "skincare",
  td1: "earbuds", td2: "laptop", td3: "diffuser", td4: "powerbank",
  td5: "knife", td6: "dumbbell", td7: "keyboard", td8: "sunglasses",
  rc1: "sneakers", rc2: "waterbottle", rc3: "candle", rc4: "backpack",
  rc5: "lighting", rc6: "blanket", rc7: "socket", rc8: "coffee",
  ph1: "smartphone", ph2: "tablet", gr1: "groceries", gr2: "juice",
  bb1: "diapers", bb2: "baby", au1: "dashcam", au2: "vacuum",
  bk1: "books", bk2: "notebook", fa1: "denim", fa2: "handbag",
  be1: "lipstick", be2: "hairdryer", ga1: "console", ga2: "headset",
  co1: "monitor", co2: "mouse",
};

const categoryDefs: Omit<Category, "image">[] = [
  { id: "phones", name: "Phones & Tablets", glyph: "📱", gradient: "from-sky-400 to-blue-600" },
  { id: "electronics", name: "Electronics", glyph: "🔌", gradient: "from-violet-400 to-indigo-600" },
  { id: "fashion", name: "Fashion", glyph: "👗", gradient: "from-pink-400 to-rose-600" },
  { id: "home", name: "Home & Office", glyph: "🛋️", gradient: "from-amber-400 to-orange-600" },
  { id: "beauty", name: "Health & Beauty", glyph: "💄", gradient: "from-fuchsia-400 to-purple-600" },
  { id: "grocery", name: "Supermarket", glyph: "🛒", gradient: "from-lime-400 to-green-600" },
  { id: "gaming", name: "Gaming", glyph: "🎮", gradient: "from-emerald-400 to-teal-600" },
  { id: "computing", name: "Computing", glyph: "💻", gradient: "from-slate-400 to-slate-700" },
  { id: "baby", name: "Baby Products", glyph: "🍼", gradient: "from-cyan-400 to-sky-600" },
  { id: "sports", name: "Sporting Goods", glyph: "⚽", gradient: "from-red-400 to-rose-600" },
  { id: "automobile", name: "Automobile", glyph: "🚗", gradient: "from-zinc-400 to-zinc-700" },
  { id: "books", name: "Books & Media", glyph: "📚", gradient: "from-orange-400 to-red-600" },
];

export const categories: Category[] = categoryDefs.map((c, i) => ({
  ...c,
  image: buildImg(categoryImageKeyword[c.id] ?? c.id, 1001 + i),
}));

export const categoryName = (id: string) =>
  categories.find((c) => c.id === id)?.name ?? "All Products";

const base: Product[] = [
  // Flash sales
  { id: "fs1", name: "ProSound ANC Wireless Headphones", glyph: "🎧", gradient: "from-indigo-500 to-violet-700", price: 28900, oldPrice: 64000, rating: 4.7, reviews: 1280, categoryId: "electronics", brand: "ProSound", stockLeft: 18, stockTotal: 60, tags: ["flash"] },
  { id: "fs2", name: "Velocity 5G Smartphone 256GB", glyph: "📱", gradient: "from-sky-500 to-blue-700", price: 189000, oldPrice: 245000, rating: 4.6, reviews: 842, categoryId: "phones", brand: "Velocity", stockLeft: 7, stockTotal: 50, tags: ["flash"] },
  { id: "fs3", name: "AirFry Pro 6L Digital Air Fryer", glyph: "🍟", gradient: "from-amber-500 to-orange-700", price: 42500, oldPrice: 78000, rating: 4.8, reviews: 2310, categoryId: "home", brand: "KitchenJoy", stockLeft: 31, stockTotal: 80, tags: ["flash"] },
  { id: "fs4", name: "LumaWatch Series 9 Smartwatch", glyph: "⌚", gradient: "from-rose-500 to-pink-700", price: 36900, oldPrice: 59000, rating: 4.5, reviews: 654, categoryId: "electronics", brand: "Luma", stockLeft: 4, stockTotal: 40, tags: ["flash"] },
  { id: "fs5", name: 'PixelView 43" 4K Smart TV', glyph: "📺", gradient: "from-slate-500 to-slate-800", price: 154000, oldPrice: 219000, rating: 4.4, reviews: 410, categoryId: "electronics", brand: "PixelView", stockLeft: 12, stockTotal: 35, tags: ["flash"] },
  { id: "fs6", name: "GamerX Wireless Controller", glyph: "🎮", gradient: "from-emerald-500 to-teal-700", price: 18900, oldPrice: 32000, rating: 4.7, reviews: 980, categoryId: "gaming", brand: "GamerX", stockLeft: 22, stockTotal: 70, tags: ["flash"] },
  { id: "fs7", name: "BrewMaster Espresso Machine", glyph: "☕", gradient: "from-orange-500 to-red-700", price: 89000, oldPrice: 132000, rating: 4.6, reviews: 521, categoryId: "home", brand: "BrewMaster", stockLeft: 9, stockTotal: 30, tags: ["flash"] },
  { id: "fs8", name: "PureGlow Vitamin C Serum Set", glyph: "🧴", gradient: "from-fuchsia-500 to-purple-700", price: 12500, oldPrice: 24000, rating: 4.9, reviews: 3120, categoryId: "beauty", brand: "PureGlow", stockLeft: 40, stockTotal: 100, tags: ["flash"] },

  // Top deals
  { id: "td1", name: "Velocity Buds Pro Earbuds", glyph: "🎧", gradient: "from-blue-500 to-indigo-700", price: 15900, oldPrice: 29000, rating: 4.5, reviews: 760, categoryId: "electronics", brand: "Velocity", badge: "Official Store", tags: ["deal"] },
  { id: "td2", name: "UltraBook 14 Core i7 16GB", glyph: "💻", gradient: "from-slate-500 to-slate-800", price: 489000, oldPrice: 615000, rating: 4.7, reviews: 233, categoryId: "computing", brand: "UltraBook", badge: "Best Seller", tags: ["deal"] },
  { id: "td3", name: "Aroma Diffuser + Oils Bundle", glyph: "🌿", gradient: "from-emerald-500 to-green-700", price: 9900, oldPrice: 18500, rating: 4.6, reviews: 1190, categoryId: "home", brand: "Aroma", tags: ["deal"] },
  { id: "td4", name: "PowerCore 30,000mAh Power Bank", glyph: "🔋", gradient: "from-amber-500 to-orange-700", price: 21500, oldPrice: 35000, rating: 4.8, reviews: 2040, categoryId: "electronics", brand: "PowerCore", badge: "Top Rated", tags: ["deal"] },
  { id: "td5", name: "ChefPro 12-Piece Knife Set", glyph: "🔪", gradient: "from-zinc-500 to-zinc-800", price: 27900, oldPrice: 44000, rating: 4.4, reviews: 312, categoryId: "home", brand: "ChefPro", tags: ["deal"] },
  { id: "td6", name: "FlexFit Adjustable Dumbbells", glyph: "🏋️", gradient: "from-red-500 to-rose-700", price: 64000, oldPrice: 95000, rating: 4.6, reviews: 188, categoryId: "sports", brand: "FlexFit", tags: ["deal"] },
  { id: "td7", name: "Nimbus Mechanical Keyboard RGB", glyph: "⌨️", gradient: "from-violet-500 to-purple-700", price: 32500, oldPrice: 52000, rating: 4.7, reviews: 905, categoryId: "computing", brand: "Nimbus", tags: ["deal"] },
  { id: "td8", name: "SunVibe Polarized Sunglasses", glyph: "🕶️", gradient: "from-cyan-500 to-sky-700", price: 8900, oldPrice: 16000, rating: 4.3, reviews: 430, categoryId: "fashion", brand: "SunVibe", tags: ["deal"] },

  // Recommended
  { id: "rc1", name: "Classic Leather Sneakers", glyph: "👟", gradient: "from-orange-400 to-amber-600", price: 24900, oldPrice: 39000, rating: 4.5, reviews: 612, categoryId: "fashion", brand: "Stride", tags: ["rec"] },
  { id: "rc2", name: "Hydra Stainless Water Bottle 1L", glyph: "🫗", gradient: "from-teal-400 to-cyan-600", price: 6900, oldPrice: 12000, rating: 4.8, reviews: 1540, categoryId: "sports", brand: "Hydra", tags: ["rec"] },
  { id: "rc3", name: "Aura Scented Candle Trio", glyph: "🕯️", gradient: "from-rose-400 to-pink-600", price: 11900, oldPrice: 19000, rating: 4.7, reviews: 388, categoryId: "home", brand: "Aura", tags: ["rec"] },
  { id: "rc4", name: "TrailBlazer 40L Hiking Backpack", glyph: "🎒", gradient: "from-lime-500 to-green-700", price: 33900, oldPrice: 52000, rating: 4.6, reviews: 274, categoryId: "sports", brand: "TrailBlazer", tags: ["rec"] },
  { id: "rc5", name: "Studio Ring Light + Tripod", glyph: "💡", gradient: "from-yellow-400 to-amber-600", price: 18500, oldPrice: 31000, rating: 4.4, reviews: 521, categoryId: "electronics", brand: "Studio", tags: ["rec"] },
  { id: "rc6", name: "Cozy Knit Throw Blanket", glyph: "🧶", gradient: "from-fuchsia-400 to-rose-600", price: 14900, oldPrice: 26000, rating: 4.9, reviews: 833, categoryId: "home", brand: "Cozy", tags: ["rec"] },
  { id: "rc7", name: "SmartHome Wi-Fi Plug 4-Pack", glyph: "🔆", gradient: "from-indigo-400 to-blue-600", price: 16900, oldPrice: 28000, rating: 4.5, reviews: 712, categoryId: "home", brand: "SmartHome", tags: ["rec"] },
  { id: "rc8", name: "Barista Milk Frother Steel", glyph: "🥛", gradient: "from-slate-400 to-slate-700", price: 7900, oldPrice: 14000, rating: 4.6, reviews: 459, categoryId: "home", brand: "Barista", tags: ["rec"] },

  // Catalog fillers (one+ per remaining category)
  { id: "ph1", name: "Velocity Lite 5G 128GB", glyph: "📱", gradient: "from-blue-400 to-sky-600", price: 124000, oldPrice: 159000, rating: 4.4, reviews: 388, categoryId: "phones", brand: "Velocity", tags: ["deal"] },
  { id: "ph2", name: "Aurora Tab 11 Android Tablet", glyph: "📲", gradient: "from-indigo-400 to-violet-600", price: 98000, oldPrice: 139000, rating: 4.5, reviews: 211, categoryId: "phones", brand: "Aurora", tags: ["rec"] },
  { id: "gr1", name: "Organic Pantry Essentials Bundle", glyph: "🧺", gradient: "from-lime-400 to-green-600", price: 18900, oldPrice: 26000, rating: 4.7, reviews: 540, categoryId: "grocery", brand: "FarmFresh", tags: ["rec"] },
  { id: "gr2", name: "Cold-Pressed Juice 6-Pack", glyph: "🧃", gradient: "from-orange-400 to-amber-600", price: 8900, oldPrice: 13500, rating: 4.6, reviews: 322, categoryId: "grocery", brand: "PurePress", tags: ["deal"] },
  { id: "bb1", name: "ComfortDry Diapers Mega Box", glyph: "🍼", gradient: "from-cyan-400 to-sky-600", price: 14500, oldPrice: 21000, rating: 4.8, reviews: 1870, categoryId: "baby", brand: "ComfortDry", tags: ["rec"] },
  { id: "bb2", name: "Soothing Baby Lotion 500ml", glyph: "🧴", gradient: "from-sky-400 to-cyan-600", price: 5900, oldPrice: 9500, rating: 4.7, reviews: 690, categoryId: "baby", brand: "TenderCare", tags: ["deal"] },
  { id: "au1", name: "RoadEye Full HD Dash Cam", glyph: "📹", gradient: "from-zinc-400 to-zinc-700", price: 34900, oldPrice: 52000, rating: 4.5, reviews: 276, categoryId: "automobile", brand: "RoadEye", tags: ["deal"] },
  { id: "au2", name: "TurboVac Cordless Car Vacuum", glyph: "🚙", gradient: "from-slate-400 to-slate-700", price: 22900, oldPrice: 34000, rating: 4.4, reviews: 198, categoryId: "automobile", brand: "TurboVac", tags: ["rec"] },
  { id: "bk1", name: "Bestseller Novel Box Set (5 Books)", glyph: "📚", gradient: "from-orange-400 to-red-600", price: 19900, oldPrice: 32000, rating: 4.9, reviews: 1450, categoryId: "books", brand: "PageTurner", tags: ["rec"] },
  { id: "bk2", name: "Daily Focus Productivity Journal", glyph: "📓", gradient: "from-amber-400 to-orange-600", price: 6500, oldPrice: 11000, rating: 4.7, reviews: 510, categoryId: "books", brand: "FocusCo", tags: ["deal"] },
  { id: "fa1", name: "Heritage Denim Jacket", glyph: "🧥", gradient: "from-blue-400 to-indigo-600", price: 27900, oldPrice: 42000, rating: 4.5, reviews: 334, categoryId: "fashion", brand: "Heritage", tags: ["rec"] },
  { id: "fa2", name: "Luxe Leather Tote Bag", glyph: "👜", gradient: "from-rose-400 to-pink-600", price: 38900, oldPrice: 59000, rating: 4.6, reviews: 287, categoryId: "fashion", brand: "Luxe", tags: ["deal"] },
  { id: "be1", name: "VelvetMatte Lipstick Set (6)", glyph: "💄", gradient: "from-fuchsia-400 to-purple-600", price: 9900, oldPrice: 17000, rating: 4.7, reviews: 921, categoryId: "beauty", brand: "Velvet", tags: ["rec"] },
  { id: "be2", name: "IonicPro Ceramic Hair Dryer", glyph: "💇", gradient: "from-purple-400 to-fuchsia-600", price: 23900, oldPrice: 38000, rating: 4.5, reviews: 410, categoryId: "beauty", brand: "IonicPro", tags: ["deal"] },
  { id: "ga1", name: "NextGen Console 1TB", glyph: "🕹️", gradient: "from-emerald-500 to-teal-700", price: 389000, oldPrice: 459000, rating: 4.8, reviews: 612, categoryId: "gaming", brand: "NextGen", badge: "Hot", tags: ["deal"] },
  { id: "ga2", name: "GamerX RGB Gaming Headset", glyph: "🎧", gradient: "from-teal-500 to-emerald-700", price: 24900, oldPrice: 39000, rating: 4.6, reviews: 845, categoryId: "gaming", brand: "GamerX", tags: ["rec"] },
  { id: "co1", name: 'VisionPanel 27" 4K Monitor', glyph: "🖥️", gradient: "from-slate-400 to-slate-700", price: 145000, oldPrice: 198000, rating: 4.7, reviews: 263, categoryId: "computing", brand: "VisionPanel", tags: ["deal"] },
  { id: "co2", name: "GlideErgo Wireless Mouse", glyph: "🖱️", gradient: "from-zinc-400 to-slate-600", price: 11900, oldPrice: 19000, rating: 4.5, reviews: 1120, categoryId: "computing", brand: "Glide", tags: ["rec"] },
];

export function enrich(p: Product): EnrichedProduct {
  const model = p.name.split(" ").slice(0, 2).join(" ");
  return {
    ...p,
    description: `Meet the ${p.name} — ${p.brand}'s take on everyday quality. Rated ${p.rating.toFixed(
      1
    )}★ by ${p.reviews.toLocaleString()} shoppers, it pairs a premium build with genuine value. Buy it on ShopLyft for fast nationwide delivery, secure checkout, and a hassle-free 7-day return policy.`,
    highlights: [
      "100% genuine product with official warranty",
      "Fast same-day delivery in major cities",
      "7-day easy returns, no questions asked",
      "Secure payments & full buyer protection",
    ],
    specs: [
      { label: "Brand", value: p.brand },
      { label: "Model", value: model },
      { label: "Category", value: categoryName(p.categoryId) },
      { label: "Warranty", value: "1 Year ShopLyft Warranty" },
      { label: "Condition", value: "Brand New" },
      { label: "Shipped from", value: "Lagos, Nigeria" },
    ],
  };
}

const withImages: Product[] = base.map((p, i) => ({
  ...p,
  image: productImageKeyword[p.id] ? buildImg(productImageKeyword[p.id], i + 1) : undefined,
}));

export const allProducts: EnrichedProduct[] = withImages.map(enrich);

export const getProduct = (id: string) => allProducts.find((p) => p.id === id);

export const productsByCategory = (categoryId: string) =>
  allProducts.filter((p) => p.categoryId === categoryId);

export const flashSales = allProducts.filter((p) => p.tags.includes("flash"));
export const topDeals = allProducts.filter((p) => p.tags.includes("deal"));
export const recommended = allProducts.filter((p) => p.tags.includes("rec"));
export const dealsAndFlash = allProducts.filter(
  (p) => p.tags.includes("flash") || p.tags.includes("deal")
);

export const relatedProducts = (product: Product, limit = 6) =>
  allProducts.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, limit);

export function searchProducts(query: string): EnrichedProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return allProducts.filter((p) => {
    const haystack = `${p.name} ${p.brand} ${categoryName(p.categoryId)}`.toLowerCase();
    return q.split(/\s+/).every((term) => haystack.includes(term));
  });
}

export const navLinks: { label: string; href: string }[] = [
  { label: "Today's Deals", href: "/deals" },
  { label: "New Arrivals", href: "/category/electronics" },
  { label: "Best Sellers", href: "/category/phones" },
  { label: "Stores", href: "/stores" },
  { label: "Sell on ShopLyft", href: "/sell" },
  { label: "Help Center", href: "/help" },
];
