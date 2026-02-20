import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { NOT_ADMIN_ERR_MSG } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "randall@exteriorexperts.co",
    name: "Randall Corley",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createRegularUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "customer@example.com",
    name: "Regular Customer",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createAnonymousContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// Mock the db module
vi.mock("./db", () => ({
  getAllPricingConfigs: vi.fn().mockResolvedValue([
    {
      id: 1,
      serviceType: "global_settings",
      config: { jobMinimum: 225, taxRate: 0, travelRadius: 40, freeRadius: 15, travelFeePerMile: 3, bundleDiscounts: { "2": 5, "3": 10, "4": 15, "5": 20 } },
      updatedBy: null,
      updatedAt: new Date(),
    },
    {
      id: 2,
      serviceType: "house_washing",
      config: { ratePerSqft: 0.14, minPrice: 350, storyMultipliers: { "1": 1, "2": 1.3, "3": 1.6 }, minDuration: 60, targetRevenuePerHour: 300 },
      updatedBy: null,
      updatedAt: new Date(),
    },
    {
      id: 3,
      serviceType: "window_cleaning",
      config: { exteriorPerWindow: 11, interiorPerWindow: 10, screenPerWindow: 4, minPrice: 250, minDuration: 60, targetRevenuePerHour: 300 },
      updatedBy: null,
      updatedAt: new Date(),
    },
  ]),
  getPricingConfig: vi.fn().mockImplementation(async (serviceType: string) => {
    if (serviceType === "house_washing") {
      return {
        id: 2,
        serviceType: "house_washing",
        config: { ratePerSqft: 0.14, minPrice: 350, storyMultipliers: { "1": 1, "2": 1.3, "3": 1.6 } },
        updatedBy: null,
        updatedAt: new Date(),
      };
    }
    return null;
  }),
  updatePricingConfig: vi.fn().mockResolvedValue(undefined),
  // Stub other db functions that might be imported
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  createQuote: vi.fn(),
  createQuoteItems: vi.fn(),
  getQuotes: vi.fn().mockResolvedValue([]),
  getQuoteById: vi.fn(),
  getQuoteItemsByQuoteId: vi.fn(),
  updateQuoteStatus: vi.fn(),
  getQuoteStats: vi.fn().mockResolvedValue({ total: 0, new: 0, contacted: 0, scheduled: 0, completed: 0, cancelled: 0, totalRevenue: 0 }),
  getGalleryImages: vi.fn().mockResolvedValue([]),
  createGalleryImage: vi.fn(),
  deleteGalleryImage: vi.fn(),
  createContactSubmission: vi.fn(),
  getContactSubmissions: vi.fn().mockResolvedValue([]),
  updateContactStatus: vi.fn(),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://example.com/file.png", key: "test-key" }),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

const { getAllPricingConfigs, updatePricingConfig } = await import("./db");

describe("admin.pricing.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all pricing configs for admin users", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.pricing.list();

    expect(getAllPricingConfigs).toHaveBeenCalledOnce();
    expect(result).toHaveLength(3);
    expect(result[0].serviceType).toBe("global_settings");
    expect(result[1].serviceType).toBe("house_washing");
    expect(result[2].serviceType).toBe("window_cleaning");
  });

  it("returns config objects with expected structure", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.pricing.list();

    const globalConfig = result.find((c: any) => c.serviceType === "global_settings");
    expect(globalConfig).toBeDefined();
    const config = globalConfig!.config as Record<string, unknown>;
    expect(config).toHaveProperty("jobMinimum", 225);
    expect(config).toHaveProperty("travelRadius", 40);
    expect(config).toHaveProperty("bundleDiscounts");
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createRegularUserContext());
    await expect(caller.admin.pricing.list()).rejects.toThrow(NOT_ADMIN_ERR_MSG);
  });

  it("rejects anonymous users", async () => {
    const caller = appRouter.createCaller(createAnonymousContext());
    await expect(caller.admin.pricing.list()).rejects.toThrow(NOT_ADMIN_ERR_MSG);
  });
});

describe("admin.pricing.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates pricing config for admin users", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const newConfig = { ratePerSqft: 0.18, minPrice: 400, storyMultipliers: { "1": 1, "2": 1.4, "3": 1.8 } };

    const result = await caller.admin.pricing.update({
      serviceType: "house_washing",
      config: newConfig,
    });

    expect(result).toEqual({ success: true });
    expect(updatePricingConfig).toHaveBeenCalledWith("house_washing", newConfig, 1);
  });

  it("allows updating global settings", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const newConfig = { jobMinimum: 250, taxRate: 0, travelRadius: 50, freeRadius: 20, travelFeePerMile: 4, bundleDiscounts: { "2": 5, "3": 10, "4": 15, "5": 20 } };

    const result = await caller.admin.pricing.update({
      serviceType: "global_settings",
      config: newConfig,
    });

    expect(result).toEqual({ success: true });
    expect(updatePricingConfig).toHaveBeenCalledWith("global_settings", newConfig, 1);
  });

  it("passes the admin user id to updatePricingConfig", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await caller.admin.pricing.update({
      serviceType: "window_cleaning",
      config: { exteriorPerWindow: 12 },
    });

    expect(updatePricingConfig).toHaveBeenCalledWith(
      "window_cleaning",
      { exteriorPerWindow: 12 },
      1, // admin user id
    );
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createRegularUserContext());
    await expect(
      caller.admin.pricing.update({ serviceType: "house_washing", config: { ratePerSqft: 0.2 } })
    ).rejects.toThrow(NOT_ADMIN_ERR_MSG);
    expect(updatePricingConfig).not.toHaveBeenCalled();
  });

  it("rejects anonymous users", async () => {
    const caller = appRouter.createCaller(createAnonymousContext());
    await expect(
      caller.admin.pricing.update({ serviceType: "house_washing", config: { ratePerSqft: 0.2 } })
    ).rejects.toThrow(NOT_ADMIN_ERR_MSG);
    expect(updatePricingConfig).not.toHaveBeenCalled();
  });
});

describe("quote.getPricing (public)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns pricing as a service-type keyed map for anonymous users", async () => {
    const caller = appRouter.createCaller(createAnonymousContext());
    const result = await caller.quote.getPricing();

    expect(getAllPricingConfigs).toHaveBeenCalledOnce();
    expect(result).toHaveProperty("global_settings");
    expect(result).toHaveProperty("house_washing");
    expect(result).toHaveProperty("window_cleaning");
    expect(result.global_settings).toHaveProperty("jobMinimum", 225);
    expect(result.house_washing).toHaveProperty("ratePerSqft", 0.14);
  });

  it("returns pricing for authenticated non-admin users too", async () => {
    const caller = appRouter.createCaller(createRegularUserContext());
    const result = await caller.quote.getPricing();

    expect(result).toHaveProperty("house_washing");
    expect(result.house_washing).toHaveProperty("ratePerSqft", 0.14);
  });
});
