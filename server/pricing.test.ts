import { describe, expect, it } from "vitest";
import { calculateServicePrice, calculateQuoteTotal, type PricingInput, type ServiceConfig, type GlobalConfig, type PricingResult } from "../shared/pricing";

// ─── Default configs matching seeded database values ────────────────

const houseWashConfig: ServiceConfig = {
  ratePerSqft: 0.14,
  minPrice: 350,
  storyMultipliers: { "1": 1.0, "2": 1.3, "3": 1.6 },
};

const windowConfig: ServiceConfig = {
  exteriorPerWindow: 11,
  interiorPerWindow: 10,
  screenPerWindow: 4,
  minPrice: 250,
};

const roofConfig: ServiceConfig = {
  ratePerSqft: 0.30,
  minPrice: 575,
  pitchMultipliers: { low: 1.0, medium: 1.2, steep: 1.5 },
};

const gutterConfig: ServiceConfig = {
  ratePerLinearFt: 1.50,
  minPrice: 175,
  sizeTiers: { S: 80, M: 150, L: 250, XL: 350, "2XL": 500 },
  storyMultipliers: { "1": 1.0, "2": 1.3 },
};

const drivewayConfig: ServiceConfig = {
  ratePerSqft: 0.20,
  minPrice: 150,
  sizeTiers: { S: 300, M: 600, L: 1000, XL: 1500, "2XL": 2000 },
};

const patioConfig: ServiceConfig = {
  ratePerSqft: 0.55,
  minPrice: 100,
  sizeTiers: { S: 100, M: 200, L: 350, XL: 500, "2XL": 750 },
};

const globalConfig: GlobalConfig = {
  jobMinimum: 225,
  taxRate: 0,
  travelRadius: 40,
  baseAddress: "177 Webb Ave, Cookeville, TN",
  baseLat: 36.1628,
  baseLng: -85.5016,
  bundleDiscounts: { "2": 5, "3": 10, "4": 15, "5": 15 },
  travelFeePerMile: 3,
  freeRadius: 15,
};

// ─── House Washing Tests ────────────────────────────────────────────

describe("House Washing pricing", () => {
  it("calculates basic 1-story house wash", () => {
    const result = calculateServicePrice(
      { serviceType: "house_washing", sqft: 2000, stories: 1 },
      houseWashConfig
    );
    // 2000 * 0.14 = 280, but min is 350
    expect(result.finalPrice).toBe(350);
    expect(result.basePrice).toBe(280);
    expect(result.minApplied).toBe(true);
  });

  it("calculates 2-story house wash with multiplier", () => {
    const result = calculateServicePrice(
      { serviceType: "house_washing", sqft: 2500, stories: 2 },
      houseWashConfig
    );
    // 2500 * 0.14 * 1.3 = 455
    expect(result.finalPrice).toBe(455);
    expect(result.basePrice).toBe(455);
    expect(result.minApplied).toBe(false);
  });

  it("calculates 3-story house wash with multiplier", () => {
    const result = calculateServicePrice(
      { serviceType: "house_washing", sqft: 3000, stories: 3 },
      houseWashConfig
    );
    // 3000 * 0.14 * 1.6 = 672
    expect(result.finalPrice).toBe(672);
    expect(result.basePrice).toBe(672);
    expect(result.minApplied).toBe(false);
  });

  it("applies minimum price for small houses", () => {
    const result = calculateServicePrice(
      { serviceType: "house_washing", sqft: 1000, stories: 1 },
      houseWashConfig
    );
    // 1000 * 0.14 = 140, min 350
    expect(result.finalPrice).toBe(350);
    expect(result.minApplied).toBe(true);
  });

  it("applies Better package tier", () => {
    const result = calculateServicePrice(
      { serviceType: "house_washing", sqft: 3000, stories: 1, packageTier: "better" },
      houseWashConfig
    );
    // 3000 * 0.14 * 1.15 = 483
    expect(result.finalPrice).toBe(483);
  });

  it("applies Best package tier", () => {
    const result = calculateServicePrice(
      { serviceType: "house_washing", sqft: 3000, stories: 1, packageTier: "best" },
      houseWashConfig
    );
    // 3000 * 0.14 * 1.3 = 546
    expect(result.finalPrice).toBe(546);
  });
});

// ─── Window Cleaning Tests ──────────────────────────────────────────

describe("Window Cleaning pricing", () => {
  it("calculates exterior-only window cleaning", () => {
    const result = calculateServicePrice(
      { serviceType: "window_cleaning", windowCount: 20, includeExterior: true },
      windowConfig
    );
    // 20 * 11 = 220, min 250
    expect(result.finalPrice).toBe(250);
    expect(result.minApplied).toBe(true);
  });

  it("calculates exterior + interior", () => {
    const result = calculateServicePrice(
      { serviceType: "window_cleaning", windowCount: 20, includeExterior: true, includeInterior: true },
      windowConfig
    );
    // 20 * 11 + 20 * 10 = 220 + 200 = 420
    expect(result.finalPrice).toBe(420);
    expect(result.minApplied).toBe(false);
  });

  it("calculates full service with screens", () => {
    const result = calculateServicePrice(
      { serviceType: "window_cleaning", windowCount: 15, includeExterior: true, includeInterior: true, includeScreens: true },
      windowConfig
    );
    // 15*11 + 15*10 + 15*4 = 165 + 150 + 60 = 375
    expect(result.finalPrice).toBe(375);
  });
});

// ─── Roof Cleaning Tests ────────────────────────────────────────────

describe("Roof Cleaning pricing", () => {
  it("calculates low-pitch roof", () => {
    const result = calculateServicePrice(
      { serviceType: "roof_cleaning", sqft: 2000, roofPitch: "low" },
      roofConfig
    );
    // 2000 * 0.30 * 1.0 = 600
    expect(result.finalPrice).toBe(600);
    expect(result.minApplied).toBe(false);
  });

  it("calculates steep-pitch roof", () => {
    const result = calculateServicePrice(
      { serviceType: "roof_cleaning", sqft: 2000, roofPitch: "steep" },
      roofConfig
    );
    // 2000 * 0.30 * 1.5 = 900
    expect(result.finalPrice).toBe(900);
  });

  it("applies minimum for small roof", () => {
    const result = calculateServicePrice(
      { serviceType: "roof_cleaning", sqft: 1000, roofPitch: "low" },
      roofConfig
    );
    // 1000 * 0.30 = 300, min 575
    expect(result.finalPrice).toBe(575);
    expect(result.minApplied).toBe(true);
  });
});

// ─── Gutter Cleaning Tests ──────────────────────────────────────────

describe("Gutter Cleaning pricing", () => {
  it("calculates by size tier", () => {
    const result = calculateServicePrice(
      { serviceType: "gutter_cleaning", sizeSelection: "M", stories: 1 },
      gutterConfig
    );
    // 150 linear ft * 1.50 = 225
    expect(result.finalPrice).toBe(225);
  });

  it("applies 2-story multiplier", () => {
    const result = calculateServicePrice(
      { serviceType: "gutter_cleaning", sizeSelection: "M", stories: 2 },
      gutterConfig
    );
    // 150 * 1.50 * 1.3 = 292.50
    expect(result.finalPrice).toBe(292.5);
  });

  it("applies minimum for small gutters", () => {
    const result = calculateServicePrice(
      { serviceType: "gutter_cleaning", sizeSelection: "S", stories: 1 },
      gutterConfig
    );
    // 80 * 1.50 = 120, min 175
    expect(result.finalPrice).toBe(175);
    expect(result.minApplied).toBe(true);
  });
});

// ─── Driveway Cleaning Tests ────────────────────────────────────────

describe("Driveway Cleaning pricing", () => {
  it("calculates by size tier", () => {
    const result = calculateServicePrice(
      { serviceType: "driveway_cleaning", sizeSelection: "M" },
      drivewayConfig
    );
    // 600 * 0.20 = 120, min 150
    expect(result.finalPrice).toBe(150);
    expect(result.minApplied).toBe(true);
  });

  it("calculates large driveway", () => {
    const result = calculateServicePrice(
      { serviceType: "driveway_cleaning", sizeSelection: "XL" },
      drivewayConfig
    );
    // 1500 * 0.20 = 300
    expect(result.finalPrice).toBe(300);
    expect(result.minApplied).toBe(false);
  });
});

// ─── Patio Cleaning Tests ───────────────────────────────────────────

describe("Patio Cleaning pricing", () => {
  it("calculates by size tier", () => {
    const result = calculateServicePrice(
      { serviceType: "patio_cleaning", sizeSelection: "L" },
      patioConfig
    );
    // 350 * 0.55 = 192.50
    expect(result.finalPrice).toBe(192.5);
  });
});

// ─── Quote Total Tests ──────────────────────────────────────────────

describe("Quote Total calculation", () => {
  it("calculates single service total", () => {
    const items: PricingResult[] = [{
      serviceType: "house_washing",
      basePrice: 455,
      finalPrice: 455,
      breakdown: [],
      minApplied: false,
    }];
    const total = calculateQuoteTotal(items, 10, globalConfig);
    expect(total.subtotal).toBe(455);
    expect(total.bundleDiscount).toBe(0);
    expect(total.travelFee).toBe(0);
    expect(total.totalPrice).toBe(455);
  });

  it("applies bundle discount for 2 services (5%)", () => {
    const items: PricingResult[] = [
      { serviceType: "house_washing", basePrice: 400, finalPrice: 400, breakdown: [], minApplied: false },
      { serviceType: "window_cleaning", basePrice: 300, finalPrice: 300, breakdown: [], minApplied: false },
    ];
    const total = calculateQuoteTotal(items, 10, globalConfig);
    // subtotal = 700, 5% discount = 35
    expect(total.subtotal).toBe(700);
    expect(total.bundleDiscount).toBe(35);
    expect(total.bundleDiscountPercent).toBe(5);
    expect(total.totalPrice).toBe(665);
  });

  it("applies bundle discount for 3 services (10%)", () => {
    const items: PricingResult[] = [
      { serviceType: "house_washing", basePrice: 400, finalPrice: 400, breakdown: [], minApplied: false },
      { serviceType: "window_cleaning", basePrice: 300, finalPrice: 300, breakdown: [], minApplied: false },
      { serviceType: "gutter_cleaning", basePrice: 200, finalPrice: 200, breakdown: [], minApplied: false },
    ];
    const total = calculateQuoteTotal(items, 10, globalConfig);
    // subtotal = 900, 10% discount = 90
    expect(total.subtotal).toBe(900);
    expect(total.bundleDiscount).toBe(90);
    expect(total.totalPrice).toBe(810);
  });

  it("applies bundle discount for 4+ services (15%)", () => {
    const items: PricingResult[] = [
      { serviceType: "house_washing", basePrice: 400, finalPrice: 400, breakdown: [], minApplied: false },
      { serviceType: "window_cleaning", basePrice: 300, finalPrice: 300, breakdown: [], minApplied: false },
      { serviceType: "gutter_cleaning", basePrice: 200, finalPrice: 200, breakdown: [], minApplied: false },
      { serviceType: "driveway_cleaning", basePrice: 200, finalPrice: 200, breakdown: [], minApplied: false },
    ];
    const total = calculateQuoteTotal(items, 10, globalConfig);
    // subtotal = 1100, 15% discount = 165
    expect(total.subtotal).toBe(1100);
    expect(total.bundleDiscount).toBe(165);
    expect(total.totalPrice).toBe(935);
  });

  it("calculates travel fee for distance beyond free radius", () => {
    const items: PricingResult[] = [{
      serviceType: "house_washing",
      basePrice: 500,
      finalPrice: 500,
      breakdown: [],
      minApplied: false,
    }];
    const total = calculateQuoteTotal(items, 25, globalConfig);
    // 25 - 15 = 10 extra miles * $3 = $30 travel fee
    expect(total.travelFee).toBe(30);
    expect(total.totalPrice).toBe(530);
  });

  it("no travel fee within free radius", () => {
    const items: PricingResult[] = [{
      serviceType: "house_washing",
      basePrice: 500,
      finalPrice: 500,
      breakdown: [],
      minApplied: false,
    }];
    const total = calculateQuoteTotal(items, 10, globalConfig);
    expect(total.travelFee).toBe(0);
  });

  it("enforces job minimum of $225", () => {
    const items: PricingResult[] = [{
      serviceType: "patio_cleaning",
      basePrice: 100,
      finalPrice: 100,
      breakdown: [],
      minApplied: false,
    }];
    const total = calculateQuoteTotal(items, 5, globalConfig);
    expect(total.jobMinimumApplied).toBe(true);
    expect(total.totalPrice).toBe(225);
  });

  it("does not apply job minimum when total exceeds it", () => {
    const items: PricingResult[] = [{
      serviceType: "house_washing",
      basePrice: 500,
      finalPrice: 500,
      breakdown: [],
      minApplied: false,
    }];
    const total = calculateQuoteTotal(items, 5, globalConfig);
    expect(total.jobMinimumApplied).toBe(false);
    expect(total.totalPrice).toBe(500);
  });
});
