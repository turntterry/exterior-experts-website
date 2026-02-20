import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { lazy, Suspense } from "react";

// Lazy load pages for better performance
const ServicePage = lazy(() => import("./pages/ServicePage"));
const LocationPage = lazy(() => import("./pages/LocationPage"));
const ServiceAreas = lazy(() => import("./pages/ServiceAreas"));
const QuoteTool = lazy(() => import("./pages/QuoteTool"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Contact = lazy(() => import("./pages/Contact"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminQuotes = lazy(() => import("./pages/admin/Quotes"));
const AdminQuoteDetail = lazy(() => import("./pages/admin/QuoteDetail"));
const AdminPricing = lazy(() => import("./pages/admin/Pricing"));
const AdminGallery = lazy(() => import("./pages/admin/GalleryManager"));
const AdminContacts = lazy(() => import("./pages/admin/Contacts"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-primary font-heading text-xl">Loading...</div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        {/* Service pages */}
        <Route path="/house-washing-cookeville-tn" component={() => <ServicePage serviceId="house_washing" />} />
        <Route path="/pressure-washing-cookeville-tn" component={() => <ServicePage serviceId="pressure_washing" />} />
        <Route path="/window-cleaning-cookeville-tn" component={() => <ServicePage serviceId="window_cleaning" />} />
        <Route path="/gutter-cleaning-cookeville-tn" component={() => <ServicePage serviceId="gutter_cleaning" />} />
        <Route path="/concrete-cleaning-cookeville-tn" component={() => <ServicePage serviceId="driveway_cleaning" />} />
        <Route path="/roof-cleaning-cookeville-tn" component={() => <ServicePage serviceId="roof_cleaning" />} />
        <Route path="/deck-cleaning-cookeville-tn" component={() => <ServicePage serviceId="deck_cleaning" />} />
        {/* Sparta service pages */}
        <Route path="/pressure-washing-sparta-tn" component={() => <ServicePage serviceId="pressure_washing" locationId="sparta" />} />
        <Route path="/window-cleaning-sparta-tn" component={() => <ServicePage serviceId="window_cleaning" locationId="sparta" />} />
        {/* Livingston service pages */}
        <Route path="/house-washing-livingston-tn" component={() => <ServicePage serviceId="house_washing" locationId="livingston" />} />
        {/* Location pages */}
        <Route path="/service-areas" component={ServiceAreas} />
        <Route path="/service-areas/cookeville-tn" component={() => <LocationPage locationId="cookeville" />} />
        <Route path="/service-areas/baxter-tn" component={() => <LocationPage locationId="baxter" />} />
        <Route path="/service-areas/algood-tn" component={() => <LocationPage locationId="algood" />} />
        <Route path="/service-areas/sparta-tn" component={() => <LocationPage locationId="sparta" />} />
        <Route path="/service-areas/livingston-tn" component={() => <LocationPage locationId="livingston" />} />
        {/* Quote tool */}
        <Route path="/instant-quote" component={QuoteTool} />
        {/* Gallery */}
        <Route path="/gallery" component={Gallery} />
        {/* Contact */}
        <Route path="/contact" component={Contact} />
        {/* Admin routes */}
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/quotes" component={AdminQuotes} />
        <Route path="/admin/quotes/:id" component={AdminQuoteDetail} />
        <Route path="/admin/pricing" component={AdminPricing} />
        <Route path="/admin/gallery" component={AdminGallery} />
        <Route path="/admin/contacts" component={AdminContacts} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
