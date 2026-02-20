import { eq, desc, sql, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  quotes, InsertQuote, Quote,
  quoteItems, InsertQuoteItem,
  pricingConfig,
  galleryImages, InsertGalleryImage,
  contactSubmissions, InsertContactSubmission,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Quotes ──────────────────────────────────────────────────────────
export async function createQuote(data: InsertQuote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(quotes).values(data);
  return result[0].insertId;
}

export async function createQuoteItems(items: InsertQuoteItem[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (items.length === 0) return;
  await db.insert(quoteItems).values(items);
}

export async function getQuotes(limit = 50, offset = 0, status?: string) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(quotes).orderBy(desc(quotes.createdAt)).limit(limit).offset(offset);
  if (status) {
    return db.select().from(quotes).where(eq(quotes.status, status as any)).orderBy(desc(quotes.createdAt)).limit(limit).offset(offset);
  }
  return query;
}

export async function getQuoteById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getQuoteItemsByQuoteId(quoteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
}

export async function updateQuoteStatus(id: number, status: string, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { status };
  if (notes !== undefined) updateData.notes = notes;
  await db.update(quotes).set(updateData as any).where(eq(quotes.id, id));
}

export async function getQuoteStats() {
  const db = await getDb();
  if (!db) return { total: 0, new: 0, contacted: 0, scheduled: 0, completed: 0, cancelled: 0, totalRevenue: 0 };
  const result = await db.select({
    total: sql<number>`COUNT(*)`,
    newCount: sql<number>`SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END)`,
    contacted: sql<number>`SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END)`,
    scheduled: sql<number>`SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END)`,
    completed: sql<number>`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`,
    cancelled: sql<number>`SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END)`,
    totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN status = 'completed' THEN totalPrice ELSE 0 END), 0)`,
  }).from(quotes);
  const r = result[0];
  return {
    total: Number(r.total),
    new: Number(r.newCount),
    contacted: Number(r.contacted),
    scheduled: Number(r.scheduled),
    completed: Number(r.completed),
    cancelled: Number(r.cancelled),
    totalRevenue: Number(r.totalRevenue),
  };
}

// ─── Pricing Config ──────────────────────────────────────────────────
export async function getAllPricingConfigs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pricingConfig);
}

export async function getPricingConfig(serviceType: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(pricingConfig).where(eq(pricingConfig.serviceType, serviceType)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updatePricingConfig(serviceType: string, config: Record<string, unknown>, userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(pricingConfig)
    .set({ config: config as any, updatedBy: userId || null })
    .where(eq(pricingConfig.serviceType, serviceType));
}

// ─── Gallery ─────────────────────────────────────────────────────────
export async function getGalleryImages(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(galleryImages).where(eq(galleryImages.isActive, true)).orderBy(galleryImages.sortOrder);
  }
  return db.select().from(galleryImages).orderBy(galleryImages.sortOrder);
}

export async function createGalleryImage(data: InsertGalleryImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(galleryImages).values(data);
  return result[0].insertId;
}

export async function deleteGalleryImage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(galleryImages).set({ isActive: false }).where(eq(galleryImages.id, id));
}

// ─── Contact Submissions ─────────────────────────────────────────────
export async function createContactSubmission(data: InsertContactSubmission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contactSubmissions).values(data);
  return result[0].insertId;
}

export async function getContactSubmissions(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt)).limit(limit);
}

export async function updateContactStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contactSubmissions).set({ status: status as any }).where(eq(contactSubmissions.id, id));
}
