import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetFeaturedServices } from "@workspace/api-client-react";
import { Shield, Zap, Coins, Star, ArrowRight, Code2, Gamepad2, Bot, Palette, Cpu, Globe } from "lucide-react";

const categories = [
  { icon: <Gamepad2 className="h-5 w-5" />, label: "FiveM Scripts", color: "text-purple-400" },
  { icon: <Code2 className="h-5 w-5" />, label: "Roblox Dev", color: "text-cyan-400" },
  { icon: <Cpu className="h-5 w-5" />, label: "Minecraft Plugins", color: "text-green-400" },
  { icon: <Bot className="h-5 w-5" />, label: "Discord Bots", color: "text-blue-400" },
  { icon: <Palette className="h-5 w-5" />, label: "UI Design", color: "text-pink-400" },
  { icon: <Globe className="h-5 w-5" />, label: "Web3 Dev", color: "text-yellow-400" },
];

const stats = [
  { value: "2,400+", label: "Active Freelancers" },
  { value: "18,000+", label: "Projects Completed" },
  { value: "₡4.2M", label: "ChainCoin Distributed" },
  { value: "99.3%", label: "Satisfaction Rate" },
];

const features = [
  {
    icon: <Shield className="h-6 w-6 text-purple-400" />,
    title: "Smart Escrow",
    desc: "Funds held securely on-chain. Released only when you're fully satisfied.",
  },
  {
    icon: <Coins className="h-6 w-6 text-cyan-400" />,
    title: "ChainCoin Wallet",
    desc: "Native cryptocurrency for instant, borderless payments with zero fees.",
  },
  {
    icon: <Zap className="h-6 w-6 text-yellow-400" />,
    title: "Instant Matching",
    desc: "AI-powered talent matching gets you the best developer in minutes.",
  },
  {
    icon: <Star className="h-6 w-6 text-green-400" />,
    title: "Verified Talent",
    desc: "Every freelancer is identity-verified and skill-tested before listing.",
  },
];

export default function Landing() {
  const { data: featured } = useGetFeaturedServices();

  return (
    <div className="min-h-screen mesh-bg text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">CL</span>
            </div>
            <span className="font-display font-bold text-xl text-white">ChainLance</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-purple-500/10 text-purple-300 border-purple-500/20 px-4 py-1">
            ✦ Web3-Powered Freelance Marketplace
          </Badge>
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6">
            Hire Elite{" "}
            <span className="animated-gradient-text">Game Developers</span>
            <br />
            Pay with ChainCoin
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            The premier marketplace for FiveM, Roblox, Minecraft, and Discord developers. 
            Smart escrow. Instant payments. Zero chargebacks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/marketplace">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0 px-8">
                Browse Marketplace <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="border-white/10 text-white hover:bg-white/5 px-8">
                Start Earning
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
            {stats.map((s) => (
              <div key={s.label} className="glass-card rounded-xl p-6">
                <div className="text-2xl md:text-3xl font-display font-bold text-white neon-text">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-2xl font-display font-semibold text-white mb-8">
            Explore Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((c) => (
              <Link href={`/marketplace?category=${encodeURIComponent(c.label)}`} key={c.label}>
                <div className="glass-card rounded-xl p-4 text-center cursor-pointer hover:neon-border transition-all group">
                  <div className={`flex justify-center mb-2 ${c.color} group-hover:scale-110 transition-transform`}>
                    {c.icon}
                  </div>
                  <div className="text-xs text-muted-foreground group-hover:text-white transition-colors">{c.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services */}
      {featured && featured.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-display font-bold text-white">
                Featured <span className="animated-gradient-text">Services</span>
              </h2>
              <Link href="/marketplace">
                <Button variant="ghost" className="text-purple-400 hover:text-purple-300">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.slice(0, 6).map((service) => (
                <Link href={`/services/${service.id}`} key={service.id}>
                  <div className="glass-card rounded-xl overflow-hidden cursor-pointer hover:neon-border transition-all group">
                    <div className="h-40 bg-gradient-to-br from-purple-900/40 to-cyan-900/40 relative overflow-hidden">
                      {service.thumbnailUrl && (
                        <img
                          src={service.thumbnailUrl}
                          alt={service.title}
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                        />
                      )}
                      <Badge className="absolute top-3 left-3 bg-purple-600/80 text-white border-0 text-xs">
                        {service.category}
                      </Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {service.title}
                      </h3>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-muted-foreground">
                            {service.avgRating ? Number(service.avgRating).toFixed(1) : "New"} · {service.totalOrders} orders
                          </span>
                        </div>
                        <div className="text-purple-400 font-bold text-sm">
                          ₡{Number(service.price).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Built for the <span className="animated-gradient-text">Web3 Era</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Every feature designed to protect your work and your money.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="glass-card rounded-xl p-6">
                <div className="mb-4">{f.icon}</div>
                <h3 className="font-display font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card neon-border rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Ready to join the future of freelancing?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of game developers already earning on ChainLance.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0 px-10">
                Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">CL</span>
            </div>
            <span className="font-display font-semibold text-white">ChainLance</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 ChainLance. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
