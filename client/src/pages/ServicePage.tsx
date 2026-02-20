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

const SERVICE_CONTENT: Record<string, {
  intro: string;
  benefits: string[];
  process: { title: string; desc: string }[];
  faq: { q: string; a: string }[];
  whyItMatters: string;
}> = {
  house_washing: {
    intro: "Tennessee's humidity is brutal on siding. Between the rain, shade, and warm temperatures, mold, mildew, and algae can take hold fast — especially on north-facing walls and under eaves. That green and black buildup isn't just ugly. Left alone, it eats into paint, degrades vinyl, and can even work its way behind siding where it causes moisture damage you won't see until it's expensive to fix. Our soft wash process kills that growth at the root and rinses it away without putting any stress on your siding. We use low pressure — about what comes out of a garden hose — combined with professional-grade cleaning solutions that do the heavy lifting. It's safe for vinyl, wood, brick, stucco, and painted surfaces.",
    benefits: [
      "Kills mold, mildew, and algae at the root — not just the surface",
      "Low-pressure soft wash that won't damage siding, paint, or trim",
      "Biodegradable cleaning solutions safe for your landscaping and pets",
      "Restores your home's original color and curb appeal",
      "Helps prevent long-term moisture damage behind siding",
    ],
    process: [
      { title: "Walk the property", desc: "We check every wall for problem areas, note your siding type, and cover anything that needs protection — plants, outdoor furniture, light fixtures." },
      { title: "Apply the soft wash solution", desc: "Our cleaning mix goes on at low pressure. It soaks into the mold and algae and starts breaking it down within minutes." },
      { title: "Let it dwell", desc: "The solution needs time to work. We let it sit long enough to kill the growth all the way to the root, not just bleach the surface." },
      { title: "Rinse clean", desc: "We rinse everything off with low pressure, working top to bottom. No high-pressure blasting, no risk to your siding." },
      { title: "Final walkthrough", desc: "We walk the property with you and make sure every wall looks right before we pack up." },
    ],
    faq: [
      { q: "Is soft washing safe for my siding?", a: "Yes. Soft washing uses pressure similar to a garden hose. The cleaning solution does the work, not the water pressure. It's safe for vinyl, wood, stucco, brick, and painted surfaces. Shingle manufacturers actually recommend this method for roof cleaning too." },
      { q: "How often should I have my house washed?", a: "Once a year is a good baseline for most homes in the Cookeville area. If your house sits in heavy shade or backs up to woods, you might benefit from going every 8-10 months. We'll let you know what makes sense for your situation." },
      { q: "How long does it take?", a: "A typical 2,000 square foot home takes about 1.5 to 2 hours. Larger homes or heavily stained surfaces can take up to 3 hours. We'll give you a time estimate when you book." },
      { q: "Will it kill my plants?", a: "We take precautions to protect your landscaping — wetting plants down before and after, and using biodegradable solutions. In thousands of jobs, we've never damaged a customer's plants." },
    ],
    whyItMatters: "A clean house isn't just about looks. Mold and algae hold moisture against your siding, which accelerates wear and can lead to rot on wood surfaces. Regular washing extends the life of your paint and siding, protects your investment, and keeps your home looking the way it should. Most homeowners are surprised at the difference — it's one of the highest-impact things you can do for your property's appearance.",
  },
  pressure_washing: {
    intro: "Concrete, brick, and stone are tough materials, but they're also porous. Over time, dirt, oil, tire marks, algae, and moss work their way into the surface and no amount of garden hose spraying will get them out. That's where professional pressure washing comes in. We use commercial-grade surface cleaners that spin at high RPM to deliver even, consistent results without the streaky lines you get from a regular pressure washer wand. The difference between a DIY job and what we do is night and day.",
    benefits: [
      "Removes embedded oil stains, tire marks, and ground-in dirt",
      "Eliminates slippery algae and moss that create fall hazards",
      "Even, streak-free results from commercial surface cleaning equipment",
      "Restores the original look of concrete, brick, and stone",
      "Post-treatment available to slow regrowth",
    ],
    process: [
      { title: "Assess the surface", desc: "We check your concrete for oil stains, heavy soiling, and any cracks or damage that need attention before we start." },
      { title: "Pre-treat problem areas", desc: "Oil stains and heavy buildup get a degreaser application before we wash. This breaks down the tough stuff so the pressure washer can do its job." },
      { title: "Surface clean", desc: "We use a commercial surface cleaner — a spinning disc that delivers even pressure across a wide area. No tiger stripes, no uneven patches." },
      { title: "Detail the edges", desc: "Edges along the garage, sidewalk cracks, and expansion joints get hand-wanded for a clean finish everywhere." },
      { title: "Post-treat if needed", desc: "For surfaces prone to algae regrowth, we can apply a post-treatment that slows down the return of green growth." },
    ],
    faq: [
      { q: "What surfaces can you pressure wash?", a: "Concrete driveways, sidewalks, patios, pool decks, brick, stone, and pavers. We adjust our pressure and technique for each surface type. We don't pressure wash siding or roofs — those get the soft wash treatment." },
      { q: "Will pressure washing damage my concrete?", a: "Not when it's done right. We use the correct PSI, proper nozzle tips, and surface cleaning equipment designed for even results. The damage you see from pressure washing usually comes from people using the wrong settings or holding the wand too close." },
      { q: "Can you get oil stains out?", a: "Most oil stains improve significantly with degreaser and hot water treatment. Deep, old stains may lighten rather than disappear completely, but the improvement is usually dramatic. We'll be honest about what to expect." },
    ],
    whyItMatters: "Your driveway is the first thing people see when they pull up to your house. A clean driveway and walkway make the whole property look maintained. Beyond appearance, algae and moss on concrete create genuine slip-and-fall hazards, especially when wet. Regular pressure washing keeps your outdoor surfaces safe, clean, and looking like they should.",
  },
  window_cleaning: {
    intro: "There's a reason professional window cleaning exists — it's one of those jobs that's harder than it looks. Squeegee technique, the right soap mix, getting screens and tracks clean, reaching second and third story windows safely — it all adds up. We handle interior and exterior windows, screen cleaning, and track detailing. The result is glass so clear you'll forget it's there.",
    benefits: [
      "Streak-free, crystal-clear glass inside and out",
      "Screen removal, cleaning, and reinstallation",
      "Window track and frame detailing",
      "Safe cleaning of second and third story windows",
      "Extends window life by removing corrosive mineral deposits",
    ],
    process: [
      { title: "Count and inspect", desc: "We count every window, check for damage or broken seals, and note any screens that need cleaning." },
      { title: "Remove screens", desc: "If you've added screen cleaning, we pull them out, wash them, and set them aside to dry while we work on the glass." },
      { title: "Clean tracks and frames", desc: "Dirt builds up in window tracks and along frames. We clean these out so your windows look good from every angle." },
      { title: "Wash the glass", desc: "Professional squeegee technique on every pane — no paper towels, no Windex, no streaks." },
      { title: "Reinstall and inspect", desc: "Screens go back in, we check every window for missed spots, and we're done." },
    ],
    faq: [
      { q: "Do you clean both interior and exterior?", a: "Yes. You can choose exterior only, interior only, or both. Our instant quote tool lets you pick exactly what you need and see the price for each option." },
      { q: "Do you clean screens?", a: "Screen cleaning is available as an add-on. We remove them, wash them, and put them back. It's worth doing — dirty screens make clean windows look dirty from inside." },
      { q: "How often should I get my windows cleaned?", a: "Two to four times a year is ideal depending on your preferences and how much pollen, dust, and rain your windows catch. A lot of our customers do it twice a year — spring and fall." },
    ],
    whyItMatters: "Clean windows change the way your home feels. More natural light gets in, rooms look bigger, and the whole place just feels brighter. From the outside, clean windows are one of those details that separate a well-maintained home from one that's been neglected. It's a small thing that makes a big difference.",
  },
  gutter_cleaning: {
    intro: "Clogged gutters cause more damage than most homeowners realize. When water can't flow through your gutters and downspouts, it backs up under your shingles, overflows down your fascia, pools around your foundation, and erodes your landscaping. In winter, clogged gutters lead to ice dams that can cause serious roof damage. We clean out all the debris by hand, flush your downspouts to make sure they're draining, and check for any damage while we're up there.",
    benefits: [
      "Prevents water damage to your roof, fascia, and foundation",
      "Removes leaves, sticks, shingle grit, and packed debris",
      "Downspout flushing to confirm proper drainage",
      "Visual inspection for damage, loose brackets, and leaks",
      "Prevents pest nesting — clogged gutters attract birds, wasps, and mosquitoes",
    ],
    process: [
      { title: "Set up safely", desc: "We position ladders and check stability before anyone goes up. Safety isn't optional." },
      { title: "Hand-clean all gutters", desc: "We remove debris by hand — leaves, sticks, shingle grit, packed dirt, whatever's in there. It all comes out." },
      { title: "Flush downspouts", desc: "We run water through every downspout to make sure it's flowing freely. If there's a clog, we clear it." },
      { title: "Inspect for damage", desc: "While we're up there, we check for loose brackets, sagging sections, leaks, and any damage that needs attention." },
      { title: "Ground cleanup", desc: "All the debris we pulled out of your gutters gets cleaned up from the ground. We leave your property cleaner than we found it." },
    ],
    faq: [
      { q: "How often should gutters be cleaned?", a: "Twice a year minimum — once in late spring after the pollen and seeds are done, and once in late fall after the leaves drop. If you have a lot of trees hanging over your roof, quarterly is better." },
      { q: "Do you check for damage?", a: "Yes. We inspect your gutters during every cleaning and let you know if we find anything that needs repair — loose brackets, sagging sections, leaks, or rust." },
      { q: "Can you clean gutters on tall homes?", a: "Yes. We have the ladders and equipment to safely clean gutters on two and three-story homes." },
    ],
    whyItMatters: "Gutters exist for one reason: to move water away from your home. When they're clogged, water goes where it shouldn't — into your soffit, down your walls, and around your foundation. Foundation repair costs thousands. Gutter cleaning costs a fraction of that. It's basic home maintenance that prevents expensive problems.",
  },
  driveway_cleaning: {
    intro: "Your driveway takes a beating. Between vehicle traffic, oil drips, tire marks, and Tennessee's humidity feeding algae growth, concrete driveways go from clean to dingy faster than you'd expect. Most homeowners don't realize how dark their driveway has gotten until they see it after a professional cleaning — the difference is dramatic. We use commercial surface cleaning equipment that delivers even, consistent results across the entire surface.",
    benefits: [
      "Removes oil stains, tire marks, and years of embedded dirt",
      "Eliminates algae and moss that make concrete slippery when wet",
      "Commercial surface cleaner for even, streak-free results",
      "Restores the original light color of your concrete",
      "Makes your entire property look better from the street",
    ],
    process: [
      { title: "Pre-treat stains", desc: "Oil spots and heavy stains get a degreaser application first. This breaks down the oil so the pressure washer can lift it out of the pores." },
      { title: "Surface clean the driveway", desc: "Our commercial surface cleaner covers a wide area with consistent pressure — no tiger stripes or uneven patches." },
      { title: "Detail edges and cracks", desc: "We hand-wand along the garage door, sidewalk edges, and expansion joints for a clean finish everywhere." },
      { title: "Rinse and inspect", desc: "Everything gets rinsed clean and we check for any spots that need a second pass." },
    ],
    faq: [
      { q: "Can you remove oil stains from my driveway?", a: "Most oil stains improve significantly with degreaser and pressure washing. Fresh stains usually come out completely. Older, deep stains may lighten rather than disappear entirely, but the improvement is always noticeable." },
      { q: "How long does it take?", a: "A standard two-car driveway takes 30 to 60 minutes. Larger driveways or heavily stained surfaces take longer. We'll give you a time estimate with your quote." },
      { q: "How often should I have my driveway cleaned?", a: "Once a year keeps most driveways looking good. If your driveway is shaded and prone to algae, twice a year might be worth it." },
    ],
    whyItMatters: "Your driveway is the first surface visitors see and walk on. A clean driveway sets the tone for your entire property. It's also a safety issue — algae-covered concrete gets dangerously slippery when it rains. Annual cleaning keeps it looking good and keeps your family and guests safe.",
  },
  roof_cleaning: {
    intro: "Those black streaks on your roof aren't dirt — they're a type of algae called Gloeocapsa Magma. It feeds on the limestone filler in your shingles, and once it takes hold, it spreads. Beyond looking terrible, it actually shortens your roof's lifespan by degrading the shingle material. We clean roofs using the soft wash method — the same approach recommended by shingle manufacturers like GAF and CertainTeed. No high pressure ever touches your shingles.",
    benefits: [
      "Removes black streaks caused by Gloeocapsa Magma algae",
      "Soft wash method — manufacturer-recommended, no high pressure",
      "Kills moss, lichen, and algae at the root",
      "Can extend your roof's lifespan by years",
      "Restores your roof's appearance without risking shingle damage",
    ],
    process: [
      { title: "Ground-level inspection", desc: "We assess your roof's condition from the ground, checking for damage, heavy growth areas, and the pitch we'll be working with." },
      { title: "Protect your landscaping", desc: "Plants, flower beds, and outdoor items near the house get covered or wetted down before we start." },
      { title: "Apply soft wash solution", desc: "Our cleaning solution goes on at low pressure. It soaks into the algae, moss, and lichen and starts killing it at the root." },
      { title: "Let it dwell", desc: "The solution needs time to work. We let it sit for the right amount of time based on how heavy the growth is." },
      { title: "Gentle rinse", desc: "We rinse with low pressure. Your roof will look dramatically better immediately, and the results continue improving over the next 2-4 weeks as dead growth washes away with rain." },
    ],
    faq: [
      { q: "Is roof cleaning safe for shingles?", a: "Yes. We use the soft wash method, which is the only cleaning method recommended by shingle manufacturers. No high pressure ever touches your roof. High-pressure washing voids most shingle warranties — we don't do that." },
      { q: "How long do the results last?", a: "Typically 3 to 5 years depending on your environment. Roofs with heavy tree coverage may see regrowth sooner. We'll give you an honest estimate for your specific roof." },
      { q: "Will my roof look perfect right away?", a: "It will look dramatically better immediately. Some residual staining continues to fade over the following 2 to 4 weeks as rain washes away the dead algae. The full result takes a little time, but it's worth the wait." },
    ],
    whyItMatters: "A new roof costs $8,000 to $15,000 or more. Roof cleaning costs a fraction of that and can add years to your roof's life by removing the organisms that are actively degrading your shingles. It also makes a massive difference in curb appeal — black streaky roofs make even nice homes look neglected.",
  },
  deck_cleaning: {
    intro: "Wood and composite decks take a beating from Tennessee weather. UV exposure, rain, humidity, and foot traffic combine to leave decks looking gray, weathered, and covered in mold or mildew. A dirty deck isn't just an eyesore — it's slippery when wet and the moisture trapped by mold growth accelerates wood rot. We clean decks using the right method for your material, whether that's natural wood, pressure-treated lumber, or composite like Trex.",
    benefits: [
      "Removes mold, mildew, and the gray weathered look",
      "Restores natural wood grain and color",
      "Safe for all deck materials — wood, composite, and Trex",
      "Prepares the surface for staining or sealing",
      "Eliminates slippery mold that creates a fall hazard",
    ],
    process: [
      { title: "Inspect your deck", desc: "We check the material type, condition, and any areas of concern — loose boards, popped nails, soft spots." },
      { title: "Apply cleaning solution", desc: "We use a cleaning solution matched to your deck material. Wood gets a different treatment than composite." },
      { title: "Let it penetrate", desc: "The solution needs time to break down the mold, mildew, and grime that's worked into the surface." },
      { title: "Wash at the right pressure", desc: "We adjust our pressure based on your deck material. Wood gets a lighter touch than concrete. Composite gets even less pressure." },
      { title: "Rinse and inspect", desc: "Everything gets rinsed clean. We check the results and hit any spots that need a second pass." },
    ],
    faq: [
      { q: "Can you clean composite and Trex decks?", a: "Yes. We adjust our cleaning method and pressure settings specifically for composite materials. They require a different approach than natural wood, and we know the difference." },
      { q: "Should I stain my deck after cleaning?", a: "If your deck is natural wood, cleaning is the ideal preparation for staining or sealing. We recommend applying stain within 1-2 weeks of cleaning while the wood is clean and the pores are open." },
      { q: "How long does deck cleaning take?", a: "Most standard-sized decks take 1 to 2 hours. Large multi-level decks or heavily stained surfaces may take longer." },
    ],
    whyItMatters: "Your deck is where you spend time with family, grill out, and relax. A clean deck is more inviting, safer to walk on, and lasts longer. If you're planning to stain or seal, cleaning first is essential — stain won't adhere properly to a dirty surface. It's a straightforward job that makes a real difference in how you use and enjoy your outdoor space.",
  },
};

export default function ServicePage({ serviceId, locationId }: ServicePageProps) {
  const service = SERVICES.find(s => s.id === serviceId);
  const location = locationId ? LOCATIONS.find(l => l.id === locationId) : LOCATIONS[0];
  if (!service || !location) return null;

  const content = SERVICE_CONTENT[serviceId] || SERVICE_CONTENT.pressure_washing;
  const relatedImages = SEED_GALLERY.filter(g => g.service === serviceId).slice(0, 4);
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
            <p className="text-lg text-white/80 mb-6 leading-relaxed">{service.description}</p>
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

      {/* Intro + Images */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="font-heading font-bold text-2xl md:text-3xl mb-6">
                {service.name} in the Upper Cumberland
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">{content.intro}</p>
              <div className="space-y-3">
                {content.benefits.map((b, i) => (
                  <div key={i} className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-foreground text-sm">{b}</p>
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
              <div className="grid grid-cols-2 gap-4">
                {relatedImages.map((img, i) => (
                  <div key={i} className="rounded-xl overflow-hidden aspect-[4/3]">
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 bg-secondary">
        <div className="container">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-center mb-4">
            How We Handle {service.name}
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Every job follows the same process. No shortcuts, no skipped steps.
          </p>
          <div className="max-w-3xl mx-auto space-y-8">
            {content.process.map((step, i) => (
              <div key={i} className="flex gap-5 items-start">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg mb-1">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="py-16 bg-white">
        <div className="container max-w-3xl">
          <h2 className="font-heading font-bold text-2xl md:text-3xl mb-6 text-center">
            Why {service.name} Matters for Your Home
          </h2>
          <p className="text-muted-foreground leading-relaxed text-lg text-center">{content.whyItMatters}</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-secondary">
        <div className="container max-w-3xl">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-center mb-12">
            Common Questions About {service.name}
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
            Need {service.name} in {locationName}?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Get a price in under 2 minutes. No obligation, no sales pitch.
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
