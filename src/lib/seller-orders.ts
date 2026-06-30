import "server-only";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

// Seller-facing order layer. Everything here is scoped to a single storeId so a
// seller only ever sees and fulfils the items that belong to their own store.
// Orders can span multiple stores, so a seller sees just their slice of each
// order (their items, their subtotal), never another store's lines.

// Sellers only care about orders that have actually been paid for. PENDING
// (unpaid) and CANCELLED orders are not theirs to fulfil.
const SELLABLE: OrderStatus[] = ["PAID", "FULFILLED"];

export type SellerOrderSummary = {
  id: string;
  shortId: string;
  status: string;
  createdAt: Date;
  buyerName: string;
  itemCount: number; // distinct line items from this store
  units: number; // total quantity from this store
  subtotal: number; // this store's revenue from the order (excl. delivery)
  fulfilled: boolean; // every one of this store's items in the order is fulfilled
};

export type SellerOrderDetail = SellerOrderSummary & {
  address: string;
  items: { id: string; name: string; qty: number; price: number; fulfilledAt: Date | null }[];
};

export type SellerStats = {
  revenue: number; // sum of this store's paid item lines (excl. delivery)
  paidOrders: number; // distinct paid/fulfilled orders containing this store's items
  unitsSold: number;
  toFulfil: number; // paid orders with at least one unfulfilled item for this store
};

// Aggregate sales figures for the dashboard. Revenue is the seller's own slice
// (their item lines), never the platform delivery fee.
export async function getSellerStats(storeId: string): Promise<SellerStats> {
  const items = await prisma.orderItem.findMany({
    where: { storeId, order: { status: { in: SELLABLE } } },
    select: { qty: true, price: true, fulfilledAt: true, orderId: true, order: { select: { status: true } } },
  });

  let revenue = 0;
  let unitsSold = 0;
  const paidOrderIds = new Set<string>();
  const toFulfilIds = new Set<string>();
  for (const it of items) {
    revenue += it.price * it.qty;
    unitsSold += it.qty;
    paidOrderIds.add(it.orderId);
    if (it.fulfilledAt === null) toFulfilIds.add(it.orderId);
  }

  return {
    revenue,
    paidOrders: paidOrderIds.size,
    unitsSold,
    toFulfil: toFulfilIds.size,
  };
}

function summarize(
  order: { id: string; status: string; createdAt: Date; name: string },
  items: { qty: number; price: number; fulfilledAt: Date | null }[]
) {
  return {
    id: order.id,
    shortId: order.id.slice(-8).toUpperCase(),
    status: order.status,
    createdAt: order.createdAt,
    buyerName: order.name,
    itemCount: items.length,
    units: items.reduce((a, it) => a + it.qty, 0),
    subtotal: items.reduce((a, it) => a + it.price * it.qty, 0),
    fulfilled: items.length > 0 && items.every((it) => it.fulfilledAt !== null),
  };
}

// Paid orders that contain at least one of this store's items, newest first.
export async function getSellerOrders(storeId: string): Promise<SellerOrderSummary[]> {
  const orders = await prisma.order.findMany({
    where: { status: { in: SELLABLE }, items: { some: { storeId } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      name: true,
      items: { where: { storeId }, select: { qty: true, price: true, fulfilledAt: true } },
    },
  });
  return orders.map((o) => summarize(o, o.items));
}

// A single order scoped to this store. Returns null if the order doesn't exist
// or contains none of this store's items (ownership check).
export async function getSellerOrder(storeId: string, orderId: string): Promise<SellerOrderDetail | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, status: { in: SELLABLE }, items: { some: { storeId } } },
    select: {
      id: true,
      status: true,
      createdAt: true,
      name: true,
      address: true,
      items: {
        where: { storeId },
        select: { id: true, name: true, qty: true, price: true, fulfilledAt: true },
      },
    },
  });
  if (!order) return null;
  return { ...summarize(order, order.items), address: order.address, items: order.items };
}

// Mark this store's items in an order as fulfilled. If that completes every line
// in the order (across all stores), the order itself flips PAID → FULFILLED.
export async function fulfillStoreItems(storeId: string, orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, items: { select: { storeId: true, fulfilledAt: true } } },
    });
    if (!order) return { ok: false as const, reason: "not_found" as const };

    const mine = order.items.filter((it) => it.storeId === storeId);
    if (mine.length === 0) return { ok: false as const, reason: "not_found" as const };

    // Only paid orders can be fulfilled (not PENDING/CANCELLED).
    if (order.status !== "PAID" && order.status !== "FULFILLED") {
      return { ok: false as const, reason: "not_payable" as const };
    }

    const now = new Date();
    await tx.orderItem.updateMany({
      where: { orderId, storeId, fulfilledAt: null },
      data: { fulfilledAt: now },
    });

    // If every line in the whole order is now fulfilled, settle the order.
    const remaining = await tx.orderItem.count({ where: { orderId, fulfilledAt: null } });
    let orderFulfilled = false;
    if (remaining === 0 && order.status === "PAID") {
      await tx.order.update({ where: { id: orderId }, data: { status: "FULFILLED" } });
      orderFulfilled = true;
    }

    return { ok: true as const, orderFulfilled };
  });
}
