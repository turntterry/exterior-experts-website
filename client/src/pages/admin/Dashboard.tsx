import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { DollarSign, FileText, TrendingUp, Clock, Eye, ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-purple-100 text-purple-700",
  scheduled: "bg-green-100 text-green-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.admin.quotes.stats.useQuery();
  const { data: recentQuotes, isLoading: quotesLoading } = trpc.admin.quotes.list.useQuery({ limit: 5, offset: 0 });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your business activity.</p>
        </div>

        {/* Stats */}
        {statsLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Quotes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">${Number(stats.totalRevenue || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.new}</p>
                    <p className="text-xs text-muted-foreground">New Quotes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Quotes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Quotes</CardTitle>
            <Link href="/admin/quotes">
              <Button variant="ghost" size="sm">View All <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {quotesLoading ? (
              <div className="flex items-center justify-center h-20"><Loader2 className="w-5 h-5 animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-semibold">#</th>
                      <th className="text-left py-2 font-semibold">Customer</th>
                      <th className="text-right py-2 font-semibold">Total</th>
                      <th className="text-left py-2 font-semibold">Status</th>
                      <th className="text-left py-2 font-semibold">Date</th>
                      <th className="text-center py-2 font-semibold">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recentQuotes || []).map((q: any) => (
                      <tr key={q.id} className="border-b hover:bg-muted/30">
                        <td className="py-2">{q.id}</td>
                        <td className="py-2 font-medium">{q.customerName}</td>
                        <td className="py-2 text-right font-bold">${Number(q.totalPrice).toFixed(2)}</td>
                        <td className="py-2">
                          <Badge className={STATUS_COLORS[q.status] || "bg-gray-100 text-gray-700"}>{q.status}</Badge>
                        </td>
                        <td className="py-2 text-muted-foreground text-xs">{new Date(q.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 text-center">
                          <Link href={`/admin/quotes/${q.id}`}>
                            <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {(!recentQuotes || recentQuotes.length === 0) && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No quotes yet. They'll appear here when customers submit quotes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/pricing">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-bold">Manage Pricing</h3>
                <p className="text-xs text-muted-foreground mt-1">Adjust formulas & rates</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/gallery">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-bold">Gallery Manager</h3>
                <p className="text-xs text-muted-foreground mt-1">Upload before/after photos</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/contacts">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-bold">Contact Submissions</h3>
                <p className="text-xs text-muted-foreground mt-1">View & manage messages</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
