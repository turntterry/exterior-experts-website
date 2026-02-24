import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNoindex } from "@/hooks/useNoindex";

export default function QuoteDetail() {
  useNoindex();
  const [, params] = useRoute("/admin/quotes/:id");
  const quoteId = Number(params?.id);
  const { data: quote, isLoading, refetch } = trpc.admin.quotes.detail.useQuery({ id: quoteId }, { enabled: !!quoteId });
  const updateStatus = trpc.admin.quotes.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  if (!quote) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Quote not found</p>
          <Link href="/admin/quotes"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Quotes</Button></Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <Link href="/admin/quotes">
              <Button variant="ghost" size="sm" className="mb-2"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Quotes</Button>
            </Link>
            <h1 className="text-2xl font-bold">Quote #{quote.id}</h1>
            <p className="text-sm text-muted-foreground">Submitted {new Date(quote.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={quote.status} onValueChange={(v: string) => updateStatus.mutate({ id: quoteId, status: v as any })}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["new", "contacted", "scheduled", "completed", "cancelled"].map(s => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Customer</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="font-semibold text-lg">{quote.customerName}</p>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${quote.customerEmail}`} className="text-primary hover:underline">{quote.customerEmail}</a>
              </div>
              {quote.customerPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${quote.customerPhone}`} className="text-primary hover:underline">{quote.customerPhone}</a>
                </div>
              )}
              <Separator />
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>{quote.address}</span>
              </div>
              {quote.distanceMiles && (
                <p className="text-xs text-muted-foreground">{Number(quote.distanceMiles).toFixed(1)} miles from base</p>
              )}
              {quote.preferredDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{quote.preferredDate} {quote.preferredTime && `(${quote.preferredTime})`}</span>
                </div>
              )}
              {quote.referralSource && (
                <p className="text-xs text-muted-foreground">Referral: {quote.referralSource}</p>
              )}
            </CardContent>
          </Card>

          {/* Pricing Summary */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Total Quote</p>
                <p className="text-4xl font-bold text-primary">${Number(quote.totalPrice).toFixed(2)}</p>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${Number(quote.subtotal).toFixed(2)}</span>
                </div>
                {Number(quote.bundleDiscount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Bundle Discount</span>
                    <span>-${Number(quote.bundleDiscount).toFixed(2)}</span>
                  </div>
                )}
                {Number(quote.travelFee) > 0 && (
                  <div className="flex justify-between">
                    <span>Travel Fee</span>
                    <span>${Number(quote.travelFee).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Customer Photos</CardTitle></CardHeader>
            <CardContent>
              {quote.customerPhotos && (() => { try { const p = Array.isArray(quote.customerPhotos) ? quote.customerPhotos : JSON.parse(quote.customerPhotos as unknown as string); return p.length > 0; } catch { return false; } })() ? (
                <div className="grid grid-cols-2 gap-2">
                  {(Array.isArray(quote.customerPhotos) ? quote.customerPhotos : JSON.parse(quote.customerPhotos as unknown as string)).map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={url} alt={`Photo ${i + 1}`} className="w-full aspect-square object-cover rounded-lg hover:opacity-80 transition-opacity" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No photos uploaded</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Line Items */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Services Quoted</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-semibold">Service</th>
                    <th className="text-left py-2 font-semibold">Package</th>
                    <th className="text-left py-2 font-semibold">Details</th>
                    <th className="text-right py-2 font-semibold">Base</th>
                    <th className="text-right py-2 font-semibold">Final</th>
                  </tr>
                </thead>
                <tbody>
                  {(quote.items || []).map((item: any, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="py-3 font-medium">{item.serviceType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</td>
                      <td className="py-3">
                        <Badge variant="secondary">{item.packageTier || "Good"}</Badge>
                      </td>
                      <td className="py-3 text-muted-foreground max-w-xs truncate">{item.description}</td>
                      <td className="py-3 text-right">${Number(item.basePrice).toFixed(2)}</td>
                      <td className="py-3 text-right font-semibold">${Number(item.finalPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
