import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Save, Loader2, DollarSign, Ruler, Home, SquareStack, Filter,
  LayoutGrid, Triangle, Fence, MapPin, Percent, AlertCircle, CheckCircle2, Info,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

// ─── Field metadata for user-friendly labels & descriptions ─────────

interface FieldMeta {
  label: string;
  description: string;
  unit?: string;
  step?: string;
  min?: number;
}

const GLOBAL_FIELDS: Record<string, FieldMeta> = {
  jobMinimum: { label: "Job Minimum", description: "Minimum total price for any quote. If a customer's total is below this, it gets bumped up.", unit: "$", step: "1", min: 0 },
  taxRate: { label: "Tax Rate", description: "Sales tax percentage (0 = no tax). Currently not charging tax.", unit: "%", step: "0.01", min: 0 },
  travelRadius: { label: "Max Travel Radius", description: "Maximum distance (in miles) you're willing to travel from your base address.", unit: "miles", step: "1", min: 0 },
  freeRadius: { label: "Free Travel Radius", description: "Distance (in miles) within which there's no travel fee.", unit: "miles", step: "1", min: 0 },
  travelFeePerMile: { label: "Travel Fee Per Mile", description: "Dollar amount charged per mile beyond the free radius.", unit: "$/mile", step: "0.5", min: 0 },
};

const BUNDLE_DISCOUNT_LABELS: Record<string, string> = {
  "2": "2 Services",
  "3": "3 Services",
  "4": "4 Services",
  "5": "5+ Services",
};

interface ServiceMeta {
  label: string;
  icon: React.ElementType;
  description: string;
  fields: Record<string, FieldMeta>;
  hasStoryMultipliers?: boolean;
  hasPitchMultipliers?: boolean;
  hasSizeTiers?: boolean;
  sizeTierUnit?: string;
}

const SERVICE_META: Record<string, ServiceMeta> = {
  house_washing: {
    label: "House Washing",
    icon: Home,
    description: "Soft wash pricing for home exteriors. Price = sq ft × rate × story multiplier.",
    fields: {
      ratePerSqft: { label: "Rate Per Sq Ft", description: "Base price per square foot of home exterior.", unit: "$/sqft", step: "0.01", min: 0 },
      minPrice: { label: "Minimum Price", description: "Minimum charge for any house wash job.", unit: "$", step: "1", min: 0 },
      minDuration: { label: "Min Duration", description: "Estimated minimum job time in minutes.", unit: "min", step: "5", min: 0 },
      targetRevenuePerHour: { label: "Target Revenue/Hour", description: "Your target hourly revenue for this service (for reference).", unit: "$/hr", step: "10", min: 0 },
    },
    hasStoryMultipliers: true,
  },
  window_cleaning: {
    label: "Window Cleaning",
    icon: SquareStack,
    description: "Per-window pricing with separate rates for exterior, interior, and screens.",
    fields: {
      exteriorPerWindow: { label: "Exterior Per Window", description: "Price per window for exterior cleaning.", unit: "$", step: "0.5", min: 0 },
      interiorPerWindow: { label: "Interior Per Window", description: "Price per window for interior cleaning.", unit: "$", step: "0.5", min: 0 },
      screenPerWindow: { label: "Screen Per Window", description: "Price per window for screen removal, wash & replacement.", unit: "$", step: "0.5", min: 0 },
      minPrice: { label: "Minimum Price", description: "Minimum charge for any window cleaning job.", unit: "$", step: "1", min: 0 },
      minDuration: { label: "Min Duration", description: "Estimated minimum job time in minutes.", unit: "min", step: "5", min: 0 },
      targetRevenuePerHour: { label: "Target Revenue/Hour", description: "Your target hourly revenue (for reference).", unit: "$/hr", step: "10", min: 0 },
    },
  },
  gutter_cleaning: {
    label: "Gutter Cleaning",
    icon: Filter,
    description: "Priced by linear feet of gutter. Size tiers map to estimated linear footage.",
    fields: {
      ratePerLinearFt: { label: "Rate Per Linear Ft", description: "Price per linear foot of gutter.", unit: "$/ft", step: "0.1", min: 0 },
      minPrice: { label: "Minimum Price", description: "Minimum charge for any gutter cleaning job.", unit: "$", step: "1", min: 0 },
      minDuration: { label: "Min Duration", description: "Estimated minimum job time in minutes.", unit: "min", step: "5", min: 0 },
      targetRevenuePerHour: { label: "Target Revenue/Hour", description: "Your target hourly revenue (for reference).", unit: "$/hr", step: "10", min: 0 },
    },
    hasStoryMultipliers: true,
    hasSizeTiers: true,
    sizeTierUnit: "linear ft",
  },
  driveway_cleaning: {
    label: "Driveway / Concrete",
    icon: LayoutGrid,
    description: "Concrete surface cleaning priced by square footage. Size tiers map to estimated sq ft.",
    fields: {
      ratePerSqft: { label: "Rate Per Sq Ft", description: "Price per square foot of concrete surface.", unit: "$/sqft", step: "0.01", min: 0 },
      minPrice: { label: "Minimum Price", description: "Minimum charge for any concrete cleaning job.", unit: "$", step: "1", min: 0 },
      minDuration: { label: "Min Duration", description: "Estimated minimum job time in minutes.", unit: "min", step: "5", min: 0 },
      targetRevenuePerHour: { label: "Target Revenue/Hour", description: "Your target hourly revenue (for reference).", unit: "$/hr", step: "10", min: 0 },
    },
    hasSizeTiers: true,
    sizeTierUnit: "sq ft",
  },
  roof_cleaning: {
    label: "Roof Cleaning",
    icon: Triangle,
    description: "Soft wash roof cleaning priced by square footage with pitch multipliers.",
    fields: {
      ratePerSqft: { label: "Rate Per Sq Ft", description: "Base price per square foot of roof area.", unit: "$/sqft", step: "0.01", min: 0 },
      minPrice: { label: "Minimum Price", description: "Minimum charge for any roof cleaning job.", unit: "$", step: "1", min: 0 },
      minDuration: { label: "Min Duration", description: "Estimated minimum job time in minutes.", unit: "min", step: "5", min: 0 },
      targetRevenuePerHour: { label: "Target Revenue/Hour", description: "Your target hourly revenue (for reference).", unit: "$/hr", step: "10", min: 0 },
    },
    hasPitchMultipliers: true,
  },
  deck_cleaning: {
    label: "Deck / Fence",
    icon: Fence,
    description: "Deck and fence cleaning priced by square footage. Size tiers map to estimated sq ft.",
    fields: {
      ratePerSqft: { label: "Rate Per Sq Ft", description: "Price per square foot of deck surface.", unit: "$/sqft", step: "0.01", min: 0 },
      minPrice: { label: "Minimum Price", description: "Minimum charge for any deck cleaning job.", unit: "$", step: "1", min: 0 },
      minDuration: { label: "Min Duration", description: "Estimated minimum job time in minutes.", unit: "min", step: "5", min: 0 },
      targetRevenuePerHour: { label: "Target Revenue/Hour", description: "Your target hourly revenue (for reference).", unit: "$/hr", step: "10", min: 0 },
    },
    hasSizeTiers: true,
    sizeTierUnit: "sq ft",
  },
  patio_cleaning: {
    label: "Patio Cleaning",
    icon: LayoutGrid,
    description: "Patio surface cleaning priced by square footage.",
    fields: {
      ratePerSqft: { label: "Rate Per Sq Ft", description: "Price per square foot of patio surface.", unit: "$/sqft", step: "0.01", min: 0 },
      minPrice: { label: "Minimum Price", description: "Minimum charge for any patio cleaning job.", unit: "$", step: "1", min: 0 },
      minDuration: { label: "Min Duration", description: "Estimated minimum job time in minutes.", unit: "min", step: "5", min: 0 },
      targetRevenuePerHour: { label: "Target Revenue/Hour", description: "Your target hourly revenue (for reference).", unit: "$/hr", step: "10", min: 0 },
    },
    hasSizeTiers: true,
    sizeTierUnit: "sq ft",
  },
  walkway_cleaning: {
    label: "Walkway Cleaning",
    icon: LayoutGrid,
    description: "Walkway and path cleaning priced by square footage.",
    fields: {
      ratePerSqft: { label: "Rate Per Sq Ft", description: "Price per square foot of walkway surface.", unit: "$/sqft", step: "0.01", min: 0 },
      minPrice: { label: "Minimum Price", description: "Minimum charge for any walkway cleaning job.", unit: "$", step: "1", min: 0 },
      minDuration: { label: "Min Duration", description: "Estimated minimum job time in minutes.", unit: "min", step: "5", min: 0 },
      targetRevenuePerHour: { label: "Target Revenue/Hour", description: "Your target hourly revenue (for reference).", unit: "$/hr", step: "10", min: 0 },
    },
    hasSizeTiers: true,
    sizeTierUnit: "sq ft",
  },
  fence_cleaning: {
    label: "Fence Cleaning",
    icon: Fence,
    description: "Fence cleaning priced by linear footage.",
    fields: {
      ratePerLinearFt: { label: "Rate Per Linear Ft", description: "Price per linear foot of fence.", unit: "$/ft", step: "0.1", min: 0 },
      minPrice: { label: "Minimum Price", description: "Minimum charge for any fence cleaning job.", unit: "$", step: "1", min: 0 },
      minDuration: { label: "Min Duration", description: "Estimated minimum job time in minutes.", unit: "min", step: "5", min: 0 },
      targetRevenuePerHour: { label: "Target Revenue/Hour", description: "Your target hourly revenue (for reference).", unit: "$/hr", step: "10", min: 0 },
    },
    hasSizeTiers: true,
    sizeTierUnit: "linear ft",
  },
  detached_structure: {
    label: "Detached Structure",
    icon: Home,
    description: "Detached buildings (garages, sheds, barns) priced by square footage.",
    fields: {
      ratePerSqft: { label: "Rate Per Sq Ft", description: "Price per square foot of structure exterior.", unit: "$/sqft", step: "0.01", min: 0 },
      minPrice: { label: "Minimum Price", description: "Minimum charge for any detached structure job.", unit: "$", step: "1", min: 0 },
      minDuration: { label: "Min Duration", description: "Estimated minimum job time in minutes.", unit: "min", step: "5", min: 0 },
      targetRevenuePerHour: { label: "Target Revenue/Hour", description: "Your target hourly revenue (for reference).", unit: "$/hr", step: "10", min: 0 },
    },
    hasSizeTiers: true,
    sizeTierUnit: "sq ft",
  },
};

const SIZE_LABELS: Record<string, string> = {
  S: "Small",
  M: "Medium",
  L: "Large",
  XL: "Extra Large",
  "2XL": "2X Large",
};

const STORY_LABELS: Record<string, string> = {
  "1": "1-Story",
  "2": "2-Story",
  "3": "3-Story",
};

const PITCH_LABELS: Record<string, string> = {
  low: "Low Pitch",
  medium: "Medium Pitch",
  steep: "Steep Pitch",
};

// ─── Main Component ─────────────────────────────────────────────────

export default function Pricing() {
  const { data: configs, isLoading, refetch } = trpc.admin.pricing.list.useQuery();
  const updateMutation = trpc.admin.pricing.update.useMutation({
    onSuccess: () => {
      toast.success("Pricing saved! Changes take effect immediately for new quotes.");
      refetch();
      setDirty(prev => {
        const next = new Set(prev);
        // Clear all dirty flags on success
        next.clear();
        return next;
      });
    },
    onError: (e: any) => toast.error(e.message || "Failed to save pricing"),
  });

  const [editedConfigs, setEditedConfigs] = useState<Record<string, Record<string, unknown>>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (configs) {
      const map: Record<string, Record<string, unknown>> = {};
      configs.forEach((c: any) => {
        map[c.serviceType] = c.config as Record<string, unknown>;
      });
      setEditedConfigs(map);
    }
  }, [configs]);

  const updateField = useCallback((serviceType: string, field: string, value: unknown) => {
    setEditedConfigs(prev => ({
      ...prev,
      [serviceType]: { ...prev[serviceType], [field]: value },
    }));
    setDirty(prev => new Set(prev).add(serviceType));
  }, []);

  const updateNestedField = useCallback((serviceType: string, parentField: string, subKey: string, value: number) => {
    setEditedConfigs(prev => {
      const current = prev[serviceType] || {};
      const parentObj = (current[parentField] as Record<string, unknown>) || {};
      return {
        ...prev,
        [serviceType]: {
          ...current,
          [parentField]: { ...parentObj, [subKey]: value },
        },
      };
    });
    setDirty(prev => new Set(prev).add(serviceType));
  }, []);

  const saveConfig = useCallback((serviceType: string) => {
    const config = editedConfigs[serviceType];
    if (!config) return;
    updateMutation.mutate({ serviceType, config });
    setDirty(prev => {
      const next = new Set(prev);
      next.delete(serviceType);
      return next;
    });
  }, [editedConfigs, updateMutation]);

  const saveAll = useCallback(() => {
    dirty.forEach(serviceType => {
      const config = editedConfigs[serviceType];
      if (config) {
        updateMutation.mutate({ serviceType, config });
      }
    });
  }, [dirty, editedConfigs, updateMutation]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const globalConfig = editedConfigs["global_settings"] || {};
  const serviceTypes = Object.keys(editedConfigs).filter(k => k !== "global_settings");

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-primary" />
              Pricing Editor
            </h1>
            <p className="text-muted-foreground mt-1">
              Adjust your pricing formulas and rates. Changes take effect immediately for new quotes.
            </p>
          </div>
          {dirty.size > 0 && (
            <Button onClick={saveAll} disabled={updateMutation.isPending} className="bg-primary text-white shrink-0">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save All Changes ({dirty.size})
            </Button>
          )}
        </div>

        {dirty.size > 0 && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>You have unsaved changes in {dirty.size} section{dirty.size > 1 ? "s" : ""}. Don't forget to save!</span>
          </div>
        )}

        <Tabs defaultValue="global" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="global" className="text-xs sm:text-sm">
              <MapPin className="w-3.5 h-3.5 mr-1" /> Global
            </TabsTrigger>
            {serviceTypes.map(st => {
              const meta = SERVICE_META[st];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <TabsTrigger key={st} value={st} className="text-xs sm:text-sm relative">
                  <Icon className="w-3.5 h-3.5 mr-1" />
                  <span className="hidden sm:inline">{meta.label}</span>
                  <span className="sm:hidden">{meta.label.split(" ")[0]}</span>
                  {dirty.has(st) && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* ─── Global Settings Tab ─────────────────────────────── */}
          <TabsContent value="global" className="mt-6">
            <GlobalSettingsEditor
              config={globalConfig}
              updateField={(field, value) => updateField("global_settings", field, value)}
              updateNestedField={(parent, sub, value) => updateNestedField("global_settings", parent, sub, value)}
              isDirty={dirty.has("global_settings")}
              onSave={() => saveConfig("global_settings")}
              isSaving={updateMutation.isPending}
            />
          </TabsContent>

          {/* ─── Service Tabs ────────────────────────────────────── */}
          {serviceTypes.map(st => {
            const meta = SERVICE_META[st];
            if (!meta) return null;
            return (
              <TabsContent key={st} value={st} className="mt-6">
                <ServiceEditor
                  serviceType={st}
                  meta={meta}
                  config={editedConfigs[st] || {}}
                  updateField={(field, value) => updateField(st, field, value)}
                  updateNestedField={(parent, sub, value) => updateNestedField(st, parent, sub, value)}
                  isDirty={dirty.has(st)}
                  onSave={() => saveConfig(st)}
                  isSaving={updateMutation.isPending}
                />
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// ─── Global Settings Editor ─────────────────────────────────────────

function GlobalSettingsEditor({
  config,
  updateField,
  updateNestedField,
  isDirty,
  onSave,
  isSaving,
}: {
  config: Record<string, unknown>;
  updateField: (field: string, value: unknown) => void;
  updateNestedField: (parent: string, sub: string, value: number) => void;
  isDirty: boolean;
  onSave: () => void;
  isSaving: boolean;
}) {
  const bundleDiscounts = (config.bundleDiscounts || {}) as Record<string, number>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Global Settings
            </CardTitle>
            <CardDescription>
              These settings apply across all services: job minimum, travel fees, and bundle discounts.
            </CardDescription>
          </div>
          <SaveButton isDirty={isDirty} onSave={onSave} isSaving={isSaving} />
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Job Minimum & Tax */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Pricing Basics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <PricingField
                meta={GLOBAL_FIELDS.jobMinimum}
                value={config.jobMinimum as number}
                onChange={v => updateField("jobMinimum", v)}
              />
              <PricingField
                meta={GLOBAL_FIELDS.taxRate}
                value={config.taxRate as number}
                onChange={v => updateField("taxRate", v)}
              />
            </div>
          </div>

          <Separator />

          {/* Travel Fees */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Travel Fees</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <PricingField
                meta={GLOBAL_FIELDS.travelRadius}
                value={config.travelRadius as number}
                onChange={v => updateField("travelRadius", v)}
              />
              <PricingField
                meta={GLOBAL_FIELDS.freeRadius}
                value={config.freeRadius as number}
                onChange={v => updateField("freeRadius", v)}
              />
              <PricingField
                meta={GLOBAL_FIELDS.travelFeePerMile}
                value={config.travelFeePerMile as number}
                onChange={v => updateField("travelFeePerMile", v)}
              />
            </div>
            <div className="mt-3 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                Customers within <strong>{config.freeRadius as number || 15} miles</strong> pay no travel fee.
                Beyond that, they're charged <strong>${config.travelFeePerMile as number || 3}/mile</strong>.
                Customers beyond <strong>{config.travelRadius as number || 40} miles</strong> are shown an "out of range" message.
                Travel fees are calculated but <strong>not shown</strong> to customers in the quote breakdown.
              </span>
            </div>
          </div>

          <Separator />

          {/* Bundle Discounts */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Bundle Discounts</h3>
            <p className="text-xs text-muted-foreground mb-4">Percentage discount when a customer bundles multiple services in one quote.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(BUNDLE_DISCOUNT_LABELS).map(([key, label]) => (
                <div key={key} className="bg-muted/30 rounded-xl p-4 text-center">
                  <Label className="text-xs text-muted-foreground block mb-2">{label}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="1"
                      min={0}
                      max={100}
                      value={bundleDiscounts[key] ?? ""}
                      onChange={e => updateNestedField("bundleDiscounts", key, Number(e.target.value) || 0)}
                      className="h-10 text-center text-lg font-bold pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Service Editor ─────────────────────────────────────────────────

function ServiceEditor({
  serviceType,
  meta,
  config,
  updateField,
  updateNestedField,
  isDirty,
  onSave,
  isSaving,
}: {
  serviceType: string;
  meta: ServiceMeta;
  config: Record<string, unknown>;
  updateField: (field: string, value: unknown) => void;
  updateNestedField: (parent: string, sub: string, value: number) => void;
  isDirty: boolean;
  onSave: () => void;
  isSaving: boolean;
}) {
  const Icon = meta.icon;
  const storyMultipliers = (config.storyMultipliers || {}) as Record<string, number>;
  const pitchMultipliers = (config.pitchMultipliers || {}) as Record<string, number>;
  const sizeTiers = (config.sizeTiers || {}) as Record<string, number>;

  // Calculate a sample price for the preview
  const samplePrice = useMemo(() => {
    const rate = (config.ratePerSqft || config.ratePerLinearFt || config.exteriorPerWindow || 0) as number;
    const min = (config.minPrice || 0) as number;
    if (serviceType === "window_cleaning") {
      return Math.max((config.exteriorPerWindow as number || 11) * 15, min);
    }
    if (serviceType === "gutter_cleaning") {
      const medFt = sizeTiers["M"] || 150;
      return Math.max(medFt * rate, min);
    }
    if (meta.hasSizeTiers) {
      const medSqft = sizeTiers["M"] || 200;
      return Math.max(medSqft * rate, min);
    }
    // House/roof: use 2000 sqft sample
    return Math.max(2000 * rate, min);
  }, [config, serviceType, meta, sizeTiers]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-primary" />
              {meta.label}
            </CardTitle>
            <CardDescription>{meta.description}</CardDescription>
          </div>
          <SaveButton isDirty={isDirty} onSave={onSave} isSaving={isSaving} />
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Core Rates */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Rates & Minimums</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(meta.fields).map(([key, fieldMeta]) => (
                <PricingField
                  key={key}
                  meta={fieldMeta}
                  value={config[key] as number}
                  onChange={v => updateField(key, v)}
                />
              ))}
            </div>
          </div>

          {/* Story Multipliers */}
          {meta.hasStoryMultipliers && Object.keys(storyMultipliers).length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Story Multipliers</h3>
                <p className="text-xs text-muted-foreground mb-4">Price is multiplied by this factor based on the number of stories. A value of 1.0 means no extra charge.</p>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(storyMultipliers).map(([key, val]) => (
                    <div key={key} className="bg-muted/30 rounded-xl p-4 text-center">
                      <Label className="text-xs text-muted-foreground block mb-2">{STORY_LABELS[key] || `${key}-Story`}</Label>
                      <Input
                        type="number"
                        step="0.05"
                        min={0.5}
                        max={5}
                        value={val ?? ""}
                        onChange={e => updateNestedField("storyMultipliers", key, Number(e.target.value) || 1)}
                        className="h-10 text-center text-lg font-bold"
                      />
                      <span className="text-[10px] text-muted-foreground mt-1 block">×{val} multiplier</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Pitch Multipliers */}
          {meta.hasPitchMultipliers && Object.keys(pitchMultipliers).length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Roof Pitch Multipliers</h3>
                <p className="text-xs text-muted-foreground mb-4">Price is multiplied by this factor based on roof steepness. Higher pitch = more difficult = higher multiplier.</p>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(pitchMultipliers).map(([key, val]) => (
                    <div key={key} className="bg-muted/30 rounded-xl p-4 text-center">
                      <Label className="text-xs text-muted-foreground block mb-2">{PITCH_LABELS[key] || key}</Label>
                      <Input
                        type="number"
                        step="0.05"
                        min={0.5}
                        max={5}
                        value={val ?? ""}
                        onChange={e => updateNestedField("pitchMultipliers", key, Number(e.target.value) || 1)}
                        className="h-10 text-center text-lg font-bold"
                      />
                      <span className="text-[10px] text-muted-foreground mt-1 block">×{val} multiplier</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Size Tiers */}
          {meta.hasSizeTiers && Object.keys(sizeTiers).length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Size Tiers</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  When a customer selects a size (Small, Medium, Large, etc.), it maps to this many {meta.sizeTierUnit || "sq ft"}.
                  The quote is calculated as: size tier value × rate.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {["S", "M", "L", "XL", "2XL"].map(key => {
                    if (sizeTiers[key] === undefined) return null;
                    const rate = (config.ratePerSqft || config.ratePerLinearFt || 0) as number;
                    const estimatedPrice = sizeTiers[key] * rate;
                    return (
                      <div key={key} className="bg-muted/30 rounded-xl p-4 text-center">
                        <Label className="text-xs text-muted-foreground block mb-1">{SIZE_LABELS[key]}</Label>
                        <Input
                          type="number"
                          step="10"
                          min={0}
                          value={sizeTiers[key] ?? ""}
                          onChange={e => updateNestedField("sizeTiers", key, Number(e.target.value) || 0)}
                          className="h-10 text-center text-lg font-bold"
                        />
                        <span className="text-[10px] text-muted-foreground mt-1 block">{meta.sizeTierUnit || "sq ft"}</span>
                        {rate > 0 && (
                          <Badge variant="secondary" className="mt-2 text-[10px]">
                            ≈ ${estimatedPrice.toFixed(0)}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Sample Price Preview */}
          <Separator />
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Sample Quote Preview</p>
              <p className="text-xs text-muted-foreground">
                {serviceType === "window_cleaning"
                  ? "15 windows, exterior only (Expert Essential)"
                  : serviceType === "gutter_cleaning"
                  ? "Medium size, 1-story"
                  : meta.hasSizeTiers
                  ? "Medium size selection"
                  : "2,000 sq ft, 1-story"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">${samplePrice.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">before bundle/travel</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Reusable Components ────────────────────────────────────────────

function PricingField({
  meta,
  value,
  onChange,
}: {
  meta: FieldMeta;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label className="text-sm font-medium flex items-center gap-1.5">
        {meta.label}
        {meta.unit && <span className="text-xs text-muted-foreground font-normal">({meta.unit})</span>}
      </Label>
      <Input
        type="number"
        step={meta.step || "any"}
        min={meta.min}
        value={value ?? ""}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className="h-9 mt-1"
      />
      <p className="text-[11px] text-muted-foreground mt-1">{meta.description}</p>
    </div>
  );
}

function SaveButton({ isDirty, onSave, isSaving }: { isDirty: boolean; onSave: () => void; isSaving: boolean }) {
  if (!isDirty) {
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        <CheckCircle2 className="w-3 h-3" /> Saved
      </Badge>
    );
  }
  return (
    <Button size="sm" onClick={onSave} disabled={isSaving} className="bg-primary text-white">
      {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
      Save
    </Button>
  );
}

// ─── useMemo import ─────────────────────────────────────────────────
import { useMemo } from "react";
