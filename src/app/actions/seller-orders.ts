"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/orders";
import { getStoreByOwner } from "@/lib/stores";
import { fulfillStoreItems } from "@/lib/seller-orders";

type ActionResult = { ok: true; orderFulfilled: boolean } | { ok: false; error: string };

// Marks the caller's own store's items in an order as fulfilled. Ownership is
// enforced via session → store, then fulfillStoreItems is storeId-scoped.
export async function fulfillOrderAction(orderId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in." };

  const store = await getStoreByOwner(user.id);
  if (!store) return { ok: false, error: "You need a seller store first." };

  const res = await fulfillStoreItems(store.id, orderId);
  if (!res.ok) {
    return {
      ok: false,
      error:
        res.reason === "not_payable"
          ? "This order can't be fulfilled yet."
          : "Order not found.",
    };
  }

  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderId}`);
  revalidatePath("/seller");
  return { ok: true, orderFulfilled: res.orderFulfilled };
}
