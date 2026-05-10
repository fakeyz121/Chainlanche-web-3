import { useState } from "react";
import { Link, useSearch } from "wouter";
import { useListServices, useListFreelancers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Search, Filter, Link2, Coins } from "lucide-react";
import { useAuth } from "@/lib/auth";

const CATEGORIES = ["All", "FiveM Script", "Roblox Script", "Minecraft Plugin", "Discord Bot", "UI Design", "Web3 Dev"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

export default function Marketplace() {
  const { user } = useAuth();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(params.get("category") || "All");
  const [sort, setSort] = useState("newest");

  const { data: services, isLoading } = useListServices({
    category: category !== "All" ? category : undefined,
    search: query || undefined,
  });

  const sorted = [...(services?.services || [])].sort((a, b) => {
    if (sort === "price_asc") return Number(a.price) - Number(b.price);
    if (sort === "price_desc") return Number(b.price) - Number(a.price);
    if (sort === "rating") return (Number(b.avgRating) || 0) - (Number(a.avgRating) || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="min-h-screen mesh-bg text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-40 glass-card border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">CL</span>
              </div>
              <span className="font-display font-bold text-xl text-white">ChainLance</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Explore the <span className="animated-gradient-text">Marketplace</span>
          </h1>
          <p className="text-muted-foreground">Discover elite game developers ready to bring your vision to life.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-muted/20 border-white/10 text-white placeholder:text-muted-foreground/50"
            />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full lg:w-44 bg-muted/20 border-white/10 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                category === c
                  ? "bg-purple-600 text-white border-purple-500"
                  : "border-white/10 text-muted-foreground hover:border-purple-500/50 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
                <div className="h-40 bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-white/5 rounded" />
                  <div className="h-3 bg-white/5 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-display font-semibold text-white mb-2">No services found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{sorted.length} services found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sorted.map((service) => (
                <Link href={`/services/${service.id}`} key={service.id}>
                  <div className="glass-card rounded-xl overflow-hidden cursor-pointer hover:neon-border transition-all group h-full flex flex-col">
                    <div className="h-44 bg-gradient-to-br from-purple-900/40 to-cyan-900/40 relative overflow-hidden flex-shrink-0">
                      {service.thumbnailUrl && (
                        <img
                          src={service.thumbnailUrl}
                          alt={service.title}
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity group-hover:scale-105"
                        />
                      )}
                      <Badge className="absolute top-3 left-3 bg-purple-600/80 text-white border-0 text-xs backdrop-blur-sm">
                        {service.category}
                      </Badge>
                      {service.isFeatured && (
                        <Badge className="absolute top-3 right-3 bg-yellow-500/80 text-black border-0 text-xs backdrop-blur-sm">
                          ⭐ Featured
                        </Badge>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-semibold text-white line-clamp-2 group-hover:text-purple-300 transition-colors flex-1">
                        {service.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 mb-3">{service.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {service.tags?.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/5">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-muted-foreground">
                            {service.avgRating ? Number(service.avgRating).toFixed(1) : "New"}
                          </span>
                          <span className="text-xs text-muted-foreground/50">· {service.totalOrders} orders</span>
                        </div>
                        <div className="text-purple-400 font-bold font-display">
                          ₡{Number(service.price).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
