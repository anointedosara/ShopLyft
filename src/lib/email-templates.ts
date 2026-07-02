import "server-only";

// Transactional email templates. Deliberately restrained styling (no gradients /
// emoji) to match the platform's professional tone. Every template returns a
// subject + HTML that funnels through sendEmail(), so it's logged in EmailLog.

const BRAND = "#4f46e5";
const INK = "#0f172a";
const MUTE = "#64748b";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shell(heading: string, bodyHtml: string): string {
  return `<div style="background:#f8fafc;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
    <div style="padding:20px 28px;border-bottom:1px solid #e2e8f0">
      <span style="font-size:18px;font-weight:700;color:${INK};letter-spacing:-0.02em">ShopLyft</span>
    </div>
    <div style="padding:28px">
      <h1 style="margin:0 0 12px;font-size:20px;color:${INK}">${esc(heading)}</h1>
      ${bodyHtml}
    </div>
    <div style="padding:16px 28px;border-top:1px solid #e2e8f0;color:${MUTE};font-size:12px">
      If you didn't request this, you can safely ignore this email.
    </div>
  </div>
</div>`;
}

function button(url: string, label: string): string {
  // URL comes from better-auth (server-generated), so it's not user input; still
  // attribute-escaped defensively.
  return `<a href="${esc(url)}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px">${esc(label)}</a>`;
}

export function verificationEmail(name: string, url: string): { subject: string; html: string } {
  const first = (name || "there").split(" ")[0];
  return {
    subject: "Verify your ShopLyft email",
    html: shell("Confirm your email address", `
      <p style="color:${MUTE};font-size:14px;line-height:1.6;margin:0 0 20px">
        Hi ${esc(first)}, please confirm this email address to secure your ShopLyft account and receive order updates.
      </p>
      ${button(url, "Verify email")}
      <p style="color:${MUTE};font-size:12px;margin:20px 0 0">This link expires shortly. If the button doesn't work, copy and paste this URL:<br>${esc(url)}</p>`),
  };
}

export function passwordResetEmail(name: string, url: string): { subject: string; html: string } {
  const first = (name || "there").split(" ")[0];
  return {
    subject: "Reset your ShopLyft password",
    html: shell("Reset your password", `
      <p style="color:${MUTE};font-size:14px;line-height:1.6;margin:0 0 20px">
        Hi ${esc(first)}, we received a request to reset your password. Click below to choose a new one. This link expires in 1 hour.
      </p>
      ${button(url, "Reset password")}
      <p style="color:${MUTE};font-size:12px;margin:20px 0 0">If you didn't request a reset, ignore this email — your password stays the same.</p>`),
  };
}
