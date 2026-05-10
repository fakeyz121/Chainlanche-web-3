import { useGetRevenueAnalytics, useGetMarketplaceStats, useGetTopFreelancers } from "@workspace/api-client-react";
import { BarChart3, TrendingUp, Star, Coins, Package, Users } from "lucide-react";

export default function AdminAnalytics() {
  const { data: revenue } = useGetRevenueAnalytics({});
  const { data: marketStats } = useGetMarketplaceStats();
  const { data: topFreelancers } = useGetTopFreelancers();

  const maxRevenue = Math.max(...(revenue || []).map((r) => r.revenue), 1);
  const last7 = (revenue || []).slice(-7);
  const last7Revenue = last7.reduce((a, r) => a + r.revenue, 0);
  const last7Orders = last7.reduce((a, r) => a + r.orders, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform performance metrics and trends.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-xs text-muted-foreground">7-Day Revenue</span>
          </div>
          <div className="text-2xl font-display font-bold text-green-400">₡{last7Revenue.toLocaleString()}</div>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-muted-foreground">7-Day Orders</span>
          </div>
          <div className="text-2xl font-display font-bold text-cyan-400">{last7Orders}</div>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-muted-foreground">Total Freelancers</span>
          </div>
          <div className="text-2xl font-display font-bold text-purple-400">{marketStats?.totalFreelancers || 0}</div>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="h-4 w-4 text-yellow-400" />
            <span className="text-xs text-muted-foreground">Avg Order Value</span>
          </div>
          <div className="text-2xl font-display font-bold text-yellow-400">
            ₡{Number(marketStats?.avgOrderValue || 0).toFixed(0)}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-display font-semibold text-white mb-6 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-purple-400" /> 30-Day Revenue
        </h2>
        <div className="flex items-end gap-1 h-48">
          {(revenue || []).map((d) => {
            const height = (d.revenue / maxRevenue) * 100;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end group relative">
                <div
                  className="w-full bg-gradient-to-t from-purple-600 to-cyan-500 rounded-t opacity-70 group-hover:opacity-100 transition-opacity min-h-[2px]"
                  style={{ height: `${height}%` }}
                />
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-card border border-white/10 rounded px-2 py-1 text-xs text-white whitespace-nowrap z-10">
                  ₡{d.revenue.toLocaleString()} · {d.orders} orders
                  <br />
                  <span className="text-muted-foreground">{d.date}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{revenue?.[0]?.date}</span>
          <span>{revenue?.[revenue.length - 1]?.date}</span>
        </div>
      </div>

      {/* Top Freelancers Detailed */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-display font-semibold text-white mb-5 flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-400" /> Top Earning Freelancers
        </h2>
        <div className="space-y-3">
          {(topFreelancers || []).map((f, i) => {
            const maxEarnings = Math.max(...(topFreelancers || []).map((f) => f.totalEarnings), 1);
            const pct = (f.totalEarnings / maxEarnings) * 100;
            return (
              <div key={f.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-5">#{i + 1}</span>
                    <span className="text-white font-medium">{f.username || `Freelancer #${f.userId}`}</span>
                    <span className="text-muted-foreground">{f.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{f.completedOrders} orders</span>
                    <span className="text-cyan-400 font-bold">₡{Number(f.totalEarnings).toLocaleString()}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
