import { Resend } from "resend";

const OWNER_EMAIL = "randall@exteriorexperts.co";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "notifications@exteriorexperts.co";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured — email notifications disabled");
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// ─── Quote Submission Email ───────────────────────────────────────────

export async function sendQuoteNotificationEmail(data: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  services: { name: string; price: number }[];
  subtotal: number;
  bundleDiscount: number;
  travelFee: number;
  totalPrice: number;
  preferredDate?: string;
  preferredTime?: string;
  quoteId: number;
}): Promise<boolean> {
  const client = getResend();
  if (!client) return false;

  const serviceRows = data.services
    .map(s => `<tr><td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;">${s.name}</td><td style="padding:8px 16px;border-bottom:1px solid #e5e7eb;text-align:right;">$${s.price.toFixed(2)}</td></tr>`)
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f3f4f6;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#0f2a44;padding:24px 32px;border-radius:12px 12px 0 0;">
      <h1 style="color:white;margin:0;font-size:22px;">🧾 New Quote Request</h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Quote #${data.quoteId}</p>
    </div>
    <div style="background:white;padding:32px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <h2 style="color:#0f2a44;font-size:18px;margin:0 0 16px;">Customer Info</h2>
      <table style="width:100%;margin-bottom:24px;">
        <tr><td style="padding:4px 0;color:#6b7280;width:120px;">Name</td><td style="padding:4px 0;font-weight:600;">${data.customerName}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Phone</td><td style="padding:4px 0;"><a href="tel:${data.customerPhone}" style="color:#0ea5e9;text-decoration:none;font-weight:600;">${data.customerPhone}</a></td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Email</td><td style="padding:4px 0;"><a href="mailto:${data.customerEmail}" style="color:#0ea5e9;text-decoration:none;">${data.customerEmail}</a></td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Address</td><td style="padding:4px 0;">${data.address}</td></tr>
        ${data.preferredDate ? `<tr><td style="padding:4px 0;color:#6b7280;">Preferred Date</td><td style="padding:4px 0;">${data.preferredDate}</td></tr>` : ""}
        ${data.preferredTime ? `<tr><td style="padding:4px 0;color:#6b7280;">Preferred Time</td><td style="padding:4px 0;">${data.preferredTime}</td></tr>` : ""}
      </table>

      <h2 style="color:#0f2a44;font-size:18px;margin:0 0 12px;">Services Requested</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 16px;text-align:left;font-size:13px;color:#6b7280;border-bottom:2px solid #e5e7eb;">Service</th>
            <th style="padding:8px 16px;text-align:right;font-size:13px;color:#6b7280;border-bottom:2px solid #e5e7eb;">Price</th>
          </tr>
        </thead>
        <tbody>${serviceRows}</tbody>
      </table>

      <table style="width:100%;margin-bottom:24px;">
        <tr><td style="padding:4px 16px;color:#6b7280;">Subtotal</td><td style="padding:4px 16px;text-align:right;">$${data.subtotal.toFixed(2)}</td></tr>
        ${data.bundleDiscount > 0 ? `<tr><td style="padding:4px 16px;color:#16a34a;">Bundle Discount</td><td style="padding:4px 16px;text-align:right;color:#16a34a;">-$${data.bundleDiscount.toFixed(2)}</td></tr>` : ""}
        ${data.travelFee > 0 ? `<tr><td style="padding:4px 16px;color:#6b7280;">Travel Fee</td><td style="padding:4px 16px;text-align:right;">+$${data.travelFee.toFixed(2)}</td></tr>` : ""}
        <tr style="font-size:20px;font-weight:700;">
          <td style="padding:12px 16px;border-top:2px solid #0f2a44;color:#0f2a44;">Total</td>
          <td style="padding:12px 16px;border-top:2px solid #0f2a44;text-align:right;color:#0f2a44;">$${data.totalPrice.toFixed(2)}</td>
        </tr>
      </table>

      <p style="color:#6b7280;font-size:13px;margin:0;">This quote was submitted through the Exterior Experts instant quote tool. Log in to your admin dashboard to manage this lead.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const { error } = await client.emails.send({
      from: `Exterior Experts <${FROM_EMAIL}>`,
      to: [OWNER_EMAIL],
      subject: `New Quote #${data.quoteId}: $${data.totalPrice.toFixed(2)} from ${data.customerName}`,
      html,
    });
    if (error) {
      console.warn("[Email] Failed to send quote notification:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[Email] Error sending quote notification:", err);
    return false;
  }
}

// ─── Contact Form Email ───────────────────────────────────────────────

export async function sendContactNotificationEmail(data: {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message?: string;
  contactId: number;
}): Promise<boolean> {
  const client = getResend();
  if (!client) return false;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f3f4f6;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#0f2a44;padding:24px 32px;border-radius:12px 12px 0 0;">
      <h1 style="color:white;margin:0;font-size:22px;">📬 New Contact Form Submission</h1>
    </div>
    <div style="background:white;padding:32px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <table style="width:100%;margin-bottom:24px;">
        <tr><td style="padding:6px 0;color:#6b7280;width:120px;">Name</td><td style="padding:6px 0;font-weight:600;">${data.name}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;"><a href="mailto:${data.email}" style="color:#0ea5e9;text-decoration:none;">${data.email}</a></td></tr>
        ${data.phone ? `<tr><td style="padding:6px 0;color:#6b7280;">Phone</td><td style="padding:6px 0;"><a href="tel:${data.phone}" style="color:#0ea5e9;text-decoration:none;font-weight:600;">${data.phone}</a></td></tr>` : ""}
        ${data.service ? `<tr><td style="padding:6px 0;color:#6b7280;">Service</td><td style="padding:6px 0;">${data.service}</td></tr>` : ""}
      </table>
      ${data.message ? `
      <h2 style="color:#0f2a44;font-size:16px;margin:0 0 8px;">Message</h2>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;color:#374151;line-height:1.6;">${data.message}</div>
      ` : ""}
      <p style="color:#6b7280;font-size:13px;margin:24px 0 0;">Submitted through the Exterior Experts contact form. Log in to your admin dashboard to respond.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const { error } = await client.emails.send({
      from: `Exterior Experts <${FROM_EMAIL}>`,
      to: [OWNER_EMAIL],
      subject: `New Contact: ${data.name}${data.service ? ` — ${data.service}` : ""}`,
      html,
    });
    if (error) {
      console.warn("[Email] Failed to send contact notification:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[Email] Error sending contact notification:", err);
    return false;
  }
}
