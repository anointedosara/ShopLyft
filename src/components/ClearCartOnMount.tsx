"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/context/StoreProvider";

// Rendered on the confirmation page once an order is PAID — empties the cart
// (which intentionally survives the Paystack redirect so a failed payment can be retried).
export default function ClearCartOnMount() {
  const { clearCart, hydrated } = useStore();
  const done = useRef(false);

  useEffect(() => {
    if (hydrated && !done.current) {
      done.current = true;
      clearCart();
    }
  }, [hydrated, clearCart]);

  return null;
}
