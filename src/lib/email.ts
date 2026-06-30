import "server-only";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import type { EmailType } from "@prisma/client";

// Transactional email via Resend. Feature-flagged: if RESEND_API_KEY is absent
// we don't send — the message is recorded in EmailLog with status LOGGED and
// printed to the server console, so the verification workflow is fully testable
// in dev without an email provider. Every attempt (sent, failed, logged) is
// written to EmailLog for the audit trail. Email templates are added in a later
// increment; this is the low-level sender they all funnel through.

const API_KEY = process.env.RESEND_API_KEY;
export const isConfigured = Boolean(API_KEY);

export const EMAIL_FROM = process.env.EMAIL_FROM || "ShopLyft <onboarding@resend.dev>";
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

const resend = isConfigured ? new Resend(API_KEY) : null;

export type SendEmailInput = {
  to: string;
  type: EmailType;
  subject: string;
  html: string;
  text?: string;
  relatedUserId?: string | null;
};

export type SendEmailResult = { ok: boolean; id?: string; logged?: boolean; error?: string };

// Sends one email and records the outcome. Never throws — a failed send must not
// break the surrounding workflow (e.g. an approval still succeeds even if its
// notification email bounces).
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const { to, type, subject, html, text, relatedUserId } = input;

  if (!to) {
    await logEmail({ to: "", type, subject, status: "FAILED", error: "missing recipient", relatedUserId });
    return { ok: false, error: "missing recipient" };
  }

  if (!resend) {
    // No provider configured — record and surface to console for local dev.
    console.info(`[email:LOGGED] to=${to} type=${type} subject="${subject}"`);
    await logEmail({ to, type, subject, status: "LOGGED", relatedUserId });
    return { ok: true, logged: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text: text ?? stripHtml(html),
    });
    if (error) {
      await logEmail({ to, type, subject, status: "FAILED", error: error.message, relatedUserId });
      return { ok: false, error: error.message };
    }
    await logEmail({ to, type, subject, status: "SENT", providerId: data?.id, relatedUserId });
    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    await logEmail({ to, type, subject, status: "FAILED", error: message, relatedUserId });
    return { ok: false, error: message };
  }
}

async function logEmail(data: {
  to: string;
  type: EmailType;
  subject: string;
  status: "SENT" | "FAILED" | "LOGGED";
  providerId?: string | null;
  error?: string | null;
  relatedUserId?: string | null;
}) {
  try {
    await prisma.emailLog.create({
      data: {
        to: data.to,
        type: data.type,
        subject: data.subject,
        status: data.status,
        providerId: data.providerId ?? null,
        error: data.error ?? null,
        relatedUserId: data.relatedUserId ?? null,
      },
    });
  } catch (err) {
    // Logging the email must never be the thing that breaks a request.
    console.error("Failed to write EmailLog", err);
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
