import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "./_core/trpc";
import { trackVisitorSession, trackPageView, getRecentVisitors } from "./visitor-tracking";
import { sendVisitorNotificationEmail } from "./visitor-email";

/**
 * Track visitor page view
 */
export const trackPageViewProcedure = publicProcedure
  .input(
    z.object({
      sessionId: z.string().min(1),
      pagePath: z.string().min(1),
      pageTitle: z.string().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    try {
      // Ensure session is tracked
      await trackVisitorSession(ctx.req, input.sessionId);

      // Track page view
      await trackPageView(
        input.sessionId,
        input.pagePath,
        input.pageTitle || "Unknown Page"
      );

      // Send email notification to owner (non-blocking)
      // Fire and forget - don't wait for email to complete
      sendVisitorNotificationEmail(
        input.sessionId,
        input.pagePath,
        input.pageTitle || "Unknown Page"
      ).catch((err) => {
        console.warn("[Visitor Tracking] Email send error (non-blocking):", err);
      });

      return { success: true };
    } catch (error) {
      console.warn("[Visitor Tracking] Error tracking page view:", error);
      return { success: false };
    }
  });

/**
 * Get recent visitors for admin dashboard
 */
export const getRecentVisitorsProcedure = adminProcedure
  .input(
    z.object({
      limit: z.number().optional().default(50),
    })
  )
  .query(async ({ input }) => {
    try {
      const visitors = await getRecentVisitors(input.limit);
      return visitors;
    } catch (error) {
      console.warn("[Visitor Tracking] Error fetching visitors:", error);
      return [];
    }
  });

/**
 * Visitor tracking router
 */
export const visitorRouter = router({
  trackPageView: trackPageViewProcedure,
  getRecentVisitors: getRecentVisitorsProcedure,
});
