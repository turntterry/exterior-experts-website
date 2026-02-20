import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Mail, Phone, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  read: "bg-yellow-100 text-yellow-700",
  replied: "bg-green-100 text-green-700",
};

export default function Contacts() {
  const { data: contacts, isLoading, refetch } = trpc.admin.contacts.list.useQuery();
  const updateStatus = trpc.admin.contacts.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Contact Submissions</h1>
          <p className="text-muted-foreground">View and manage messages from your contact form.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-4">
            {(contacts || []).map((c: any) => (
              <Card key={c.id} className={c.status === "new" ? "border-primary/30 bg-primary/5" : ""}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">{c.name}</h3>
                        <Badge className={STATUS_COLORS[c.status] || "bg-gray-100 text-gray-700"}>{c.status}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          <a href={`mailto:${c.email}`} className="hover:text-primary">{c.email}</a>
                        </span>
                        {c.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            <a href={`tel:${c.phone}`} className="hover:text-primary">{c.phone}</a>
                          </span>
                        )}
                      </div>
                      {c.service && <p className="text-sm"><span className="font-medium">Service:</span> {c.service}</p>}
                      {c.address && <p className="text-sm"><span className="font-medium">Address:</span> {c.address}</p>}
                      {c.message && (
                        <div className="bg-muted/50 rounded-lg p-3 mt-2">
                          <p className="text-sm flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                            {c.message}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="shrink-0">
                      <Select value={c.status} onValueChange={(v: string) => updateStatus.mutate({ id: c.id, status: v as any })}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="read">Read</SelectItem>
                          <SelectItem value="replied">Replied</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!contacts || contacts.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No contact submissions yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
