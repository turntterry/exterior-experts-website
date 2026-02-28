import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean } from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Quotes ──────────────────────────────────────────────────────────
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  // Contact info
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  // Address
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zip: varchar("zip", { length: 10 }),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  distanceMiles: decimal("distanceMiles", { precision: 6, scale: 2 }),
  // Property info
  sqft: int("sqft"),
  stories: int("stories"),
  // Pricing
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  bundleDiscount: decimal("bundleDiscount", { precision: 10, scale: 2 }).default("0"),
  travelFee: decimal("travelFee", { precision: 10, scale: 2 }).default("0"),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  // Scheduling
  preferredDate: varchar("preferredDate", { length: 20 }),
  preferredTime: varchar("preferredTime", { length: 20 }),
  // Status
  status: mysqlEnum("status", ["new", "contacted", "scheduled", "completed", "cancelled"]).default("new").notNull(),
  notes: text("notes"),
  referralSource: varchar("referralSource", { length: 100 }),
  // Photos uploaded by customer
  customerPhotos: json("customerPhotos").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

// ─── Quote Items (individual services in a quote) ────────────────────
export const quoteItems = mysqlTable("quote_items", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(),
  serviceType: varchar("serviceType", { length: 50 }).notNull(),
  packageTier: mysqlEnum("packageTier", ["good", "better", "best"]).default("good"),
  // Service-specific inputs stored as JSON
  inputs: json("inputs").$type<Record<string, unknown>>(),
  // Calculated price
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  finalPrice: decimal("finalPrice", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = typeof quoteItems.$inferInsert;

// ─── Pricing Config (admin-editable pricing formulas) ────────────────
export const pricingConfig = mysqlTable("pricing_config", {
  id: int("id").autoincrement().primaryKey(),
  serviceType: varchar("serviceType", { length: 50 }).notNull().unique(),
  config: json("config").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
});

export type PricingConfig = typeof pricingConfig.$inferSelect;
export type InsertPricingConfig = typeof pricingConfig.$inferInsert;

// ─── Gallery Images ──────────────────────────────────────────────────
export const galleryImages = mysqlTable("gallery_images", {
  id: int("id").autoincrement().primaryKey(),
  imageUrl: text("imageUrl").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  serviceType: varchar("serviceType", { length: 50 }),
  imageType: mysqlEnum("imageType", ["before", "after", "general"]).default("general"),
  pairId: int("pairId"),
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GalleryImage = typeof galleryImages.$inferSelect;
export type InsertGalleryImage = typeof galleryImages.$inferInsert;

// ─── Contact Submissions ─────────────────────────────────────────────
export const contactSubmissions = mysqlTable("contact_submissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  service: varchar("service", { length: 100 }),
  message: text("message"),
  address: text("address"),
  status: mysqlEnum("status", ["new", "read", "replied"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

// ─── Stripe Customers ────────────────────────────────────────────────
export const stripeCustomers = mysqlTable("stripe_customers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StripeCustomer = typeof stripeCustomers.$inferSelect;
export type InsertStripeCustomer = typeof stripeCustomers.$inferInsert;

// ─── Stripe Subscriptions ────────────────────────────────────────────
export const stripeSubscriptions = mysqlTable("stripe_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).notNull().unique(),
  stripePriceId: varchar("stripePriceId", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(), // active, past_due, canceled, unpaid
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  canceledAt: timestamp("canceledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StripeSubscription = typeof stripeSubscriptions.$inferSelect;
export type InsertStripeSubscription = typeof stripeSubscriptions.$inferInsert;

// ─── Stripe Payment Intents (for one-time purchases) ──────────────────
export const stripePayments = mysqlTable("stripe_payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("usd").notNull(),
  status: varchar("status", { length: 50 }).notNull(), // succeeded, processing, requires_action, canceled
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StripePayment = typeof stripePayments.$inferSelect;
export type InsertStripePayment = typeof stripePayments.$inferInsert;
