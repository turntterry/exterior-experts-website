import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { BUSINESS, SERVICES, LOCATIONS, SEED_GALLERY } from "@shared/data";
import { ServiceSchema } from "@/components/SchemaMarkup";
import { Phone, ArrowRight, CheckCircle, Star, Shield, Clock } from "lucide-react";

interface ServicePageProps {
  serviceId: string;
  locationId?: string;
}

const SERVICE_CONTENT: Record<string, { benefits: string[]; process: string[]; faq: { q: string; a: string }[] }> = {
  house_washing: {
    benefits: [
      "Removes mold, mildew, algae & dirt buildup",
      "Safe soft wash technique protects siding & paint",
      "Increases curb appeal and property value",
      "Prevents long-term damage from organic growth",
      "Eco-friendly, biodegradable cleaning solutions",
    ],
    process: [
      "Inspect your home's exterior and identify problem areas",
      "Apply our proprietary soft wash solution to break down contaminants",
      "Allow the solution to dwell and kill mold, mildew & algae at the root",
      "Gently rinse with low pressure for a spotless, damage-free finish",
      "Final walkthrough to ensure your complete satisfaction",
    ],
    faq: [
      { q: "Is soft washing safe for my siding?", a: "Absolutely. Soft washing uses low pressure (similar to a garden hose) combined with specialized cleaning solutions. It's safe for vinyl, wood, stucco, brick, and painted surfaces." },
      { q: "How often should I have my house washed?", a: "We recommend annual house washing to prevent buildup of mold, mildew, and algae. Homes in shaded areas may benefit from washing every 6-8 months." },
      { q: "How long does house washing take?", a: "Most homes take 1-3 hours depending on size and condition. A typical 2,000 sq ft home takes about 1.5-2 hours." },
    ],
  },
  pressure_washing: {
    benefits: [
      "Restores concrete, brick & stone surfaces",
      "Removes oil stains, tire marks & embedded dirt",
      "Professional-grade equipment for superior results",
      "Prevents slip hazards from algae & moss",
      "Extends the life of your outdoor surfaces",
    ],
    process: [
      "Assess surfaces and determine optimal pressure settings",
      "Pre-treat stubborn stains with specialized cleaners",
      "Systematically pressure wash using overlapping passes",
      "Post-treat surfaces to prevent rapid regrowth",
      "Clean up and final inspection with you",
    ],
    faq: [
      { q: "What surfaces can be pressure washed?", a: "Concrete driveways, sidewalks, patios, brick, stone, and pavers are all ideal for pressure washing. We adjust pressure levels for each surface type." },
      { q: "Will pressure washing damage my concrete?", a: "When done professionally, no. We use the correct pressure settings and nozzles for each surface to clean effectively without causing damage." },
      { q: "How often should I pressure wash my driveway?", a: "We recommend annual pressure washing for driveways. High-traffic areas or shaded surfaces may benefit from more frequent cleaning." },
    ],
  },
  window_cleaning: {
    benefits: [
      "Crystal-clear, streak-free results",
      "Interior & exterior cleaning available",
      "Screen cleaning & track detailing included",
      "Improves natural light & home appearance",
      "Extends window life by removing corrosive buildup",
    ],
    process: [
      "Count and inspect all windows for damage or concerns",
      "Remove and clean screens (if included)",
      "Clean window tracks and frames",
      "Wash glass using professional squeegee technique",
      "Detail edges and check for any missed spots",
    ],
    faq: [
      { q: "Do you clean both interior and exterior windows?", a: "Yes! We offer interior-only, exterior-only, or complete interior + exterior packages. Our instant quote tool lets you choose exactly what you need." },
      { q: "Do you clean screens?", a: "Yes, screen cleaning is available as an add-on. We remove, wash, and reinstall your screens as part of the service." },
      { q: "How often should windows be cleaned?", a: "For best results, we recommend professional window cleaning 2-4 times per year, depending on your environment and preferences." },
    ],
  },
  gutter_cleaning: {
    benefits: [
      "Prevents water damage to your foundation",
      "Removes leaves, debris & blockages",
      "Checks for gutter damage during cleaning",
      "Prevents pest nesting in clogged gutters",
      "Protects landscaping from overflow damage",
    ],
    process: [
      "Set up ladders and safety equipment",
      "Remove all debris from gutters by hand",
      "Flush downspouts to ensure proper drainage",
      "Check for damage, loose brackets, or leaks",
      "Clean up all debris from the ground",
    ],
    faq: [
      { q: "How often should gutters be cleaned?", a: "At minimum twice per year — once in spring and once in fall. Homes near trees may need quarterly cleaning." },
      { q: "Do you check for gutter damage?", a: "Yes, we inspect your gutters during cleaning and will let you know if we find any issues that need attention." },
      { q: "Can you clean gutters on multi-story homes?", a: "Absolutely. We have the equipment and training to safely clean gutters on 2 and 3-story homes." },
    ],
  },
  driveway_cleaning: {
    benefits: [
      "Removes oil stains, tire marks & embedded grime",
      "Restores original concrete color and appearance",
      "Eliminates slippery algae and moss growth",
      "Increases curb appeal and property value",
      "Professional surface cleaning for lasting results",
    ],
    process: [
      "Pre-treat oil stains and heavy soiling",
      "Apply degreaser to break down embedded contaminants",
      "Pressure wash with surface cleaner for even results",
      "Detail edges and hard-to-reach areas",
      "Post-treat to inhibit future growth",
    ],
    faq: [
      { q: "Can you remove oil stains from concrete?", a: "Yes, we use specialized degreasers that break down oil stains. While some deep stains may lighten rather than fully disappear, most stains are significantly improved." },
      { q: "How long does driveway cleaning take?", a: "A standard 2-car driveway takes about 30-60 minutes. Larger driveways or heavily stained surfaces may take longer." },
      { q: "Will the results last?", a: "Typically 12-18 months depending on traffic, shade, and weather conditions. We can apply post-treatment to extend results." },
    ],
  },
  roof_cleaning: {
    benefits: [
      "Removes black streaks caused by Gloeocapsa Magma algae",
      "Safe soft wash technique — no high pressure on shingles",
      "Extends roof life by years",
      "Restores your roof's original appearance",
      "May help reduce energy costs",
    ],
    process: [
      "Ground-level inspection of roof condition",
      "Protect landscaping and surrounding areas",
      "Apply soft wash solution to kill algae, moss & lichen",
      "Allow solution to dwell for maximum effectiveness",
      "Gentle rinse — results continue improving over weeks",
    ],
    faq: [
      { q: "Is roof cleaning safe for shingles?", a: "Yes! We use the soft wash method recommended by shingle manufacturers. No high pressure ever touches your roof." },
      { q: "How long do results last?", a: "Typically 3-5 years depending on your environment. Shaded roofs may need cleaning sooner." },
      { q: "Will my roof look perfect immediately?", a: "Your roof will look dramatically better right away. Some organic staining continues to fade over the following 2-4 weeks as the treatment works." },
    ],
  },
  deck_cleaning: {
    benefits: [
      "Removes mold, mildew & weathered gray appearance",
      "Restores natural wood grain and color",
      "Prepares surface for staining or sealing",
      "Safe for all deck materials (wood, composite, Trex)",
      "Extends the life of your deck",
    ],
    process: [
      "Inspect deck condition and material type",
      "Apply appropriate cleaning solution for your deck material",
      "Allow solution to penetrate and break down contaminants",
      "Carefully wash using proper pressure for your deck type",
      "Rinse and inspect for complete cleaning",
    ],
    faq: [
      { q: "Can you clean composite/Trex decks?", a: "Yes! We adjust our cleaning method and pressure for composite materials to clean effectively without damage." },
      { q: "Should I stain my deck after cleaning?", a: "If your deck is natural wood, cleaning is the perfect preparation for staining or sealing. We recommend staining within 1-2 weeks of cleaning." },
      { q: "How long does deck cleaning take?", a: "Most decks take 1-2 hours depending on size and condition." },
    ],
  },
};

export default function ServicePage({ serviceId, locationId }: ServicePageProps) {
  const service = SERVICES.find(s => s.id === serviceId);
  const location = locationId ? LOCATIONS.find(l => l.id === locationId) : LOCATIONS[0];
  if (!service || !location) return null;

  const content = SERVICE_CONTENT[serviceId] || SERVICE_CONTENT.pressure_washing;
  const relatedImages = SEED_GALLERY.filter(g => g.service === serviceId).slice(0, 3);
  const locationName = `${location.name}, ${location.state}`;
  const pageTitle = `${service.name} in ${locationName}`;

  return (
    <SiteLayout>
      <ServiceSchema service={service} location={location} faq={content.faq} />
      {/* Hero */}
      <section className="bg-navy py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-navy-dark to-navy opacity-90" />
        <div className="container relative">
          <div className="max-w-3xl">
            <p className="text-sky font-semibold mb-2">{BUSINESS.name}</p>
            <h1 className="font-heading font-black text-3xl md:text-5xl text-white mb-4">
              {pageTitle}
            </h1>
            <p className="text-lg text-white/80 mb-6">{service.description}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/instant-quote">
                <Button size="lg" className="bg-sky hover:bg-sky-light text-white font-bold">
                  Get Instant Quote <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href={`tel:${BUSINESS.phoneRaw}`}>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold">
                  <Phone className="w-4 h-4 mr-2" /> {BUSINESS.phone}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="font-heading font-bold text-2xl md:text-3xl mb-6">
                Why Choose Our {service.name} Service?
              </h2>
              <div className="space-y-4">
                {content.benefits.map((b, i) => (
                  <div key={i} className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-foreground">{b}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/instant-quote">
                  <Button className="bg-primary hover:bg-navy-light text-white font-semibold">
                    Get Your Free Quote <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            {relatedImages.length > 0 && (
              <div className="grid gap-4">
                {relatedImages.map((img, i) => (
                  <img key={i} src={img.url} alt={img.title} className="rounded-xl w-full object-cover aspect-video" loading="lazy" />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 bg-secondary">
        <div className="container">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-center mb-12">
            Our {service.name} Process
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {content.process.map((step, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </div>
                <div className="pt-2">
                  <p className="text-foreground">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="container max-w-3xl">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {content.faq.map((item, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <h3 className="font-heading font-bold text-lg mb-2">{item.q}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy text-center">
        <div className="container">
          <h2 className="font-heading font-bold text-3xl text-white mb-4">
            Ready for {service.name} in {locationName}?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Get an instant quote in under 2 minutes. No obligation, no hidden fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/instant-quote">
              <Button size="lg" className="bg-sky hover:bg-sky-light text-white font-bold">
                Get Instant Quote <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href={`tel:${BUSINESS.phoneRaw}`}>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold">
                <Phone className="w-4 h-4 mr-2" /> {BUSINESS.phone}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="py-12 bg-secondary">
        <div className="container">
          <h3 className="font-heading font-bold text-xl mb-6 text-center">Other Services We Offer</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {SERVICES.filter(s => s.id !== serviceId).map(s => (
              <Link key={s.id} href={`/${s.slug}-cookeville-tn`}>
                <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary hover:text-white">
                  {s.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
