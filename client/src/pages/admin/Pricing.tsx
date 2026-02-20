import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Pricing() {
  const { data: configs, isLoading, refetch } = trpc.admin.pricing.list.useQuery();
  const updateMutation = trpc.admin.pricing.update.useMutation({
    onSuccess: () => { toast.success("Pricing updated!"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const [editedConfigs, setEditedConfigs] = useState<Record<string, Record<string, unknown>>>({});

  useEffect(() => {
    if (configs) {
      const map: Record<string, Record<string, unknown>> = {};
      configs.forEach((c: any) => {
        map[c.serviceType] = c.config as Record<string, unknown>;
      });
      setEditedConfigs(map);
    }
  }, [configs]);

  const updateField = (serviceType: string, field: string, value: unknown) => {
    setEditedConfigs(prev => ({
      ...prev,
      [serviceType]: { ...prev[serviceType], [field]: value },
    }));
  };

  const saveConfig = (serviceType: string) => {
    const config = editedConfigs[serviceType];
    if (!config) return;
    updateMutation.mutate({ serviceType, config });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const serviceLabels: Record<string, string> = {
    global_settings: "Global Settings",
    house_washing: "House Washing",
    window_cleaning: "Window Cleaning",
    gutter_cleaning: "Gutter Cleaning",
    driveway_cleaning: "Driveway / Concrete",
    roof_cleaning: "Roof Cleaning",
    deck_cleaning: "Deck / Fence",
    patio_cleaning: "Patio Cleaning",
    walkway_cleaning: "Walkway Cleaning",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pricing Configuration</h1>
          <p className="text-muted-foreground">Adjust your pricing formulas and rates. Changes take effect immediately for new quotes.</p>
        </div>

        {Object.entries(editedConfigs).map(([serviceType, config]) => (
          <Card key={serviceType}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{serviceLabels[serviceType] || serviceType}</CardTitle>
              <Button
                size="sm"
                onClick={() => saveConfig(serviceType)}
                disabled={updateMutation.isPending}
                className="bg-primary text-white"
              >
                <Save className="w-4 h-4 mr-1" /> Save
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(config).map(([key, value]) => {
                  if (typeof value === "object" && value !== null) {
                    return (
                      <div key={key} className="col-span-full">
                        <Label className="text-sm font-semibold capitalize mb-2 block">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 bg-muted/50 p-3 rounded-lg">
                          {Object.entries(value as Record<string, unknown>).map(([subKey, subVal]) => (
                            <div key={subKey}>
                              <Label className="text-xs text-muted-foreground">{subKey}</Label>
                              <Input
                                type="number"
                                step="any"
                                value={String(subVal || "")}
                                onChange={e => {
                                  const newObj = { ...(config[key] as Record<string, unknown>), [subKey]: Number(e.target.value) || 0 };
                                  updateField(serviceType, key, newObj);
                                }}
                                className="h-8 text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={key}>
                      <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</Label>
                      <Input
                        type={typeof value === "number" ? "number" : "text"}
                        step="any"
                        value={String(value || "")}
                        onChange={e => {
                          const val = typeof value === "number" ? (Number(e.target.value) || 0) : e.target.value;
                          updateField(serviceType, key, val);
                        }}
                        className="h-9"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
