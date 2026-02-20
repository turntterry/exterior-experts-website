import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { BUSINESS, SERVICES, LOCATIONS, SEED_GALLERY } from "@shared/data";
import {
  Phone, Star, Shield, Award, Clock, CheckCircle, ArrowRight,
  Home as HomeIcon, Droplets, SquareStack, Filter, LayoutGrid, Triangle, Fence, MapPin,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Home: HomeIcon, Droplets, SquareStack, Filter, LayoutGrid, Triangle, Fence,
};

export default function Home() {
  return (
    <SiteLayout>
      <HeroSection />
      <TrustBar />
      <ServicesSection />
      <GalleryPreview />
      <WhyChooseUs />
      <ReviewsSection />
      <ServiceAreasSection />
      <CTASection />
    </SiteLayout>
  );
}

function HeroSection() {
  return (
    <section className="relative bg-navy overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-light opacity-90" />
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      <div className="container relative py-20 md:py-28 lg:py-36">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
            <Shield className="w-4 h-4 text-sky" />
            <span className="text-sm text-white/90 font-medium">Licensed & Insured</span>
          </div>
          <h1 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-6">
            Professional Power Washing & Window Cleaning in{" "}
            <span className="text-sky">Cookeville, TN</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
            Transform your home's exterior with our expert pressure washing, soft washing, and window cleaning services. Serving the Upper Cumberland region with satisfaction guaranteed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/instant-quote">
              <Button size="lg" className="bg-sky hover:bg-sky-light text-white font-bold text-lg px-8 py-6 shadow-lg">
                Get Your Instant Quote
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href={`tel:${BUSINESS.phoneRaw}`}>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold text-lg px-8 py-6">
                <Phone className="w-5 h-5 mr-2" />
                {BUSINESS.phone}
              </Button>
            </a>
          </div>
        </div>
      </div>
      {/* Angled bottom edge */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 80L1440 80L1440 30L0 80Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}

function TrustBar() {
  const badges = [
    { icon: Shield, label: "Fully Insured" },
    { icon: Award, label: "5-Star Rated" },
    { icon: Clock, label: "Same-Day Quotes" },
    { icon: CheckCircle, label: "Satisfaction Guaranteed" },
  ];
  return (
    <section className="py-6 bg-white border-b">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map(b => (
            <div key={b.label} className="flex items-center justify-center gap-2 py-2">
              <b.icon className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
            Our Exterior Cleaning Services
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From house washing to window cleaning, we offer comprehensive exterior cleaning solutions for your home.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {SERVICES.map(service => {
            const Icon = ICON_MAP[service.icon] || Droplets;
            return (
              <Link key={service.id} href={`/${service.slug}-cookeville-tn`}>
                <Card className="group h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30 cursor-pointer">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-heading font-bold text-lg mb-2">{service.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                    <span className="mt-4 text-sm font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                      Learn More <ArrowRight className="w-4 h-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function GalleryPreview() {
  // Show a diverse mix of services in the homepage preview
  const featured = [
    SEED_GALLERY[0],  // House washing - brick
    SEED_GALLERY[6],  // Concrete - patio
    SEED_GALLERY[19], // Deck cleaning
    SEED_GALLERY[1],  // House washing - modern
    SEED_GALLERY[21], // Roof cleaning
    SEED_GALLERY[18], // Gutter cleaning
  ];
  const images = featured;
  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
            See Our Work
          </h2>
          <p className="text-muted-foreground text-lg">
            Real results from real customers in the Upper Cumberland area.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, i) => (
            <div key={i} className="relative group overflow-hidden rounded-xl aspect-[4/3]">
              <img
                src={img.url}
                alt={img.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-semibold text-sm">{img.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/gallery">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white font-semibold">
              View Full Gallery
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function WhyChooseUs() {
  const reasons = [
    { title: "Licensed & Insured", desc: "Full liability coverage for your peace of mind. We protect your property like it's our own." },
    { title: "Satisfaction Guaranteed", desc: "If you're not 100% satisfied, we'll come back and make it right at no extra charge." },
    { title: "Transparent Pricing", desc: "Get an instant quote online with no hidden fees. Know exactly what you'll pay before we arrive." },
    { title: "Experienced Team", desc: "Our trained technicians use professional-grade equipment and eco-friendly cleaning solutions." },
    { title: "Local & Trusted", desc: "Proudly serving the Upper Cumberland region. We're your neighbors and we care about our community." },
    { title: "Flexible Scheduling", desc: "Book online at your convenience. We work around your schedule to minimize disruption." },
  ];
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
            Why Choose Exterior Experts?
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map(r => (
            <div key={r.title} className="flex gap-4">
              <div className="shrink-0">
                <CheckCircle className="w-6 h-6 text-primary mt-1" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg mb-1">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewsSection() {
  const reviews = [
    { name: "David Weatherly", text: "Answered phone when I called, good communication via text, showed up on time and did a good job. Personable and reasonably priced. Will use again.", rating: 5 },
    { name: "Ken Novander", text: "Exterior Experts did a fantastic job! I used Exterior Experts to install Christmas lights on my home, and I couldn't be happier with the results. They outlined all the roof lines beautifully, and the pricing felt very competitive. Randell was great to work with\u2014he walked me through several design options. Installation was quick, professional, and done right the first time. Highly recommend!", rating: 5 },
    { name: "Ann-Marie Elkins", text: "Veni. Vidi. Vici. He came. He saw. He conquered.", rating: 5 },
    { name: "Jimmy Dickinson", text: "Randy did a great job, he arrived when he said he would and performed the job as quoted. You will not be disappointed.", rating: 5 },
    { name: "Doug Roe", text: "What an overwhelming great experience. Thank you for a job well done!", rating: 5 },
  ];
  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
            What Our Customers Say
          </h2>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />)}
          </div>
          <p className="text-muted-foreground">5-Star Rated on Google</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {reviews.map((review, i) => (
            <Card key={i} className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4">"{review.text}"</p>
                <p className="text-sm font-semibold text-primary">{review.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <a href={BUSINESS.googleMapsUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white font-semibold">
              See All Reviews on Google
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

function ServiceAreasSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
            Serving the Upper Cumberland Region
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We proudly serve Cookeville and the surrounding communities within a 40-mile radius.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {LOCATIONS.map(loc => (
            <Link key={loc.id} href={`/service-areas/${loc.slug}`}>
              <Card className="group hover:shadow-md transition-all cursor-pointer hover:border-primary/30">
                <CardContent className="p-4 text-center">
                  <MapPin className="w-6 h-6 text-primary mx-auto mb-2" />
                  <h3 className="font-heading font-bold text-sm">{loc.name}</h3>
                  <p className="text-xs text-muted-foreground">{loc.state}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-navy relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      <div className="container relative text-center">
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-4">
          Ready to Transform Your Home's Exterior?
        </h2>
        <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
          Get an instant quote in under 2 minutes. No obligation, no hidden fees.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/instant-quote">
            <Button size="lg" className="bg-sky hover:bg-sky-light text-white font-bold text-lg px-8 py-6">
              Get Your Instant Quote
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <a href={`tel:${BUSINESS.phoneRaw}`}>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold text-lg px-8 py-6">
              <Phone className="w-5 h-5 mr-2" />
              Call {BUSINESS.phone}
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
