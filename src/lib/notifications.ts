import "server-only";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import type { NotificationType, EmailType } from "@prisma/client";

// In-app notifications for sellers and admins. Lightweight: a row per event,
// surfaced in the account/seller UI. notify() pairs each in-app notification with
// an email so the user is reached even when they're not on the site; the in-app
// row is still written if email delivery is off.

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    },
  });
}

// Every notification type maps to an email type (mirrors the enums 1:1).
const EMAIL_TYPE: Record<NotificationType, EmailType> = {
  VERIFICATION_SUBMITTED: "VERIFICATION_SUBMITTED",
  VERIFICATION_APPROVED: "VERIFICATION_APPROVED",
  VERIFICATION_REJECTED: "VERIFICATION_REJECTED",
  INFO_REQUESTED: "INFO_REQUESTED",
  NEW_REVIEW: "NEW_REVIEW",
  REVIEW_REPLY: "REVIEW_REPLY",
  GENERAL: "GENERAL",
};

function appUrl(href?: string | null): string | null {
  if (!href) return null;
  if (/^https?:\/\//.test(href)) return href;
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "").replace(/\/$/, "");
  return base ? `${base}${href.startsWith("/") ? "" : "/"}${href}` : null;
}

// Escape user-controlled text before interpolating it into outbound HTML
// (store names, admin rejection reasons, etc. flow into title/body).
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Minimal branded HTML for a notification email.
function renderEmail(title: string, body: string, href?: string | null): string {
  const link = appUrl(href);
  const cta = link
    ? `<p style="margin:24px 0 0"><a href="${esc(link)}" style="background:#c2540a;color:#fff;text-decoration:none;font-weight:600;padding:11px 20px;border-radius:10px;display:inline-block">View on ShopLyft</a></p>`
    : "";
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;color:#1c1917">
    <p style="font-weight:800;font-size:20px;margin:0 0 4px">Shop<span style="color:#c2540a">Lyft</span></p>
    <h1 style="font-size:18px;margin:16px 0 8px">${esc(title)}</h1>
    <p style="font-size:14px;line-height:1.6;color:#44403c;margin:0">${esc(body)}</p>
    ${cta}
  </div>`;
}

// Raise a notification AND email it. The in-app row is the source of truth; the
// email is best-effort (sendEmail never throws and logs every attempt). Pass
// email:false for low-value notifications that shouldn't hit the inbox; pass
// toEmail to skip the user lookup when the address is already known.
export async function notify(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
  email?: boolean;
  toEmail?: string | null;
}) {
  const notification = await createNotification(input);

  if (input.email !== false) {
    let to = input.toEmail ?? null;
    if (!to) {
      const u = await prisma.user.findUnique({ where: { id: input.userId }, select: { email: true } });
      to = u?.email ?? null;
    }
    if (to) {
      await sendEmail({
        to,
        type: EMAIL_TYPE[input.type],
        subject: input.title,
        html: renderEmail(input.title, input.body, input.href),
        relatedUserId: input.userId,
      });
    }
  }

  return notification;
}

export async function listForUser(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function unreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

// Marks one notification read, scoped to its owner so a user can't flip
// someone else's notifications.
export async function markRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
