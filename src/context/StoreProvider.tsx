"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import { getProduct, type EnrichedProduct } from "@/lib/data";

type Cart = Record<string, number>;

export type CartLine = { product: EnrichedProduct; qty: number; lineTotal: number };
export type Order = {
  id: string;
  date: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  name: string;
  address: string;
};

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
  orders: Order[];
  lastOrder: Order | null;
  placeOrder: (info: { name: string; address: string }) => Order | null;
  toast: Toast;
};

const StoreContext = createContext<StoreValue | null>(null);

const CART_KEY = "shoplyft:cart";
const WISH_KEY = "shoplyft:wishlist";
const ORDERS_KEY = "shoplyft:orders";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [cart, setCart] = useState<Cart>({});
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // hydrate from localStorage after mount
  useEffect(() => {
    try {
      const c = localStorage.getItem(CART_KEY);
      const w = localStorage.getItem(WISH_KEY);
      const o = localStorage.getItem(ORDERS_KEY);
      if (c) setCart(JSON.parse(c));
      if (w) setWishlist(JSON.parse(w));
      if (o) setOrders(JSON.parse(o));
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
  useEffect(() => {
    if (hydrated) localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }, [orders, hydrated]);

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
        notify("Saved to your wishlist ♥");
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

  const placeOrder = useCallback(
    (info: { name: string; address: string }) => {
      if (cartLines.length === 0) return null;
      const order: Order = {
        id: "SL" + (100001 + orders.length).toString(),
        date: new Date().toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }),
        items: cartLines.map((l) => ({ name: l.product.name, qty: l.qty, price: l.product.price })),
        total: subtotal,
        name: info.name,
        address: info.address,
      };
      setOrders((prev) => [order, ...prev]); // newest first
      clearCart();
      return order;
    },
    [cartLines, orders.length, subtotal, clearCart]
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
    orders,
    lastOrder: orders[0] ?? null,
    placeOrder,
    toast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
