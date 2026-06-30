"use client";

import { useStore } from "@/context/StoreProvider";

// Orders count is known on the server (from the DB); cart & saved live in the
// browser store, so this small island reads those client-side.
export default function AccountStats({ ordersCount }: { ordersCount: number }) {
  const { cartCount, wishlistProducts, hydrated } = useStore();

  return (
    <div className="mt-5 grid grid-cols-3 text-center divide-x divide-line">
      <div>
        <p className="font-display font-extrabold text-ink" suppressHydrationWarning>{hydrated ? cartCount : 0}</p>
        <p className="text-[11px] text-mute">Cart</p>
      </div>
      <div>
        <p className="font-display font-extrabold text-ink" suppressHydrationWarning>{hydrated ? wishlistProducts.length : 0}</p>
        <p className="text-[11px] text-mute">Saved</p>
      </div>
      <div>
        <p className="font-display font-extrabold text-ink">{ordersCount}</p>
        <p className="text-[11px] text-mute">Orders</p>
      </div>
    </div>
  );
}
