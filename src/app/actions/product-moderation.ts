"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/rbac";
import { approveProduct, rejectProduct, takeDownProduct, type ModerationResult } from "@/lib/product-moderation";
import { notify } from "@/lib/notifications";

// Admin-only product moderation actions. Each calls requireAdmin() (redirects
// non-admins), runs the status change, then notifies the seller best-effort.

type Result = { ok: true } | { ok: false; error: string };

function revalidate() {
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/seller"); // seller sees their product's status flip
  // The public catalog gains/loses the product.
  revalidatePath("/products");
  revalidatePath("/");
}

function transitionError(reason: "not_found" | "invalid_transition"): string {
  return reason === "not_found"
    ? "That product no longer exists."
    : "This action isn't allowed from the product's current status.";
}

async function notifySeller(
  res: Extract<ModerationResult, { ok: true }>,
  title: string,
  body: string
) {
  if (!res.sellerUserId) return;
  try {
    await notify({
      userId: res.sellerUserId,
      type: "GENERAL",
      title,
      body,
      href: "/seller",
      toEmail: res.sellerEmail,
    });
  } catch {
    // non-fatal — the status change is already committed
  }
}

export async function approveProductAction(productId: string): Promise<Result> {
  await requireAdmin();
  const res = await approveProduct(productId);
  if (!res.ok) return { ok: false, error: transitionError(res.reason) };
  await notifySeller(
    res,
    "Your product is now live",
    `“${res.productName}” has been approved and is now visible to buyers on ShopLyft.`
  );
  revalidate();
  return { ok: true };
}

export async function rejectProductAction(productId: string, reason: string): Promise<Result> {
  await requireAdmin();
  const trimmed = reason?.trim();
  if (!trimmed) return { ok: false, error: "Add a reason so the seller knows what to fix." };
  const res = await rejectProduct(productId, trimmed);
  if (!res.ok) return { ok: false, error: transitionError(res.reason) };
  await notifySeller(
    res,
    "Your product listing was declined",
    `“${res.productName}” wasn't approved. Reason: ${trimmed}. You can edit it and resubmit.`
  );
  revalidate();
  return { ok: true };
}

export async function takeDownProductAction(productId: string, reason: string): Promise<Result> {
  await requireAdmin();
  const trimmed = reason?.trim();
  if (!trimmed) return { ok: false, error: "Add a reason for taking this product down." };
  const res = await takeDownProduct(productId, trimmed);
  if (!res.ok) return { ok: false, error: transitionError(res.reason) };
  await notifySeller(
    res,
    "Your product was taken down",
    `“${res.productName}” has been removed from sale. Reason: ${trimmed}.`
  );
  revalidate();
  return { ok: true };
}
