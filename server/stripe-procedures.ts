import { z } from "zod";
import { protectedProcedure } from "./_core/trpc";
import Stripe from "stripe"; // Latest version
import { getDb } from "./db";
import {
  stripeCustomers,
  stripeSubscriptions,
  stripePayments,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

/**
 * Create or get Stripe customer for the current user
 */
async function getOrCreateStripeCustomer(userId: number, email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Check if customer already exists
  const existing = await db
    .select()
    .from(stripeCustomers)
    .where(eq(stripeCustomers.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId: userId.toString(),
    },
  });

  // Save to database
  await db.insert(stripeCustomers).values({
    userId,
    stripeCustomerId: customer.id,
  });

  return customer.id;
}

/**
 * Create checkout session for subscription
 */
export const createSubscriptionCheckout = protectedProcedure
  .input(
    z.object({
      priceId: z.string().min(1, "Price ID required"),
      origin: z.string().url("Valid origin URL required"),
    })
  )
  .mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }

    // Get or create Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(
      ctx.user.id,
      ctx.user.email || ""
    );

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: input.priceId,
          quantity: 1,
        },
      ],
      success_url: `${input.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${input.origin}/subscription/cancel`,
      allow_promotion_codes: true,
      metadata: {
        userId: ctx.user.id.toString(),
        userEmail: ctx.user.email,
      },
    });

    if (!session.url) {
      throw new Error("Failed to create checkout session");
    }

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  });

/**
 * Create checkout session for one-time payment
 */
export const createPaymentCheckout = protectedProcedure
  .input(
    z.object({
      amount: z.number().min(50, "Minimum $0.50 USD"),
      description: z.string().optional(),
      origin: z.string().url("Valid origin URL required"),
    })
  )
  .mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }

    // Get or create Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(
      ctx.user.id,
      ctx.user.email || ""
    );

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: input.description || "Payment",
            },
            unit_amount: input.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${input.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${input.origin}/payment/cancel`,
      metadata: {
        userId: ctx.user.id.toString(),
        userEmail: ctx.user.email,
      },
    });

    if (!session.url) {
      throw new Error("Failed to create checkout session");
    }

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  });

/**
 * Get user's active subscription
 */
export const getActiveSubscription = protectedProcedure.query(
  async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }

    const db = await getDb();
    if (!db) return null;

    const subscription = await db
      .select()
      .from(stripeSubscriptions)
      .where(eq(stripeSubscriptions.userId, ctx.user.id))
      .limit(1);

    if (subscription.length === 0) {
      return null;
    }

    return subscription[0];
  }
);

/**
 * Cancel user's subscription
 */
export const cancelSubscription = protectedProcedure.mutation(
  async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }

    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const subscription = await db
      .select()
      .from(stripeSubscriptions)
      .where(eq(stripeSubscriptions.userId, ctx.user.id))
      .limit(1);

    if (subscription.length === 0) {
      throw new Error("No active subscription");
    }

    // Cancel in Stripe
    await stripe.subscriptions.cancel(
      subscription[0].stripeSubscriptionId
    );

    // Update in database
    await db
      .update(stripeSubscriptions)
      .set({
        status: "canceled",
        canceledAt: new Date(),
      })
      .where(eq(stripeSubscriptions.id, subscription[0].id));

    return { success: true };
  }
);

/**
 * Get payment history
 */
export const getPaymentHistory = protectedProcedure.query(async ({ ctx }) => {
  if (!ctx.user) {
    return [];
  }

  const db = await getDb();
  if (!db) return [];

  const payments = await db
    .select()
    .from(stripePayments)
    .where(eq(stripePayments.userId, ctx.user.id));

  return payments;
});
