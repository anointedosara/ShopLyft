"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import { getProduct, type EnrichedProduct } from "@/lib/data";

type Cart = Record<string, number>;

export type CartLine = { product: EnrichedProduct; qty: number; lineTotal: number };

type Toast = { id: number; message: string } | null;

type StoreValue = {
  hydrated: boolean;
  cart: Cart;
  cartLines: CartLine[];
  cartCount: number;
  subtotal: number;
  addToCart: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  wishlist: string[];
  wishlistProducts: EnrichedProduct[];
  toggleWishlist: (id: string) => void;
  isWishlisted: (id: string) => boolean;
  toast: Toast;
};

const StoreContext = createContext<StoreValue | null>(null);

const CART_KEY = "shoplyft:cart";
const WISH_KEY = "shoplyft:wishlist";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [cart, setCart] = useState<Cart>({});
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // hydrate from localStorage after mount
  useEffect(() => {
    try {
      const c = localStorage.getItem(CART_KEY);
      const w = localStorage.getItem(WISH_KEY);
      if (c) setCart(JSON.parse(c));
      if (w) setWishlist(JSON.parse(w));
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  // persist
  useEffect(() => {
    if (hydrated) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist, hydrated]);

  const notify = useCallback((message: string) => {
    const id = Date.now();
    setToast({ id, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const addToCart = useCallback(
    (id: string, qty = 1) => {
      const p = getProduct(id);
      if (!p) return;
      setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + qty }));
      notify(`Added “${p.name}” to cart`);
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
    (id: string) => {
      setWishlist((prev) => {
        if (prev.includes(id)) {
          notify("Removed from saved items");
          return prev.filter((x) => x !== id);
        }
        notify("Saved to your wishlist");
        return [...prev, id];
      });
    },
    [notify]
  );

  const cartLines = useMemo<CartLine[]>(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const product = getProduct(id);
        if (!product) return null;
        return { product, qty, lineTotal: product.price * qty };
      })
      .filter(Boolean) as CartLine[];
  }, [cart]);

  const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);
  const subtotal = useMemo(() => cartLines.reduce((a, l) => a + l.lineTotal, 0), [cartLines]);
  const wishlistProducts = useMemo(
    () => wishlist.map((id) => getProduct(id)).filter(Boolean) as EnrichedProduct[],
    [wishlist]
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
