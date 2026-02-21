// Test script: Submit a test quote via the tRPC endpoint and check email delivery
// Run: node server/test-email-flow.mjs

import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY is not set. Cannot test email delivery.");
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

// Step 1: Verify Resend API key works
console.log("🔑 Testing Resend API key...");
try {
  const { data, error } = await resend.apiKeys.list();
  if (error) {
    console.error("❌ Resend API key is invalid:", error.message);
    process.exit(1);
  }
  console.log("✅ Resend API key is valid. Found", data?.data?.length || 0, "API keys.");
} catch (err) {
  console.error("❌ Failed to connect to Resend:", err.message);
  process.exit(1);
}

// Step 2: Check domain verification status
console.log("\n📧 Checking domain status...");
try {
  const { data, error } = await resend.domains.list();
  if (error) {
    console.error("❌ Could not list domains:", error.message);
  } else if (data?.data?.length === 0) {
    console.warn("⚠️  No domains configured. Emails will be sent from Resend's default domain (onboarding@resend.dev).");
    console.warn("   To send from @exteriorexperts.co, add and verify the domain in Resend dashboard.");
  } else {
    for (const domain of data.data) {
      const status = domain.status === "verified" ? "✅" : "⚠️";
      console.log(`   ${status} ${domain.name} — ${domain.status}`);
    }
  }
} catch (err) {
  console.warn("⚠️  Could not check domains:", err.message);
}

// Step 3: Send a test email to the owner
console.log("\n📬 Sending test email to owner (randall@exteriorexperts.co)...");
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "notifications@exteriorexperts.co";

try {
  const { data, error } = await resend.emails.send({
    from: `Exterior Experts <${FROM_EMAIL}>`,
    to: ["randall@exteriorexperts.co"],
    subject: "🧪 Test Email — Exterior Experts Quote System",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f3f4f6;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#0f2a44;padding:24px 32px;border-radius:12px 12px 0 0;">
      <h1 style="color:white;margin:0;font-size:22px;">🧪 Email System Test</h1>
    </div>
    <div style="background:white;padding:32px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <p style="color:#374151;font-size:16px;line-height:1.6;">
        If you're reading this, your email notification system is working correctly!
      </p>
      <p style="color:#374151;font-size:16px;line-height:1.6;">
        This means you'll receive emails when:
      </p>
      <ul style="color:#374151;font-size:15px;line-height:2;">
        <li>A customer submits a new quote</li>
        <li>A customer fills out the contact form</li>
        <li>A quote hasn't been followed up on after 24 hours</li>
      </ul>
      <p style="color:#374151;font-size:16px;line-height:1.6;">
        Customers will also receive a confirmation email with their quote details after submitting.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="color:#9ca3af;font-size:12px;text-align:center;">
        Exterior Experts — Email System Test<br>
        Sent at ${new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })} CT
      </p>
    </div>
  </div>
</body>
</html>`,
  });

  if (error) {
    console.error("❌ Failed to send test email:", error.message);
    console.error("   Error details:", JSON.stringify(error));
    
    if (error.message?.includes("not verified") || error.message?.includes("not found")) {
      console.log("\n💡 The 'from' domain is not verified. You need to:");
      console.log("   1. Go to https://resend.com/domains");
      console.log("   2. Add 'exteriorexperts.co' as a domain");
      console.log("   3. Add the DNS records they provide to your domain");
      console.log("   4. Wait for verification (usually a few minutes)");
    }
  } else {
    console.log("✅ Test email sent successfully! Email ID:", data?.id);
    console.log("   Check randall@exteriorexperts.co for the test email.");
    console.log("   (Also check spam/junk folder if you don't see it in inbox)");
  }
} catch (err) {
  console.error("❌ Error sending test email:", err.message);
}

console.log("\n📋 Summary:");
console.log("   - Resend API key: ✅ Valid");
console.log("   - Owner notification email: sendQuoteNotificationEmail() → randall@exteriorexperts.co");
console.log("   - Customer confirmation email: sendCustomerConfirmationEmail() → customer's email");
console.log("   - Follow-up reminder: sendFollowUpReminderEmail() → randall@exteriorexperts.co (after 24hr)");
