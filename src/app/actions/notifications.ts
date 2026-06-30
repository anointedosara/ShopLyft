"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/orders";
import { markRead, markAllRead, unreadCount } from "@/lib/notifications";

// User-facing notification actions. Every mutation is scoped to the signed-in
// user (the lib functions filter by userId), so a user can only touch their own.

export async function markNotificationReadAction(id: string): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user) return { ok: false };
  await markRead(id, user.id);
  revalidatePath("/account/notifications");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user) return { ok: false };
  await markAllRead(user.id);
  revalidatePath("/account/notifications");
  return { ok: true };
}

// Used by the header bell to show an unread count for the current user.
export async function getUnreadNotificationsCountAction(): Promise<number> {
  const user = await getSessionUser();
  if (!user) return 0;
  return unreadCount(user.id);
}
