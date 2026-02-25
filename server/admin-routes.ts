import express, { Request, Response } from "express";
import { sdk } from "./_core/sdk";

/**
 * Server-side admin routes that enforce authentication at the HTTP level.
 * These routes return 404 for non-authenticated requests, preventing them
 * from appearing in sitemaps or being crawled by bots.
 */
export function setupAdminRoutes(app: express.Express) {
  // Middleware to check admin authentication
  const adminAuth = async (req: Request, res: Response, next: express.NextFunction) => {
    try {
      let user = null;
      try {
        user = await sdk.authenticateRequest(req);
      } catch (e) {
        // Not authenticated
      }
      
      if (!user || user.role !== "admin") {
        // Return 404 instead of 403 to hide the route from crawlers
        return res.status(404).send("Not Found");
      }
      // Attach user to request for downstream handlers
      (req as any).user = user;
      next();
    } catch (e) {
      res.status(404).send("Not Found");
    }
  };

  // Apply admin auth middleware to all /admin routes
  app.use("/admin", adminAuth);

  // Serve admin pages as HTML (client-side routing will handle them)
  app.get("/admin*", (req, res) => {
    // Admin auth middleware already checked authentication above
    // Return the index.html and let client-side router handle it
    res.set("X-Robots-Tag", "noindex, nofollow");
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    // This will be handled by the catch-all route below
    // For now, just continue to next middleware
  });
}
