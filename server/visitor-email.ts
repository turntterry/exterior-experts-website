import { Resend } from "resend";
import { getVisitorDetails } from "./visitor-tracking";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send visitor notification email to owner
 */
export async function sendVisitorNotificationEmail(
  sessionId: string,
  pagePath: string,
  pageTitle: string
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Visitor Email] RESEND_API_KEY not configured");
    return false;
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    console.warn("[Visitor Email] RESEND_FROM_EMAIL not configured");
    return false;
  }

  try {
    const visitorDetails = await getVisitorDetails(sessionId);
    if (!visitorDetails) {
      console.warn("[Visitor Email] Could not find visitor details");
      return false;
    }

    const deviceTypeMap: Record<string, string> = {
      mobile: "📱",
      tablet: "📱",
      desktop: "💻",
    };
    const deviceEmoji = (visitorDetails.deviceType && deviceTypeMap[visitorDetails.deviceType]) || "🌐";

    const firstVisit = new Date(visitorDetails.firstVisitAt).toLocaleString();
    const lastVisit = new Date(visitorDetails.lastVisitAt).toLocaleString();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">🔔 New Visitor Activity</h2>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Page Visited:</strong> ${pageTitle}</p>
          <p><strong>URL:</strong> ${pagePath}</p>
          <p><strong>Device:</strong> ${deviceEmoji} ${visitorDetails.deviceType || "Unknown"}</p>
          <p><strong>IP Address:</strong> ${visitorDetails.ipAddress}</p>
          <p><strong>First Visit:</strong> ${firstVisit}</p>
          <p><strong>Total Page Views:</strong> ${visitorDetails.pageViewCount}</p>
          ${visitorDetails.referrer ? `<p><strong>Referrer:</strong> ${visitorDetails.referrer}</p>` : ""}
        </div>

        <p style="color: #666; font-size: 12px;">
          Session ID: ${sessionId}
        </p>
      </div>
    `;

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.OWNER_EMAIL || "randall@exteriorexperts.co",
      subject: `👀 Visitor on ${pageTitle}`,
      html,
    });

    if (result.error) {
      console.warn("[Visitor Email] Failed to send:", result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[Visitor Email] Error sending email:", error);
    return false;
  }
}
