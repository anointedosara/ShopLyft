"use server";

import { sendEmail } from "@/lib/email";

// Sends a welcome email when someone subscribes to the newsletter. Best-effort:
// sendEmail records the attempt in EmailLog and never throws. If RESEND_API_KEY
// isn't set the message is logged rather than delivered.
export async function subscribeNewsletterAction(
  email: string
): Promise<{ ok: boolean; error?: string }> {
  const to = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;color:#1c1917">
    <p style="font-weight:800;font-size:22px;margin:0 0 8px">Shop<span style="color:#c2540a">Lyft</span></p>
    <h1 style="font-size:20px;margin:16px 0 8px">You're in! 🎉</h1>
    <p style="font-size:14px;line-height:1.6;color:#44403c;margin:0 0 12px">
      Thanks for subscribing. As a welcome gift, here's <b>₦2,000 off</b> your first order —
      just use code <b style="color:#c2540a">WELCOME2000</b> at checkout.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#44403c;margin:0">
      You'll now be first to hear about flash sales, new arrivals and exclusive deals.
    </p>
  </div>`;

  await sendEmail({
    to,
    type: "GENERAL",
    subject: "Welcome to ShopLyft — ₦2,000 off your first order 🎉",
    html,
  });

  return { ok: true };
}
