import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BUSINESS, SERVICES, LOCATIONS } from "@shared/data";
import { Phone, Mail, MapPin, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  {
    label: "Services",
    href: "#",
    children: SERVICES.map(s => ({
      label: s.name,
      href: `/${s.slug}-cookeville-tn`,
    })),
  },
  {
    label: "Service Areas",
    href: "/service-areas",
    children: LOCATIONS.map(l => ({
      label: `${l.name}, ${l.state}`,
      href: `/service-areas/${l.slug}`,
    })),
  },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function TopBar() {
  return (
    <div className="bg-navy text-white text-sm py-2 hidden md:block">
      <div className="container flex justify-between items-center">
        <div className="flex items-center gap-6">
          <a href={`tel:${BUSINESS.phoneRaw}`} className="flex items-center gap-1.5 hover:text-sky-light transition-colors">
            <Phone className="w-3.5 h-3.5" />
            {BUSINESS.phone}
          </a>
          <a href={`mailto:${BUSINESS.email}`} className="flex items-center gap-1.5 hover:text-sky-light transition-colors">
            <Mail className="w-3.5 h-3.5" />
            {BUSINESS.email}
          </a>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          Serving Cookeville, Baxter, Algood, Sparta & Livingston, TN
        </div>
      </div>
    </div>
  );
}

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [location] = useLocation();

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img
            src={BUSINESS.logoUrl}
            alt={BUSINESS.name}
            className="h-12 md:h-16 w-auto"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <div
              key={link.label}
              className="relative group"
              onMouseEnter={() => link.children && setOpenDropdown(link.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              {link.children ? (
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                  {link.label}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Link
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    location === link.href ? "text-primary" : "text-foreground hover:text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              )}
              {link.children && openDropdown === link.label && (
                <div className="absolute top-full left-0 bg-white shadow-lg rounded-lg border py-2 min-w-[220px] z-50">
                  {link.children.map(child => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block px-4 py-2 text-sm text-foreground hover:bg-secondary hover:text-primary transition-colors"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* CTA + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <Link href="/instant-quote">
            <Button className="bg-primary hover:bg-navy-light text-white font-semibold text-sm px-4 py-2 hidden sm:inline-flex">
              Get Instant Quote
            </Button>
          </Link>
          <a href={`tel:${BUSINESS.phoneRaw}`} className="lg:hidden">
            <Button variant="outline" size="icon" className="border-primary text-primary">
              <Phone className="w-4 h-4" />
            </Button>
          </a>
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t shadow-lg">
          <nav className="container py-4 space-y-1">
            {NAV_LINKS.map(link => (
              <div key={link.label}>
                {link.children ? (
                  <div>
                    <button
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-foreground"
                      onClick={() => setOpenDropdown(openDropdown === link.label ? null : link.label)}
                    >
                      {link.label}
                      <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === link.label ? "rotate-180" : ""}`} />
                    </button>
                    {openDropdown === link.label && (
                      <div className="pl-4 space-y-1">
                        {link.children.map(child => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary"
                            onClick={() => setMobileOpen(false)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    className="block px-3 py-2.5 text-sm font-medium text-foreground hover:text-primary"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
            <div className="pt-3 px-3">
              <Link href="/instant-quote" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-primary hover:bg-navy-light text-white font-semibold">
                  Get Instant Quote
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <img src={BUSINESS.logoUrl} alt={BUSINESS.name} className="h-14 w-auto mb-4 brightness-0 invert" />
            <p className="text-sm text-gray-300 leading-relaxed">
              Professional power washing & window cleaning serving the Upper Cumberland region. Licensed, insured, and satisfaction guaranteed.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Our Services</h3>
            <ul className="space-y-2">
              {SERVICES.map(s => (
                <li key={s.id}>
                  <Link href={`/${s.slug}-cookeville-tn`} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service Areas */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Service Areas</h3>
            <ul className="space-y-2">
              {LOCATIONS.map(l => (
                <li key={l.id}>
                  <Link href={`/service-areas/${l.slug}`} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {l.name}, {l.state}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Contact Us</h3>
            <div className="space-y-3">
              <a href={`tel:${BUSINESS.phoneRaw}`} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors">
                <Phone className="w-4 h-4 shrink-0" />
                {BUSINESS.phone}
              </a>
              <a href={`mailto:${BUSINESS.email}`} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors">
                <Mail className="w-4 h-4 shrink-0" />
                {BUSINESS.email}
              </a>
              <div className="flex items-start gap-2 text-sm text-gray-300">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{BUSINESS.fullAddress}</span>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/instant-quote">
                <Button className="bg-sky hover:bg-sky-light text-white font-semibold w-full">
                  Get Your Free Quote
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/instant-quote" className="text-xs text-gray-400 hover:text-white transition-colors">
              Instant Quote
            </Link>
            <Link href="/gallery" className="text-xs text-gray-400 hover:text-white transition-colors">
              Gallery
            </Link>
            <Link href="/contact" className="text-xs text-gray-400 hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
