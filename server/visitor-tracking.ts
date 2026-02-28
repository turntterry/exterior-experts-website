import { getDb } from "./db";
import { visitorSessions, pageViews } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { UAParser } from "ua-parser-js";

/**
 * Parse user agent to detect device type
 */
function getDeviceType(userAgent: string): string {
  const parser = new UAParser(userAgent);
  const device = parser.getDevice();
  if (device.type === "mobile") return "mobile";
  if (device.type === "tablet") return "tablet";
  return "desktop";
}

/**
 * Get client IP from request
 */
export function getClientIP(req: any): string {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

/**
 * Track a visitor session (first visit or returning)
 */
export async function trackVisitorSession(
  req: any,
  sessionId: string
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const ipAddress = getClientIP(req);
  const userAgent = req.headers["user-agent"] || "";
  const deviceType = getDeviceType(userAgent);
  const referrer = req.headers["referer"] || "";

  // Check if session already exists
  const existing = await db
    .select()
    .from(visitorSessions)
    .where(eq(visitorSessions.sessionId, sessionId))
    .limit(1);

  if (existing.length > 0) {
    // Update last visit time
    await db
      .update(visitorSessions)
      .set({
        lastVisitAt: new Date(),
      })
      .where(eq(visitorSessions.sessionId, sessionId));

    return sessionId;
  }

  // Create new visitor session
  await db.insert(visitorSessions).values({
    sessionId,
    ipAddress,
    userAgent,
    deviceType,
    referrer: referrer || null,
    country: null, // Can be populated with geolocation service
    city: null,
  });

  return sessionId;
}

/**
 * Track a page view
 */
export async function trackPageView(
  sessionId: string,
  pagePath: string,
  pageTitle: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Insert page view
  await db.insert(pageViews).values({
    sessionId,
    pagePath,
    pageTitle,
    timeSpentSeconds: 0,
  });

  // Increment page view count for session
  const session = await db
    .select()
    .from(visitorSessions)
    .where(eq(visitorSessions.sessionId, sessionId))
    .limit(1);

  if (session.length > 0) {
    await db
      .update(visitorSessions)
      .set({
        pageViewCount: (session[0].pageViewCount || 0) + 1,
      })
      .where(eq(visitorSessions.sessionId, sessionId));
  }
}

/**
 * Get visitor session details with page views
 */
export async function getVisitorDetails(sessionId: string) {
  const db = await getDb();
  if (!db) return null;

  const session = await db
    .select()
    .from(visitorSessions)
    .where(eq(visitorSessions.sessionId, sessionId))
    .limit(1);

  if (session.length === 0) return null;

  const views = await db
    .select()
    .from(pageViews)
    .where(eq(pageViews.sessionId, sessionId));

  return {
    ...session[0],
    pageViews: views,
  };
}

/**
 * Get recent visitors (last N visitors)
 */
export async function getRecentVisitors(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  const visitors = await db
    .select()
    .from(visitorSessions)
    .orderBy((t) => t.lastVisitAt)
    .limit(limit);

  return visitors;
}
