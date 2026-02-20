import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BUSINESS, SERVICES } from "@shared/data";
import { trpc } from "@/lib/trpc";
import {
  calculateServicePrice, calculateQuoteTotal,
  type PricingInput, type PricingResult, type GlobalConfig, type ServiceConfig,
} from "@shared/pricing";
import {
  ArrowRight, ArrowLeft, CheckCircle, Phone, MapPin, Upload, Calendar, Clock,
  Home as HomeIcon, Droplets, SquareStack, Filter, LayoutGrid, Triangle, Fence, X, Loader2, Shield, Star,
} from "lucide-react";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

const ICON_MAP: Record<string, React.ElementType> = {
  Home: HomeIcon, Droplets, SquareStack, Filter, LayoutGrid, Triangle, Fence,
};

// Quotable services (subset of SERVICES)
const QUOTABLE_SERVICES = [
  { id: "house_washing", name: "House Washing", icon: "Home", desc: "Soft wash your home's exterior" },
  { id: "window_cleaning", name: "Window Cleaning", icon: "SquareStack", desc: "Interior & exterior windows" },
  { id: "gutter_cleaning", name: "Gutter Cleaning", icon: "Filter", desc: "Debris removal & flushing" },
  { id: "driveway_cleaning", name: "Driveway / Concrete", icon: "LayoutGrid", desc: "Driveways, sidewalks & patios" },
  { id: "roof_cleaning", name: "Roof Cleaning", icon: "Triangle", desc: "Soft wash roof treatment" },
  { id: "deck_cleaning", name: "Deck / Fence", icon: "Fence", desc: "Decks, fences & patios" },
  { id: "patio_cleaning", name: "Patio Cleaning", icon: "LayoutGrid", desc: "Patio surface cleaning" },
  { id: "walkway_cleaning", name: "Walkway Cleaning", icon: "LayoutGrid", desc: "Walkway & path cleaning" },
];

const SIZE_LABELS: Record<string, string> = {
  S: "Small", M: "Medium", L: "Large", XL: "Extra Large", "2XL": "2X Large",
};

const STEPS = ["Address", "Contact", "Services", "Details", "Review", "Schedule", "Submit"];

export default function QuoteTool() {
  const { data: pricingData, isLoading: pricingLoading } = trpc.quote.getPricing.useQuery();
  const submitMutation = trpc.quote.submit.useMutation();
  const uploadMutation = trpc.quote.uploadPhoto.useMutation();

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("TN");
  const [zip, setZip] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [distanceMiles, setDistanceMiles] = useState<number>(0);
  const [outOfRange, setOutOfRange] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [serviceInputs, setServiceInputs] = useState<Record<string, PricingInput>>({});

  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quoteResult, setQuoteResult] = useState<{ quoteId: number; totalPrice: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const globalConfig = useMemo<GlobalConfig>(() => {
    if (!pricingData?.global_settings) return {
      jobMinimum: 225, taxRate: 0, travelRadius: 40,
      baseAddress: BUSINESS.fullAddress, baseLat: BUSINESS.baseLat, baseLng: BUSINESS.baseLng,
      bundleDiscounts: { "2": 5, "3": 10, "4": 15, "5": 20 },
      travelFeePerMile: 3, freeRadius: 15,
    };
    return pricingData.global_settings as unknown as GlobalConfig;
  }, [pricingData]);

  const getServiceConfig = useCallback((serviceType: string): ServiceConfig => {
    if (!pricingData?.[serviceType]) return {};
    return pricingData[serviceType] as unknown as ServiceConfig;
  }, [pricingData]);

  // Calculate prices for all selected services
  const pricingResults = useMemo(() => {
    const results: PricingResult[] = [];
    selectedServices.forEach(svcId => {
      const input = serviceInputs[svcId] || { serviceType: svcId };
      const config = getServiceConfig(svcId);
      results.push(calculateServicePrice({ ...input, serviceType: svcId }, config));
    });
    return results;
  }, [selectedServices, serviceInputs, getServiceConfig]);

  const quoteSummary = useMemo(() => {
    return calculateQuoteTotal(pricingResults, distanceMiles, globalConfig);
  }, [pricingResults, distanceMiles, globalConfig]);

  const toggleService = (id: string) => {
    setSelectedServices(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (!serviceInputs[id]) {
          setServiceInputs(prev => ({ ...prev, [id]: getDefaultInputs(id) }));
        }
      }
      return next;
    });
  };

  const updateServiceInput = (svcId: string, key: string, value: unknown) => {
    setServiceInputs(prev => ({
      ...prev,
      [svcId]: { ...(prev[svcId] || { serviceType: svcId }), [key]: value },
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }
        const base64 = await fileToBase64(file);
        const result = await uploadMutation.mutateAsync({
          fileBase64: base64,
          fileName: file.name,
          contentType: file.type,
        });
        setPhotos(prev => [...prev, result.url]);
      }
      toast.success("Photos uploaded!");
    } catch (err) {
      toast.error("Failed to upload photos");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    try {
      const result = await submitMutation.mutateAsync({
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        address: `${address}, ${city}, ${stateVal} ${zip}`,
        city, state: stateVal, zip,
        lat: lat || undefined,
        lng: lng || undefined,
        distanceMiles: distanceMiles || undefined,
        subtotal: quoteSummary.subtotal,
        bundleDiscount: quoteSummary.bundleDiscount,
        travelFee: quoteSummary.travelFee,
        totalPrice: quoteSummary.totalPrice,
        preferredDate: preferredDate || undefined,
        preferredTime: preferredTime || undefined,
        referralSource: referralSource || undefined,
        customerPhotos: photos.length > 0 ? photos : undefined,
        items: pricingResults.map(r => ({
          serviceType: r.serviceType,
          packageTier: (serviceInputs[r.serviceType]?.packageTier || "good") as "good" | "better" | "best",
          inputs: (serviceInputs[r.serviceType] as unknown as Record<string, unknown>) || {},
          basePrice: r.basePrice,
          finalPrice: r.finalPrice,
          description: r.breakdown.join("; "),
        })),
      });
      setQuoteResult(result);
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit quote");
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return address.trim().length > 0 && city.trim().length > 0 && !outOfRange;
      case 1: return name.trim().length > 0 && email.trim().length > 0 && phone.trim().length > 0;
      case 2: return selectedServices.size > 0;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      default: return true;
    }
  };

  if (pricingLoading) {
    return (
      <SiteLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SiteLayout>
    );
  }

  if (submitted && quoteResult) {
    return (
      <SiteLayout>
        <section className="py-16 md:py-24 bg-white">
          <div className="container max-w-2xl text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="font-heading font-bold text-3xl md:text-4xl mb-4">Quote Submitted!</h1>
            <p className="text-lg text-muted-foreground mb-2">Your estimated total:</p>
            <p className="font-heading font-black text-5xl text-primary mb-6">${quoteResult.totalPrice.toFixed(2)}</p>
            <p className="text-muted-foreground mb-8">
              Quote #{quoteResult.quoteId} has been sent to {BUSINESS.owner}. We'll reach out within 24 hours to confirm your appointment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={`tel:${BUSINESS.phoneRaw}`}>
                <Button size="lg" className="bg-primary hover:bg-navy-light text-white font-bold">
                  <Phone className="w-4 h-4 mr-2" /> Call Now: {BUSINESS.phone}
                </Button>
              </a>
              <a href="/">
                <Button size="lg" variant="outline">Back to Home</Button>
              </a>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="bg-navy py-8 md:py-12 relative">
        <div className="container relative">
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-white mb-2">
            Get Your Instant Quote
          </h1>
          <p className="text-white/70 text-sm">Transparent pricing in under 2 minutes</p>
        </div>
      </section>

      <section className="py-8 md:py-12 bg-secondary min-h-[60vh]">
        <div className="container max-w-3xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {STEPS.map((s, i) => (
                <span key={s} className={`text-xs font-medium hidden sm:block ${i <= step ? "text-primary" : "text-muted-foreground"}`}>
                  {s}
                </span>
              ))}
              <span className="sm:hidden text-sm font-medium text-primary">Step {step + 1} of {STEPS.length}: {STEPS[step]}</span>
            </div>
            <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-6 md:p-8">
              {step === 0 && <StepAddress address={address} setAddress={setAddress} city={city} setCity={setCity} stateVal={stateVal} setStateVal={setStateVal} zip={zip} setZip={setZip} setLat={setLat} setLng={setLng} distanceMiles={distanceMiles} setDistanceMiles={setDistanceMiles} outOfRange={outOfRange} setOutOfRange={setOutOfRange} globalConfig={globalConfig} />}
              {step === 1 && <StepContact name={name} setName={setName} email={email} setEmail={setEmail} phone={phone} setPhone={setPhone} />}
              {step === 2 && <StepServices selectedServices={selectedServices} toggleService={toggleService} />}
              {step === 3 && <StepDetails selectedServices={selectedServices} serviceInputs={serviceInputs} updateServiceInput={updateServiceInput} pricingResults={pricingResults} getServiceConfig={getServiceConfig} />}
              {step === 4 && <StepReview pricingResults={pricingResults} quoteSummary={quoteSummary} serviceInputs={serviceInputs} address={`${address}, ${city}, ${stateVal} ${zip}`} name={name} />}
              {step === 5 && <StepSchedule preferredDate={preferredDate} setPreferredDate={setPreferredDate} preferredTime={preferredTime} setPreferredTime={setPreferredTime} referralSource={referralSource} setReferralSource={setReferralSource} photos={photos} setPhotos={setPhotos} uploading={uploading} handlePhotoUpload={handlePhotoUpload} fileInputRef={fileInputRef} />}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                {step > 0 ? (
                  <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                ) : <div />}
                {step < STEPS.length - 1 ? (
                  <Button
                    onClick={() => setStep(s => s + 1)}
                    disabled={!canProceed()}
                    className="bg-primary hover:bg-navy-light text-white font-semibold"
                  >
                    {step === 4 ? "Continue to Scheduling" : "Next"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                    className="bg-sky hover:bg-sky-light text-white font-bold px-8"
                  >
                    {submitMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    {submitMutation.isPending ? "Submitting..." : `Submit Quote — $${quoteSummary.totalPrice.toFixed(2)}`}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live price sidebar on larger screens */}
          {step >= 2 && selectedServices.size > 0 && (
            <Card className="mt-6 bg-navy text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Estimated Total</p>
                    <p className="font-heading font-bold text-2xl">${quoteSummary.totalPrice.toFixed(2)}</p>
                  </div>
                  <div className="text-right text-sm text-white/70">
                    <p>{selectedServices.size} service{selectedServices.size > 1 ? "s" : ""}</p>
                    {quoteSummary.bundleDiscount > 0 && (
                      <p className="text-green-300">Bundle saves ${quoteSummary.bundleDiscount.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

// ─── Step Components ─────────────────────────────────────────────────

function StepAddress({ address, setAddress, city, setCity, stateVal, setStateVal, zip, setZip, setLat, setLng, distanceMiles, setDistanceMiles, outOfRange, setOutOfRange, globalConfig }: any) {
  return (
    <div>
      <h2 className="font-heading font-bold text-xl mb-1">Where is the property?</h2>
      <p className="text-sm text-muted-foreground mb-6">Enter the address of the property you'd like serviced.</p>
      <div className="space-y-4">
        <div>
          <Label htmlFor="address">Street Address *</Label>
          <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main Street" className="text-base" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <Label htmlFor="city">City *</Label>
            <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="Cookeville" />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" value={stateVal} onChange={e => setStateVal(e.target.value)} placeholder="TN" maxLength={2} />
          </div>
          <div>
            <Label htmlFor="zip">ZIP</Label>
            <Input id="zip" value={zip} onChange={e => setZip(e.target.value)} placeholder="38506" />
          </div>
        </div>
        {outOfRange && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            This address appears to be outside our {globalConfig.travelRadius}-mile service area. Please call us at {BUSINESS.phone} for a custom quote.
          </div>
        )}
        <div className="bg-secondary rounded-lg p-4 flex items-start gap-3">
          <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p>We serve Cookeville, Baxter, Algood, Sparta, Livingston, and the surrounding Upper Cumberland area.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepContact({ name, setName, email, setEmail, phone, setPhone }: any) {
  return (
    <div>
      <h2 className="font-heading font-bold text-xl mb-1">Your Contact Information</h2>
      <p className="text-sm text-muted-foreground mb-6">So we can send you the quote details and follow up.</p>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input id="name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="John Smith" className="text-base" />
        </div>
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input id="email" type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} placeholder="john@example.com" className="text-base" />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input id="phone" type="tel" value={phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} placeholder="(555) 123-4567" className="text-base" />
        </div>
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary rounded-lg p-3">
          <Shield className="w-4 h-4 shrink-0 mt-0.5" />
          Your information is secure and will only be used to deliver your quote.
        </div>
      </div>
    </div>
  );
}

function StepServices({ selectedServices, toggleService }: { selectedServices: Set<string>; toggleService: (id: string) => void }) {
  return (
    <div>
      <h2 className="font-heading font-bold text-xl mb-1">What services do you need?</h2>
      <p className="text-sm text-muted-foreground mb-2">Select all that apply. Bundle 2+ services and save!</p>
      {selectedServices.size >= 2 && (
        <Badge className="bg-green-100 text-green-700 mb-4">
          <Star className="w-3 h-3 mr-1" /> Bundle discount: {selectedServices.size >= 5 ? 20 : selectedServices.size >= 4 ? 15 : selectedServices.size >= 3 ? 10 : 5}% off!
        </Badge>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {QUOTABLE_SERVICES.map(svc => {
          const Icon = ICON_MAP[svc.icon] || Droplets;
          const selected = selectedServices.has(svc.id);
          return (
            <button
              key={svc.id}
              onClick={() => toggleService(svc.id)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                selected ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/30 hover:shadow-sm"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selected ? "bg-primary text-white" : "bg-secondary text-primary"}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{svc.name}</p>
                <p className="text-xs text-muted-foreground">{svc.desc}</p>
              </div>
              {selected && <CheckCircle className="w-5 h-5 text-primary shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDetails({ selectedServices, serviceInputs, updateServiceInput, pricingResults, getServiceConfig }: any) {
  const services = Array.from(selectedServices as Set<string>);
  return (
    <div>
      <h2 className="font-heading font-bold text-xl mb-1">Tell us about your property</h2>
      <p className="text-sm text-muted-foreground mb-6">Configure each service for accurate pricing.</p>
      <div className="space-y-6">
        {services.map((svcId: string) => (
          <ServiceDetailForm
            key={svcId}
            serviceId={svcId}
            inputs={serviceInputs[svcId] || { serviceType: svcId }}
            updateInput={(key: string, val: unknown) => updateServiceInput(svcId, key, val)}
            config={getServiceConfig(svcId)}
            price={pricingResults.find((r: PricingResult) => r.serviceType === svcId)}
          />
        ))}
      </div>
    </div>
  );
}

function ServiceDetailForm({ serviceId, inputs, updateInput, config, price }: {
  serviceId: string; inputs: PricingInput; updateInput: (key: string, val: unknown) => void;
  config: ServiceConfig; price?: PricingResult;
}) {
  const svc = QUOTABLE_SERVICES.find(s => s.id === serviceId);
  if (!svc) return null;

  return (
    <Card className="border-2">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-lg">{svc.name}</h3>
          {price && <span className="font-heading font-bold text-lg text-primary">${price.finalPrice.toFixed(2)}</span>}
        </div>

        {/* House Washing */}
        {serviceId === "house_washing" && (
          <div className="space-y-4">
            <div>
              <Label>Home Square Footage</Label>
              <Input type="number" value={inputs.sqft || ""} onChange={e => updateInput("sqft", Number(e.target.value) || 0)} placeholder="e.g. 2000" />
            </div>
            <div>
              <Label>Number of Stories</Label>
              <RadioGroup value={String(inputs.stories || 1)} onValueChange={v => updateInput("stories", Number(v))}>
                <div className="flex gap-4">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="flex items-center gap-2">
                      <RadioGroupItem value={String(n)} id={`stories-${n}`} />
                      <Label htmlFor={`stories-${n}`}>{n}-Story</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Window Cleaning */}
        {serviceId === "window_cleaning" && (
          <div className="space-y-4">
            <div>
              <Label>Number of Windows</Label>
              <Input type="number" value={inputs.windowCount || ""} onChange={e => updateInput("windowCount", Number(e.target.value) || 0)} placeholder="e.g. 15" />
            </div>
            <WindowPackageSelector value={inputs.packageTier} onChange={v => updateInput("packageTier", v)} />
          </div>
        )}

        {/* Roof Cleaning */}
        {serviceId === "roof_cleaning" && (
          <div className="space-y-4">
            <div>
              <Label>Roof Square Footage</Label>
              <Input type="number" value={inputs.sqft || ""} onChange={e => updateInput("sqft", Number(e.target.value) || 0)} placeholder="e.g. 2000" />
            </div>
            <div>
              <Label>Roof Pitch</Label>
              <RadioGroup value={inputs.roofPitch || "low"} onValueChange={v => updateInput("roofPitch", v)}>
                <div className="flex gap-4">
                  {[{ v: "low", l: "Low Pitch" }, { v: "medium", l: "Medium Pitch" }, { v: "steep", l: "Steep Pitch" }].map(p => (
                    <div key={p.v} className="flex items-center gap-2">
                      <RadioGroupItem value={p.v} id={`pitch-${p.v}`} />
                      <Label htmlFor={`pitch-${p.v}`}>{p.l}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Gutter Cleaning */}
        {serviceId === "gutter_cleaning" && (
          <div className="space-y-4">
            <div>
              <Label>Gutter Size</Label>
              <Select value={inputs.sizeSelection || "M"} onValueChange={v => updateInput("sizeSelection", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(config.sizeTiers || {}).map(([k]) => (
                    <SelectItem key={k} value={k}>{SIZE_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Number of Stories</Label>
              <RadioGroup value={String(inputs.stories || 1)} onValueChange={v => updateInput("stories", Number(v))}>
                <div className="flex gap-4">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="flex items-center gap-2">
                      <RadioGroupItem value={String(n)} id={`gstories-${n}`} />
                      <Label htmlFor={`gstories-${n}`}>{n}-Story</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Size-tier services */}
        {["driveway_cleaning", "patio_cleaning", "walkway_cleaning", "deck_cleaning"].includes(serviceId) && (
          <div className="space-y-4">
            <div>
              <Label>Size</Label>
              <Select value={inputs.sizeSelection || "M"} onValueChange={v => updateInput("sizeSelection", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(config.sizeTiers || {}).map(([k]) => (
                    <SelectItem key={k} value={k}>{SIZE_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}


      </CardContent>
    </Card>
  );
}

function WindowPackageSelector({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const tiers = [
    {
      id: "good",
      name: "Expert Essential",
      included: ["Exterior Glass Cleaning", "Screen Removal & Replacement"],
      notIncluded: ["Interior Glass", "Frames & Sills", "Deep Track & Screen Scrub"],
    },
    {
      id: "better",
      name: "Signature Sparkle",
      badge: "Most Popular",
      included: ["Exterior Glass Cleaning", "Interior Glass Cleaning", "Frames Wiped Down", "Interior Ledges Wiped"],
      notIncluded: ["Sills", "Deep Track Cleaning or Screen Scrub"],
    },
    {
      id: "best",
      name: "Platinum Perfection",
      included: ["Exterior & Interior Glass", "Frames, Sills & Ledges", "Deep Screen Washing (Soap & Scrub)", "Deep Track Detailing (Clean & Rinse)"],
      notIncluded: [],
    },
  ];
  return (
    <div>
      <Label className="mb-2 block">Window Cleaning Package</Label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {tiers.map(t => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all relative ${
              (value || "good") === t.id ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/30"
            }`}
          >
            {t.badge && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-sky text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                {t.badge}
              </span>
            )}
            <p className="font-bold text-sm mb-2">{t.name}</p>
            <div className="space-y-1">
              {t.included.map(item => (
                <p key={item} className="text-xs flex items-start gap-1.5">
                  <span className="text-green-600 font-bold shrink-0">✓</span>
                  <span>{item}</span>
                </p>
              ))}
              {t.notIncluded.map(item => (
                <p key={item} className="text-xs flex items-start gap-1.5 text-muted-foreground">
                  <span className="text-red-400 font-bold shrink-0">✗</span>
                  <span>{item}</span>
                </p>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepReview({ pricingResults, quoteSummary, serviceInputs, address, name }: any) {
  return (
    <div>
      <h2 className="font-heading font-bold text-xl mb-1">Review Your Quote</h2>
      <p className="text-sm text-muted-foreground mb-6">Here's your detailed price breakdown.</p>

      <div className="space-y-3 mb-6">
        {pricingResults.map((r: PricingResult) => {
          const svc = QUOTABLE_SERVICES.find(s => s.id === r.serviceType);
          return (
            <div key={r.serviceType} className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="font-semibold">{svc?.name || r.serviceType}</p>
                {r.serviceType === "window_cleaning" && serviceInputs[r.serviceType]?.packageTier && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {serviceInputs[r.serviceType].packageTier === "best" ? "Platinum Perfection" : serviceInputs[r.serviceType].packageTier === "better" ? "Signature Sparkle" : "Expert Essential"}
                  </Badge>
                )}
              </div>
              <span className="font-heading font-bold">${r.finalPrice.toFixed(2)}</span>
            </div>
          );
        })}
      </div>

      <div className="bg-secondary rounded-xl p-5 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>${quoteSummary.subtotal.toFixed(2)}</span>
        </div>
        {quoteSummary.bundleDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Bundle Discount ({quoteSummary.bundleDiscountPercent}%)</span>
            <span>-${quoteSummary.bundleDiscount.toFixed(2)}</span>
          </div>
        )}

        {quoteSummary.jobMinimumApplied && (
          <div className="flex justify-between text-sm text-amber-600">
            <span>Job Minimum Applied</span>
            <span>$225.00</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-heading font-bold text-xl">
          <span>Total</span>
          <span className="text-primary">${quoteSummary.totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">
        <p><strong>Property:</strong> {address}</p>
        <p><strong>Customer:</strong> {name}</p>
        <p className="mt-2">This is an estimate based on the information provided. Final pricing may vary based on on-site conditions.</p>
      </div>
    </div>
  );
}

function StepSchedule({ preferredDate, setPreferredDate, preferredTime, setPreferredTime, referralSource, setReferralSource, photos, setPhotos, uploading, handlePhotoUpload, fileInputRef }: any) {
  return (
    <div>
      <h2 className="font-heading font-bold text-xl mb-1">Schedule & Extras</h2>
      <p className="text-sm text-muted-foreground mb-6">Optional: pick a preferred date and upload photos.</p>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date"><Calendar className="w-4 h-4 inline mr-1" />Preferred Date</Label>
            <Input id="date" type="date" value={preferredDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPreferredDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
          </div>
          <div>
            <Label htmlFor="time"><Clock className="w-4 h-4 inline mr-1" />Preferred Time</Label>
            <Select value={preferredTime} onValueChange={setPreferredTime}>
              <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning (7AM - 12PM)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                <SelectItem value="flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Upload Property Photos (Optional)</Label>
          <p className="text-xs text-muted-foreground mb-2">Help us give a more accurate quote by sharing photos of your property.</p>
          <div
            className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload photos (max 10MB each)</p>
              </>
            )}
          </div>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {photos.map((url: string, i: number) => (
                <div key={i} className="relative group">
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full aspect-square object-cover rounded-lg" />
                  <button
                    onClick={() => setPhotos((prev: string[]) => prev.filter((_: string, j: number) => j !== i))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="referral">How did you hear about us?</Label>
          <Select value={referralSource} onValueChange={setReferralSource}>
            <SelectTrigger><SelectValue placeholder="Select one (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="google">Google Search</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="nextdoor">Nextdoor</SelectItem>
              <SelectItem value="referral">Friend / Neighbor Referral</SelectItem>
              <SelectItem value="repeat">Repeat Customer</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getDefaultInputs(serviceId: string): PricingInput {
  switch (serviceId) {
    case "house_washing": return { serviceType: serviceId, sqft: 1800, stories: 1, packageTier: "good" };
    case "window_cleaning": return { serviceType: serviceId, windowCount: 15, includeExterior: true, includeInterior: false, includeScreens: false, packageTier: "good" };
    case "roof_cleaning": return { serviceType: serviceId, sqft: 2000, roofPitch: "low" };
    case "gutter_cleaning": return { serviceType: serviceId, sizeSelection: "M", stories: 1 };
    case "driveway_cleaning": return { serviceType: serviceId, sizeSelection: "M" };
    case "patio_cleaning": return { serviceType: serviceId, sizeSelection: "M" };
    case "walkway_cleaning": return { serviceType: serviceId, sizeSelection: "M" };
    case "deck_cleaning": return { serviceType: serviceId, sizeSelection: "M" };
    default: return { serviceType: serviceId, sizeSelection: "M" };
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
