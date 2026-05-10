import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetDashboardStats, useListOrders, useGetTopFreelancers, useListNotifications } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package, Wallet, Star, Bell, TrendingUp, Clock, CheckCircle } from "lucide-react";

const statusColor: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  in_progress: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  completed: "bg-green-500/20 text-green-300 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
  disputed: "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

export default function DashboardOverview() {
  const { user } = useAuth();
  const { data: stats } = useGetDashboardStats();
  const { data: orders } = useListOrders();
  const { data: topFreelancers } = useGetTopFreelancers();
  const { data: notifications } = useListNotifications();
  const unread = notifications?.filter((n) => !n.isRead) || [];
  const recentOrders = orders?.orders?.slice(0, 5) || [];

  const statCards = user?.role === "admin" ? [
    { label: "Total Revenue", value: `₡${Number(stats?.totalRevenue || 0).toLocaleString()}`, icon: <TrendingUp className="h-5 w-5 text-green-400" />, color: "text-green-400" },
    { label: "Active Orders", value: stats?.activeOrders || 0, icon: <Package className="h-5 w-5 text-cyan-400" />, color: "text-cyan-400" },
    { label: "Total Users", value: stats?.totalUsers || 0, icon: <Star className="h-5 w-5 text-purple-400" />, color: "text-purple-400" },
    { label: "Escrow Locked", value: `₡${Number(stats?.escrowLocked || 0).toLocaleString()}`, icon: <Wallet className="h-5 w-5 text-yellow-400" />, color: "text-yellow-400" },
  ] : [
    { label: "Active Orders", value: recentOrders.filter(o => o.status === "in_progress").length, icon: <Package className="h-5 w-5 text-cyan-400" />, color: "text-cyan-400" },
    { label: "Completed", value: recentOrders.filter(o => o.status === "completed").length, icon: <CheckCircle className="h-5 w-5 text-green-400" />, color: "text-green-400" },
    { label: "ChainCoin", value: `₡${Number(user?.chainCoinBalance || 0).toFixed(0)}`, icon: <Wallet className="h-5 w-5 text-purple-400" />, color: "text-purple-400" },
    { label: "Notifications", value: unread.length, icon: <Bell className="h-5 w-5 text-yellow-400" />, color: "text-yellow-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white">
          Welcome back, <span className="animated-gradient-text">{user?.username}</span> 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Here's what's happening in your ChainLance account.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              {s.icon}
            </div>
            <div className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-white">Recent Orders</h2>
            <Link href="/dashboard/orders">
              <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 text-xs">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-10">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground text-sm">No orders yet</p>
              <Link href="/marketplace">
                <Button size="sm" className="mt-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0">
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors border border-white/5">
                  <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">Order #{order.id}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-medium text-purple-400">₡{Number(order.amount).toFixed(0)}</span>
                    <Badge className={`text-xs border ${statusColor[order.status] || ""}`}>
                      {order.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Notifications */}
          <div className="glass-card rounded-xl p-5">
            <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-purple-400" /> Notifications
              {unread.length > 0 && (
                <Badge className="bg-purple-600 text-white border-0 text-xs">{unread.length}</Badge>
              )}
            </h2>
            {unread.length === 0 ? (
              <p className="text-muted-foreground text-xs">All caught up! 🎉</p>
            ) : (
              <div className="space-y-2">
                {unread.slice(0, 4).map((n) => (
                  <div key={n.id} className="p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/10">
                    <div className="text-xs font-medium text-white">{n.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Freelancers */}
          <div className="glass-card rounded-xl p-5">
            <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" /> Top Freelancers
            </h2>
            <div className="space-y-3">
              {(topFreelancers || []).slice(0, 4).map((f, i) => (
                <div key={f.id} className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground w-4 flex-shrink-0">#{i + 1}</div>
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                    {f.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{f.username}</div>
                    <div className="text-xs text-muted-foreground">{f.category}</div>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-muted-foreground">{f.avgRating ? Number(f.avgRating).toFixed(1) : "-"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
