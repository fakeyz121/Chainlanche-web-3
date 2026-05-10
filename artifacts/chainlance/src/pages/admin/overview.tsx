import { useGetDashboardStats, useGetTopFreelancers, useGetMarketplaceStats } from "@workspace/api-client-react";
import { TrendingUp, Users, Package, Wallet, ShieldAlert, Star, BarChart3, Coins } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminOverview() {
  const { data: stats } = useGetDashboardStats();
  const { data: topFreelancers } = useGetTopFreelancers();
  const { data: marketStats } = useGetMarketplaceStats();

  const cards = [
    { label: "Total Revenue", value: `₡${Number(stats?.totalRevenue || 0).toLocaleString()}`, icon: <TrendingUp className="h-5 w-5" />, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Total Users", value: stats?.totalUsers || 0, icon: <Users className="h-5 w-5" />, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Active Orders", value: stats?.activeOrders || 0, icon: <Package className="h-5 w-5" />, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Escrow Locked", value: `₡${Number(stats?.escrowLocked || 0).toLocaleString()}`, icon: <Wallet className="h-5 w-5" />, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Total Services", value: marketStats?.totalServices || 0, icon: <BarChart3 className="h-5 w-5" />, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Completed Orders", value: stats?.completedOrders || 0, icon: <Package className="h-5 w-5" />, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Pending Top-ups", value: stats?.pendingTopups || 0, icon: <ShieldAlert className="h-5 w-5" />, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "CC Circulation", value: `₡${Number(stats?.chainCoinCirculation || 0).toLocaleString()}`, icon: <Coins className="h-5 w-5" />, color: "text-pink-400", bg: "bg-pink-500/10" },
  ];

  const categoryBreakdown = marketStats?.categoryBreakdown || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform overview and key metrics.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="glass-card rounded-xl p-5">
            <div className={`h-9 w-9 rounded-lg ${c.bg} flex items-center justify-center mb-3 ${c.color}`}>
              {c.icon}
            </div>
            <div className={`text-2xl font-display font-bold ${c.color}`}>{c.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Freelancers */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="font-display font-semibold text-white mb-5 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" /> Top Performing Freelancers
          </h2>
          <div className="space-y-3">
            {(topFreelancers || []).map((f, i) => (
              <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/3 transition-colors">
                <div className={`text-xs font-bold w-5 flex-shrink-0 ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                  #{i + 1}
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                  {f.username?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{f.username || `Freelancer #${f.userId}`}</div>
                  <div className="text-xs text-muted-foreground">{f.category} · {f.completedOrders} orders</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-cyan-400">₡{Number(f.totalEarnings).toLocaleString()}</div>
                  <div className="flex items-center justify-end gap-0.5">
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-muted-foreground">{f.avgRating ? Number(f.avgRating).toFixed(1) : "—"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="font-display font-semibold text-white mb-5 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-400" /> Services by Category
          </h2>
          <div className="space-y-3">
            {categoryBreakdown
              .sort((a, b) => Number(b.count) - Number(a.count))
              .map((cat) => {
                const max = Math.max(...categoryBreakdown.map((c) => Number(c.count)), 1);
                const pct = (Number(cat.count) / max) * 100;
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{cat.category}</span>
                      <span className="text-white font-medium">{cat.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-display font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/topups">
            <Button className="bg-orange-600/20 text-orange-400 border border-orange-500/30 hover:bg-orange-600/30 text-sm">
              <ShieldAlert className="h-4 w-4 mr-2" /> Review Pending Top-ups
              {(stats?.pendingTopups || 0) > 0 && (
                <span className="ml-2 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {stats?.pendingTopups}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button className="bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 text-sm">
              <Users className="h-4 w-4 mr-2" /> Manage Users
            </Button>
          </Link>
          <Link href="/admin/analytics">
            <Button className="bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 text-sm">
              <BarChart3 className="h-4 w-4 mr-2" /> View Analytics
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
