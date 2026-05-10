import { useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { useGetService, useCreateOrder, useListReviews, useGetFreelancer } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Star, Clock, CheckCircle, ArrowLeft, User, ShieldCheck } from "lucide-react";

export default function ServiceDetail() {
  const [, params] = useRoute("/services/:id");
  const id = Number(params?.id);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [orderDialog, setOrderDialog] = useState(false);
  const [requirements, setRequirements] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: service, isLoading } = useGetService(id, { query: { enabled: !!id } as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reviews } = useListReviews({ serviceId: id }, { query: { enabled: !!id } as any });

  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: (order) => {
        setOrderDialog(false);
        toast({ title: "Order placed!", description: "Payment held in escrow. Your freelancer has been notified." });
        setLocation("/dashboard/orders");
      },
      onError: () => {
        toast({ title: "Failed to place order", description: "Make sure you have enough ChainCoin.", variant: "destructive" });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-display text-white">Service not found</h2>
          <Link href="/marketplace"><Button className="mt-4">Back to Marketplace</Button></Link>
        </div>
      </div>
    );
  }

  const handleOrder = () => {
    if (!user) {
      setLocation("/login");
      return;
    }
    setOrderDialog(true);
  };

  const submitOrder = () => {
    if (!requirements.trim()) {
      toast({ title: "Requirements needed", description: "Please describe what you need.", variant: "destructive" });
      return;
    }
    createOrder.mutate({
      data: {
        serviceId: service.id,
        requirements,
      }
    });
  };

  return (
    <div className="min-h-screen mesh-bg text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-40 glass-card border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/marketplace">
            <div className="flex items-center gap-2 text-muted-foreground hover:text-white cursor-pointer transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Marketplace</span>
            </div>
          </Link>
          <Link href="/">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">CL</span>
              </div>
              <span className="font-display font-bold text-xl text-white">ChainLance</span>
            </div>
          </Link>
          {user ? (
            <Link href="/dashboard">
              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="outline" className="border-white/10">Sign In</Button>
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="rounded-2xl overflow-hidden h-72 bg-gradient-to-br from-purple-900/40 to-cyan-900/40 relative">
              {service.thumbnailUrl && (
                <img src={service.thumbnailUrl} alt={service.title} className="w-full h-full object-cover opacity-70" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-4 left-4 flex gap-2">
                <Badge className="bg-purple-600/80 text-white border-0 backdrop-blur-sm">{service.category}</Badge>
                {service.isFeatured && <Badge className="bg-yellow-500/80 text-black border-0 backdrop-blur-sm">⭐ Featured</Badge>}
              </div>
            </div>

            {/* Title & Tags */}
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">{service.title}</h1>
              <div className="flex flex-wrap gap-2">
                {service.tags?.map((tag) => (
                  <span key={tag} className="text-xs px-3 py-1 rounded-full bg-white/5 text-muted-foreground border border-white/10">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-lg font-display font-semibold text-white mb-3">About this service</h2>
              <p className="text-muted-foreground leading-relaxed">{service.description}</p>
            </div>

            {/* Reviews */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-lg font-display font-semibold text-white mb-4">
                Reviews ({reviews?.length || 0})
              </h2>
              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs text-white font-bold">
                          {r.reviewer?.username?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{r.reviewer?.username || "Anonymous"}</div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Order Card */}
            <div className="glass-card neon-border rounded-xl p-6 sticky top-24">
              <div className="text-3xl font-display font-bold text-purple-400 mb-1">
                ₡{Number(service.price).toFixed(0)}
              </div>
              <p className="text-xs text-muted-foreground mb-4">ChainCoin · Held in escrow until delivery</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span className="text-muted-foreground">{service.deliveryDays} day delivery</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-muted-foreground">{service.totalOrders} orders completed</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="h-4 w-4 text-purple-400" />
                  <span className="text-muted-foreground">Smart escrow protection</span>
                </div>
                {service.avgRating && (
                  <div className="flex items-center gap-3 text-sm">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-muted-foreground">{Number(service.avgRating).toFixed(1)} average rating</span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleOrder}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0"
              >
                Order Now
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                Your payment is held securely in escrow
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Dialog */}
      <Dialog open={orderDialog} onOpenChange={setOrderDialog}>
        <DialogContent className="bg-card border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Place Your Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="glass-card rounded-lg p-4">
              <div className="font-medium text-sm text-white">{service.title}</div>
              <div className="text-purple-400 font-bold mt-1">₡{Number(service.price).toFixed(0)}</div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-2">
                Describe your requirements *
              </label>
              <Textarea
                placeholder="What specifically do you need? Include any details, references, or special requirements..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="bg-muted/20 border-white/10 text-white placeholder:text-muted-foreground/50 min-h-[120px]"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-white/10" onClick={() => setOrderDialog(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0"
                onClick={submitOrder}
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? "Placing..." : "Confirm Order"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
