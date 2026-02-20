import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { DollarSign, FileText, TrendingUp, Clock, Eye, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  viewed: "bg-yellow-100 text-yellow-700",
  contacted: "bg-purple-100 text-purple-700",
  scheduled: "bg-green-100 text-green-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Quotes() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: quotes, isLoading } = trpc.admin.quotes.list.useQuery({
    limit: 100,
    offset: 0,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const { data: stats } = trpc.admin.quotes.stats.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Quote Management</h1>
          <p className="text-muted-foreground">View and manage all incoming quote requests.</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Quotes</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${Number(stats.totalRevenue || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.new}</p>
                  <p className="text-xs text-muted-foreground">New Quotes</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${Number(stats.totalRevenue && stats.total ? stats.totalRevenue / stats.total : 0).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Avg Quote</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quotes Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">#</th>
                      <th className="text-left p-3 font-semibold">Customer</th>
                      <th className="text-left p-3 font-semibold">Address</th>
                      <th className="text-left p-3 font-semibold">Services</th>
                      <th className="text-right p-3 font-semibold">Total</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                      <th className="text-center p-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(quotes || []).map((q: any) => (
                      <tr key={q.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">{q.id}</td>
                        <td className="p-3">
                          <p className="font-medium">{q.customerName}</p>
                          <p className="text-xs text-muted-foreground">{q.customerPhone}</p>
                        </td>
                        <td className="p-3 text-muted-foreground max-w-[200px] truncate">{q.address}</td>
                        <td className="p-3 text-muted-foreground">{q.serviceCount || "-"}</td>
                        <td className="p-3 text-right font-bold">${Number(q.totalPrice).toFixed(2)}</td>
                        <td className="p-3">
                          <Badge className={STATUS_COLORS[q.status] || "bg-gray-100 text-gray-700"}>
                            {q.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">{new Date(q.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 text-center">
                          <Link href={`/admin/quotes/${q.id}`}>
                            <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {(!quotes || quotes.length === 0) && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                          No quotes found. They'll appear here when customers submit quotes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
