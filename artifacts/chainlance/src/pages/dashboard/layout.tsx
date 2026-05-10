import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useListNotifications } from "@workspace/api-client-react";
import {
  LayoutDashboard, Package, Wallet, MessageSquare, User, Code2,
  LogOut, Bell, ChevronRight, ShieldCheck, BarChart3, Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const clientNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/orders", icon: Package, label: "My Orders" },
  { href: "/dashboard/wallet", icon: Wallet, label: "Wallet" },
  { href: "/dashboard/messages", icon: MessageSquare, label: "Messages" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
];

const freelancerNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/orders", icon: Package, label: "Orders" },
  { href: "/dashboard/services", icon: Code2, label: "My Services" },
  { href: "/dashboard/wallet", icon: Wallet, label: "Wallet" },
  { href: "/dashboard/messages", icon: MessageSquare, label: "Messages" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
];

const adminNav = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/topups", icon: Wallet, label: "Top-ups" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { data: notifications } = useListNotifications();
  const unread = notifications?.filter((n) => !n.isRead).length || 0;

  if (!user) return null;

  const nav = user.role === "admin" ? adminNav : user.role === "freelancer" ? freelancerNav : clientNav;

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen mesh-bg flex">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 glass-card border-r border-white/5 flex flex-col fixed h-full z-30">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white text-sm font-bold">CL</span>
              </div>
              <div>
                <div className="font-display font-bold text-white leading-none">ChainLance</div>
                <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ href, icon: Icon, label }) => {
            const active = location === href || (href !== "/dashboard" && href !== "/admin" && location.startsWith(href));
            return (
              <Link href={href} key={href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer group ${
                  active
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}>
                  <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-purple-400" : "group-hover:text-white"}`} />
                  {label}
                  {label === "Messages" && unread > 0 && (
                    <Badge className="ml-auto bg-purple-600 text-white border-0 text-xs px-1.5 py-0.5 h-auto">
                      {unread}
                    </Badge>
                  )}
                  {active && <ChevronRight className="ml-auto h-3 w-3 text-purple-400" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User & Wallet */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="glass-card rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs text-muted-foreground">ChainCoin Balance</span>
            </div>
            <div className="text-lg font-display font-bold text-cyan-400">
              ₡{Number(user.chainCoinBalance).toFixed(2)}
            </div>
          </div>
          <div className="flex items-center gap-2 px-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user.username}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 min-h-screen">
        {/* Top bar */}
        <header className="glass-card border-b border-white/5 px-8 py-4 sticky top-0 z-20 flex items-center justify-between">
          <div>
            <h2 className="font-display font-semibold text-white">
              {nav.find((n) => n.href === location || (location.startsWith(n.href) && n.href !== "/dashboard" && n.href !== "/admin"))?.label || "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/marketplace">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white text-xs">
                Browse Marketplace
              </Button>
            </Link>
            <Link href="/dashboard/notifications">
              <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-purple-500 rounded-full" />
                )}
              </button>
            </Link>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
