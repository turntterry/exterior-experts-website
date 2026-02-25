import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import fs from "fs";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getUnfollowedQuotes } from "../db";
import { sendFollowUpReminderEmail } from "../email";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Cron endpoint for follow-up reminders (can be called by external cron or internal timer)
  app.post("/api/cron/follow-up", async (req, res) => {
    try {
      const unfollowed = await getUnfollowedQuotes(24);
      let sent = 0;
      for (const q of unfollowed) {
        const hoursAgo = Math.round((Date.now() - new Date(q.createdAt).getTime()) / (1000 * 60 * 60));
        try {
          const ok = await sendFollowUpReminderEmail({
            customerName: q.customerName,
            customerEmail: q.customerEmail,
            customerPhone: q.customerPhone,
            address: q.address,
            totalPrice: Number(q.totalPrice),
            quoteId: q.id,
            hoursAgo,
          });
          if (ok) sent++;
        } catch (e) {
          console.warn(`Follow-up failed for quote #${q.id}:`, e);
        }
      }
      res.json({ checked: unfollowed.length, sent });
    } catch (e) {
      console.error("Follow-up cron error:", e);
      res.status(500).json({ error: "Internal error" });
    }
  });

  // Add X-Robots-Tag noindex header to all admin routes
  app.use("/admin", (req, res, next) => {
    res.set("X-Robots-Tag", "noindex, nofollow");
    next();
  });

  // Sitemap route - filter out admin URLs
  app.get("/sitemap.xml", (req, res) => {
    const sitemapPath = process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public", "sitemap.xml")
      : path.resolve(import.meta.dirname, "public", "sitemap.xml");
    
    try {
      const sitemapContent = fs.readFileSync(sitemapPath, "utf-8");
      const filtered = sitemapContent.replace(
        /<url>\s*<loc>https:\/\/[^<]*\/admin[^<]*<\/loc>[^<]*<changefreq>[^<]*<\/changefreq>[^<]*<priority>[^<]*<\/priority>\s*<\/url>/gi,
        ""
      );
      res.set("Content-Type", "application/xml");
      res.send(filtered);
    } catch (e) {
      res.status(404).send("Sitemap not found");
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    // Auto-check for unfollowed quotes every 6 hours
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    setInterval(async () => {
      try {
        const unfollowed = await getUnfollowedQuotes(24);
        for (const q of unfollowed) {
          const hoursAgo = Math.round((Date.now() - new Date(q.createdAt).getTime()) / (1000 * 60 * 60));
          await sendFollowUpReminderEmail({
            customerName: q.customerName,
            customerEmail: q.customerEmail,
            customerPhone: q.customerPhone,
            address: q.address,
            totalPrice: Number(q.totalPrice),
            quoteId: q.id,
            hoursAgo,
          }).catch(() => {});
        }
        if (unfollowed.length > 0) {
          console.log(`[Follow-Up] Checked ${unfollowed.length} unfollowed quotes`);
        }
      } catch (e) {
        console.warn("[Follow-Up] Auto-check error:", e);
      }
    }, SIX_HOURS);
  });
}

startServer().catch(console.error);
