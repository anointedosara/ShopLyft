"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import { getProduct as getStaticProduct, type Product } from "@/lib/data";

type Cart = Record<string, number>;
type ProductMap = Record<string, Product>;

export type CartLine = { product: Product; qty: number; lineTotal: number };

type Toast = { id: number; message: string } | null;

type StoreValue = {
  hydrated: boolean;
  cart: Cart;
  cartLines: CartLine[];
  cartCount: number;
  subtotal: number;
  addToCart: (product: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  wishlist: string[];
  wishlistProducts: Product[];
  toggleWishlist: (product: Product) => void;
  isWishlisted: (id: string) => boolean;
  toast: Toast;
};

const StoreContext = createContext<StoreValue | null>(null);

const CART_KEY = "shoplyft:cart";
const WISH_KEY = "shoplyft:wishlist";
const PRODUCTS_KEY = "shoplyft:products";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [cart, setCart] = useState<Cart>({});
  const [wishlist, setWishlist] = useState<string[]>([]);
  // Snapshot of each product added to the cart/wishlist, captured at add-time.
  // The storefront is DB-backed and seller products have UUIDs that don't exist
  // in the static catalog, so we can't re-resolve them by id later — we keep
  // their data here (with the static catalog only as a fallback for old carts).
  const [products, setProducts] = useState<ProductMap>({});
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage after mount. Reading storage in a useState
  // initializer would break SSR/hydration, so syncing from this external store
  // in an effect is the correct pattern here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const c = localStorage.getItem(CART_KEY);
      const w = localStorage.getItem(WISH_KEY);
      const p = localStorage.getItem(PRODUCTS_KEY);
      if (c) setCart(JSON.parse(c));
      if (w) setWishlist(JSON.parse(w));
      if (p) setProducts(JSON.parse(p));
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // persist
  useEffect(() => {
    if (hydrated) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    // Only persist snapshots still referenced by the cart or wishlist.
    const active = new Set([...Object.keys(cart), ...wishlist]);
    const pruned = Object.fromEntries(Object.entries(products).filter(([id]) => active.has(id)));
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(pruned));
  }, [products, cart, wishlist, hydrated]);

  const notify = useCallback((message: string) => {
    const id = Date.now();
    setToast({ id, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  // Resolve a product id to its data: prefer the captured snapshot, fall back to
  // the static catalog (covers carts saved before snapshots existed).
  const resolve = useCallback(
    (id: string): Product | undefined => products[id] ?? getStaticProduct(id),
    [products]
  );

  const addToCart = useCallback(
    (product: Product, qty = 1) => {
      setProducts((prev) => ({ ...prev, [product.id]: product }));
      setCart((prev) => ({ ...prev, [product.id]: (prev[product.id] ?? 0) + qty }));
      notify(`Added “${product.name}” to cart`);
    },
    [notify]
  );

  const setQty = useCallback((id: string, qty: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const toggleWishlist = useCallback(
    (product: Product) => {
      setProducts((prev) => ({ ...prev, [product.id]: product }));
      setWishlist((prev) => {
        if (prev.includes(product.id)) {
          notify("Removed from saved items");
          return prev.filter((x) => x !== product.id);
        }
        notify("Saved to your wishlist");
        return [...prev, product.id];
      });
    },
    [notify]
  );

  const cartLines = useMemo<CartLine[]>(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const product = resolve(id);
        if (!product) return null;
        return { product, qty, lineTotal: product.price * qty };
      })
      .filter(Boolean) as CartLine[];
  }, [cart, resolve]);

  // Derive the badge count from resolved lines so the header/account badge can
  // never disagree with what the cart page actually shows.
  const cartCount = useMemo(() => cartLines.reduce((a, l) => a + l.qty, 0), [cartLines]);
  const subtotal = useMemo(() => cartLines.reduce((a, l) => a + l.lineTotal, 0), [cartLines]);
  const wishlistProducts = useMemo(
    () => wishlist.map((id) => resolve(id)).filter(Boolean) as Product[],
    [wishlist, resolve]
  );

  const value: StoreValue = {
    hydrated,
    cart,
    cartLines,
    cartCount,
    subtotal,
    addToCart,
    setQty,
    removeFromCart,
    clearCart,
    wishlist,
    wishlistProducts,
    toggleWishlist,
    isWishlisted: (id) => wishlist.includes(id),
    toast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
