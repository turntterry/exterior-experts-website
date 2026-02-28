/**
 * Stripe Product Configuration
 * Define subscription tiers and pricing here
 */

export const STRIPE_PRODUCTS = {
  STARTER: {
    name: "Starter",
    description: "Perfect for getting started",
    monthlyPrice: 4900, // $49.00 in cents
    features: [
      "Up to 50 quotes/month",
      "Basic customer management",
      "Email notifications",
    ],
  },
  PROFESSIONAL: {
    name: "Professional",
    description: "For growing businesses",
    monthlyPrice: 9900, // $99.00 in cents
    features: [
      "Unlimited quotes",
      "Advanced customer CRM",
      "Email + SMS notifications",
      "Custom branding",
      "Priority support",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    description: "For large teams",
    monthlyPrice: 19900, // $199.00 in cents
    features: [
      "Everything in Professional",
      "Multi-user access",
      "Advanced analytics",
      "API access",
      "Dedicated support",
      "Custom integrations",
    ],
  },
};

/**
 * Get product by key
 */
export function getProduct(key: keyof typeof STRIPE_PRODUCTS) {
  return STRIPE_PRODUCTS[key];
}

/**
 * Get all products
 */
export function getAllProducts() {
  return Object.entries(STRIPE_PRODUCTS).map(([key, product]) => ({
    key,
    ...product,
  }));
}
