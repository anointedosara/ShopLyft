"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/rbac";
import {
  startReview,
  approveVerification,
  rejectVerification,
  requestInfo,
  suspendVerification,
  reinstateVerification,
  addNote,
  type TransitionResult,
} from "@/lib/admin";
import { notify } from "@/lib/notifications";
import type { NotificationType } from "@prisma/client";

// Admin-only review actions. Every export calls requireAdmin() first (which
// redirects non-admins), runs the transactional state change in lib/admin, then
// fires the seller's notification + email best-effort. Neither side effect may
// break the action — the status change is already committed.

type Result = { ok: true } | { ok: false; error: string };

function revalidate(id: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/sellers");
  revalidatePath(`/admin/sellers/${id}`);
  revalidatePath("/seller"); // seller sees their status flip
}

function transitionError(reason: "not_found" | "invalid_transition"): string {
  return reason === "not_found"
    ? "That application no longer exists."
    : "This action isn't allowed from the application's current status.";
}

// Notify the seller in-app + by email. Best-effort: a notification/email hiccup
// must not undo the committed status change.
async function notifySeller(
  res: Extract<TransitionResult, { ok: true }>,
  msg: { notifType: NotificationType; title: string; body: string }
) {
  if (!res.sellerUserId) return;
  try {
    await notify({
      userId: res.sellerUserId,
      type: msg.notifType,
      title: msg.title,
      body: msg.body,
      href: "/seller",
      toEmail: res.sellerEmail,
    });
  } catch {
    // non-fatal
  }
}

export async function startReviewAction(id: string): Promise<Result> {
  const admin = await requireAdmin();
  const res = await startReview(admin.id, id);
  if (!res.ok) return { ok: false, error: transitionError(res.reason) };
  revalidate(id);
  return { ok: true };
}

export async function approveSellerAction(id: string): Promise<Result> {
  const admin = await requireAdmin();
  const res = await approveVerification(admin.id, id);
  if (!res.ok) return { ok: false, error: transitionError(res.reason) };
  await notifySeller(res, {
    notifType: "VERIFICATION_APPROVED",
    title: "Your store has been approved",
    body: `Good news — ${res.storeName} is now approved and live on ShopLyft. Your products are visible to buyers.`,
  });
  revalidate(id);
  return { ok: true };
}

export async function rejectSellerAction(id: string, reason: string): Promise<Result> {
  const admin = await requireAdmin();
  const trimmed = reason?.trim();
  if (!trimmed) return { ok: false, error: "Add a reason so the seller knows what to fix." };
  const res = await rejectVerification(admin.id, id, trimmed);
  if (!res.ok) return { ok: false, error: transitionError(res.reason) };
  await notifySeller(res, {
    notifType: "VERIFICATION_REJECTED",
    title: "Your store application was declined",
    body: `We couldn't approve ${res.storeName} yet. Reason: ${trimmed}. You can update your details and resubmit.`,
  });
  revalidate(id);
  return { ok: true };
}

export async function requestInfoAction(id: string, message: string): Promise<Result> {
  const admin = await requireAdmin();
  const trimmed = message?.trim();
  if (!trimmed) return { ok: false, error: "Describe what the seller needs to provide." };
  const res = await requestInfo(admin.id, id, trimmed);
  if (!res.ok) return { ok: false, error: transitionError(res.reason) };
  await notifySeller(res, {
    notifType: "INFO_REQUESTED",
    title: "More information needed for your store",
    body: `To continue reviewing ${res.storeName}, we need: ${trimmed}.`,
  });
  revalidate(id);
  return { ok: true };
}

export async function suspendSellerAction(id: string, reason: string): Promise<Result> {
  const admin = await requireAdmin();
  const trimmed = reason?.trim();
  if (!trimmed) return { ok: false, error: "Add a reason for the suspension." };
  const res = await suspendVerification(admin.id, id, trimmed);
  if (!res.ok) return { ok: false, error: transitionError(res.reason) };
  await notifySeller(res, {
    notifType: "GENERAL",
    title: "Your store has been suspended",
    body: `${res.storeName} has been suspended and its products are hidden. Reason: ${trimmed}.`,
  });
  revalidate(id);
  return { ok: true };
}

export async function reinstateSellerAction(id: string): Promise<Result> {
  const admin = await requireAdmin();
  const res = await reinstateVerification(admin.id, id);
  if (!res.ok) return { ok: false, error: transitionError(res.reason) };
  await notifySeller(res, {
    notifType: "GENERAL",
    title: "Your store has been reinstated",
    body: `${res.storeName} is active again and your products are visible to buyers.`,
  });
  revalidate(id);
  return { ok: true };
}

export async function addNoteAction(id: string, body: string): Promise<Result> {
  const admin = await requireAdmin();
  const trimmed = body?.trim();
  if (!trimmed) return { ok: false, error: "Note can't be empty." };
  const res = await addNote(admin.id, id, trimmed);
  if (!res.ok) return { ok: false, error: transitionError(res.reason) };
  revalidate(id);
  return { ok: true };
}
