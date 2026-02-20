import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { BUSINESS, SERVICES, LOCATIONS } from "@shared/data";
import { Phone, ArrowRight, MapPin, CheckCircle } from "lucide-react";

interface LocationPageProps {
  locationId: string;
}

export default function LocationPage({ locationId }: LocationPageProps) {
  const location = LOCATIONS.find(l => l.id === locationId);
  if (!location) return null;

  const locationName = `${location.name}, ${location.state}`;

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="bg-navy py-16 md:py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-navy-dark to-navy opacity-90" />
        <div className="container relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-sky" />
              <span className="text-sky font-semibold">Service Area</span>
            </div>
            <h1 className="font-heading font-black text-3xl md:text-5xl text-white mb-4">
              Pressure Washing & Window Cleaning in {locationName}
            </h1>
            <p className="text-lg text-white/80 mb-6">{location.description}</p>
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

      {/* Services available */}
      <section className="py-16 bg-white">
        <div className="container">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-center mb-4">
            Services Available in {locationName}
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            We bring our full range of professional exterior cleaning services to {location.name} and the surrounding area.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(service => (
              <Link key={service.id} href={`/${service.slug}-cookeville-tn`}>
                <Card className="group h-full hover:shadow-lg transition-all cursor-pointer hover:border-primary/30">
                  <CardContent className="p-6">
                    <h3 className="font-heading font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                    <span className="text-sm font-semibold text-primary flex items-center gap-1">
                      Learn More <ArrowRight className="w-4 h-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="py-16 bg-secondary">
        <div className="container max-w-3xl">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-center mb-8">
            Why {location.name} Homeowners Choose Exterior Experts
          </h2>
          <div className="space-y-4">
            {[
              `Local to the Upper Cumberland — we know ${location.name} homes`,
              "Licensed, insured, and satisfaction guaranteed",
              "Transparent instant online quotes — no surprises",
              "Professional-grade equipment and eco-friendly solutions",
              "Flexible scheduling that works around your life",
              "5-star rated by your neighbors",
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy text-center">
        <div className="container">
          <h2 className="font-heading font-bold text-3xl text-white mb-4">
            Get a Free Quote for Your {location.name} Home
          </h2>
          <p className="text-white/80 mb-8">Instant pricing. No obligation. No hidden fees.</p>
          <Link href="/instant-quote">
            <Button size="lg" className="bg-sky hover:bg-sky-light text-white font-bold">
              Get Instant Quote <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Other areas */}
      <section className="py-12 bg-white">
        <div className="container">
          <h3 className="font-heading font-bold text-xl mb-6 text-center">Other Service Areas</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {LOCATIONS.filter(l => l.id !== locationId).map(l => (
              <Link key={l.id} href={`/service-areas/${l.slug}`}>
                <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary hover:text-white">
                  {l.name}, {l.state}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
