import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createQuote, createQuoteItems, getQuotes, getQuoteById,
  getQuoteItemsByQuoteId, updateQuoteStatus, getQuoteStats,
  getAllPricingConfigs, getPricingConfig, updatePricingConfig,
  getGalleryImages, createGalleryImage, deleteGalleryImage,
  createContactSubmission, getContactSubmissions, updateContactStatus,
  getUnfollowedQuotes,
} from "./db";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { nanoid } from "nanoid";
import { sendQuoteNotificationEmail, sendContactNotificationEmail, sendCustomerConfirmationEmail, sendFollowUpReminderEmail } from "./email";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Public Quote Endpoints ──────────────────────────────────────
  quote: router({
    getPricing: publicProcedure.query(async () => {
      const configs = await getAllPricingConfigs();
      const result: Record<string, Record<string, unknown>> = {};
      for (const c of configs) {
        result[c.serviceType] = c.config as Record<string, unknown>;
      }
      return result;
    }),

    submit: publicProcedure
      .input(z.object({
        customerName: z.string().min(1),
        customerEmail: z.string().email(),
        customerPhone: z.string().min(7),
        address: z.string().min(1),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        distanceMiles: z.number().optional(),
        sqft: z.number().optional(),
        stories: z.number().optional(),
        subtotal: z.number(),
        bundleDiscount: z.number().optional(),
        travelFee: z.number().optional(),
        totalPrice: z.number(),
        preferredDate: z.string().optional(),
        preferredTime: z.string().optional(),
        referralSource: z.string().optional(),
        customerPhotos: z.array(z.string()).optional(),
        items: z.array(z.object({
          serviceType: z.string(),
          packageTier: z.enum(["good", "better", "best"]).optional(),
          inputs: z.record(z.string(), z.unknown()).optional(),
          basePrice: z.number(),
          finalPrice: z.number(),
          description: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const quoteId = await createQuote({
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          address: input.address,
          city: input.city,
          state: input.state,
          zip: input.zip,
          lat: input.lat ? String(input.lat) : undefined,
          lng: input.lng ? String(input.lng) : undefined,
          distanceMiles: input.distanceMiles ? String(input.distanceMiles) : undefined,
          sqft: input.sqft,
          stories: input.stories,
          subtotal: String(input.subtotal),
          bundleDiscount: input.bundleDiscount ? String(input.bundleDiscount) : "0",
          travelFee: input.travelFee ? String(input.travelFee) : "0",
          totalPrice: String(input.totalPrice),
          preferredDate: input.preferredDate,
          preferredTime: input.preferredTime,
          referralSource: input.referralSource,
          customerPhotos: input.customerPhotos || [],
        });

        if (input.items.length > 0) {
          await createQuoteItems(input.items.map(item => ({
            quoteId,
            serviceType: item.serviceType,
            packageTier: (item.packageTier || "good") as "good" | "better" | "best",
            inputs: item.inputs || {},
            basePrice: String(item.basePrice),
            finalPrice: String(item.finalPrice),
            description: item.description,
          })));
        }

        // Notify owner (Manus in-app)
        const serviceList = input.items.map(i => i.serviceType.replace(/_/g, ' ')).join(', ');
        try {
          await notifyOwner({
            title: `New Quote: $${input.totalPrice.toFixed(2)} from ${input.customerName}`,
            content: `New quote request from ${input.customerName}\nPhone: ${input.customerPhone}\nEmail: ${input.customerEmail}\nAddress: ${input.address}\nServices: ${serviceList}\nTotal: $${input.totalPrice.toFixed(2)}\n${input.preferredDate ? `Preferred date: ${input.preferredDate}` : ''}`,
          });
        } catch (e) {
          console.warn("Failed to notify owner:", e);
        }

        // Notify owner (email)
        try {
          await sendQuoteNotificationEmail({
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            address: `${input.address}`,
            services: input.items.map(i => ({
              name: i.serviceType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              price: i.finalPrice,
            })),
            subtotal: input.subtotal,
            bundleDiscount: input.bundleDiscount || 0,
            travelFee: input.travelFee || 0,
            totalPrice: input.totalPrice,
            preferredDate: input.preferredDate,
            preferredTime: input.preferredTime,
            quoteId,
          });
        } catch (e) {
          console.warn("Failed to send quote email:", e);
        }

        // Send confirmation email to customer
        try {
          await sendCustomerConfirmationEmail({
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            address: input.address,
            services: input.items.map(i => ({
              name: i.serviceType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              price: i.finalPrice,
            })),
            subtotal: input.subtotal,
            bundleDiscount: input.bundleDiscount || 0,
            travelFee: input.travelFee || 0,
            totalPrice: input.totalPrice,
            preferredDate: input.preferredDate,
            preferredTime: input.preferredTime,
            quoteId,
          });
        } catch (e) {
          console.warn("Failed to send customer confirmation email:", e);
        }

        return { quoteId, totalPrice: input.totalPrice };
      }),

    uploadPhoto: publicProcedure
      .input(z.object({
        fileBase64: z.string(),
        fileName: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const key = `quote-photos/${nanoid()}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url, key };
      }),
  }),

  // ─── Public Gallery ──────────────────────────────────────────────
  gallery: router({
    list: publicProcedure.query(async () => {
      return getGalleryImages(true);
    }),
  }),

  // ─── Public Contact ──────────────────────────────────────────────
  contact: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        service: z.string().optional(),
        message: z.string().optional(),
        address: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createContactSubmission(input);
        // Manus in-app notification
        try {
          await notifyOwner({
            title: `New Contact: ${input.name}`,
            content: `Name: ${input.name}\nEmail: ${input.email}\nPhone: ${input.phone || 'N/A'}\nService: ${input.service || 'N/A'}\nMessage: ${input.message || 'N/A'}`,
          });
        } catch (e) {
          console.warn("Failed to notify owner:", e);
        }
        // Email notification
        try {
          await sendContactNotificationEmail({
            name: input.name,
            email: input.email,
            phone: input.phone || undefined,
            service: input.service || undefined,
            message: input.message || undefined,
            contactId: id,
          });
        } catch (e) {
          console.warn("Failed to send contact email:", e);
        }
        return { id };
      }),
  }),

  // ─── Admin Endpoints ─────────────────────────────────────────────
  admin: router({
    // Quotes management
    quotes: router({
      list: adminProcedure
        .input(z.object({
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
          status: z.string().optional(),
        }))
        .query(async ({ input }) => {
          return getQuotes(input.limit, input.offset, input.status);
        }),

      detail: adminProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          const quote = await getQuoteById(input.id);
          if (!quote) return null;
          const items = await getQuoteItemsByQuoteId(input.id);
          return { ...quote, items };
        }),

      updateStatus: adminProcedure
        .input(z.object({
          id: z.number(),
          status: z.enum(["new", "contacted", "scheduled", "completed", "cancelled"]),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          await updateQuoteStatus(input.id, input.status, input.notes);
          return { success: true };
        }),

      stats: adminProcedure.query(async () => {
        return getQuoteStats();
      }),
    }),

    // Pricing management
    pricing: router({
      list: adminProcedure.query(async () => {
        return getAllPricingConfigs();
      }),

      update: adminProcedure
        .input(z.object({
          serviceType: z.string(),
          config: z.record(z.string(), z.unknown()),
        }))
        .mutation(async ({ input, ctx }) => {
          await updatePricingConfig(input.serviceType, input.config, ctx.user.id);
          return { success: true };
        }),
    }),

    // Gallery management
    gallery: router({
      list: adminProcedure.query(async () => {
        return getGalleryImages(false);
      }),

      upload: adminProcedure
        .input(z.object({
          fileBase64: z.string(),
          fileName: z.string(),
          contentType: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
          serviceType: z.string().optional(),
          imageType: z.enum(["before", "after", "general"]).optional(),
          pairId: z.number().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const buffer = Buffer.from(input.fileBase64, "base64");
          const key = `gallery/${nanoid()}-${input.fileName}`;
          const { url } = await storagePut(key, buffer, input.contentType);
          const id = await createGalleryImage({
            imageUrl: url,
            fileKey: key,
            title: input.title,
            description: input.description,
            serviceType: input.serviceType,
            imageType: input.imageType || "general",
            pairId: input.pairId,
            uploadedBy: ctx.user.id,
          });
          return { id, url };
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await deleteGalleryImage(input.id);
          return { success: true };
        }),
    }),

    // Follow-up reminders
    followUp: router({
      check: adminProcedure.mutation(async () => {
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
            console.warn(`Failed to send follow-up for quote #${q.id}:`, e);
          }
        }
        return { checked: unfollowed.length, sent };
      }),
    }),

    // Contact submissions
    contacts: router({
      list: adminProcedure.query(async () => {
        return getContactSubmissions();
      }),

      updateStatus: adminProcedure
        .input(z.object({
          id: z.number(),
          status: z.enum(["new", "read", "replied"]),
        }))
        .mutation(async ({ input }) => {
          await updateContactStatus(input.id, input.status);
          return { success: true };
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
