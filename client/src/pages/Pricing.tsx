import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useCanonical } from "@/hooks/useCanonical";

const PRICING_TIERS = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    description: "Perfect for getting started",
    features: [
      "Up to 50 quotes/month",
      "Basic customer management",
      "Email notifications",
      "Mobile responsive",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 99,
    description: "Most popular for growing businesses",
    features: [
      "Unlimited quotes",
      "Advanced customer CRM",
      "Priority email support",
      "Custom branding",
      "Analytics dashboard",
      "API access",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    description: "For large-scale operations",
    features: [
      "Everything in Professional",
      "Dedicated account manager",
      "Custom integrations",
      "Advanced reporting",
      "Team management (up to 10 users)",
      "24/7 phone support",
    ],
  },
];

export default function Pricing() {
  useCanonical("/pricing");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const createSubscription = trpc.stripe.subscription.createCheckout.useMutation();

  const handleSubscribe = async (tierId: string) => {
    setSelectedTier(tierId);
    try {
      const result = await createSubscription.mutateAsync({
        priceId: `price_${tierId}`,
        origin: window.location.origin,
      });
      if (result.checkoutUrl) {
        window.open(result.checkoutUrl, "_blank");
      }
    } catch (error) {
      console.error("Subscription error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Choose the perfect plan for your exterior cleaning business. All plans include a 14-day free trial.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PRICING_TIERS.map((tier) => (
            <Card
              key={tier.id}
              className={`relative flex flex-col ${
                tier.popular ? "border-2 border-blue-500 shadow-lg scale-105" : ""
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {tier.name}
                </h3>
                <p className="text-slate-600 text-sm mb-6">{tier.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <span className="text-5xl font-bold text-slate-900">
                    ${tier.price}
                  </span>
                  <span className="text-slate-600">/month</span>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={selectedTier === tier.id && createSubscription.isPending}
                  className={`w-full mb-8 ${
                    tier.popular
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-900"
                  }`}
                >
                  {selectedTier === tier.id && createSubscription.isPending
                    ? "Processing..."
                    : "Get Started"}
                </Button>

                {/* Features */}
                <div className="space-y-4">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-slate-50 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-slate-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Is there a setup fee?
              </h3>
              <p className="text-slate-600">
                No setup fees. You only pay the monthly subscription price. Your first 14 days are completely free.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-slate-600">
                We accept all major credit cards (Visa, Mastercard, American Express) and bank transfers for Enterprise plans.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-slate-600">
                Absolutely. Cancel anytime with no penalties. Your access continues through the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
