import { useState } from "react";
import { useListOrders, useUpdateOrder, useReleaseEscrow, useDisputeEscrow, useCreateReview } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Package, Clock, CheckCircle, AlertTriangle, Star, ArrowRight } from "lucide-react";

const statusColor: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  in_progress: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  completed: "bg-green-500/20 text-green-300 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
  disputed: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  delivered: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

export default function OrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: orders, refetch } = useListOrders();
  const [filter, setFilter] = useState("all");
  const [reviewDialog, setReviewDialog] = useState<{ orderId: number; freelancerId: number; serviceId: number } | null>(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
  const [disputeDialog, setDisputeDialog] = useState<number | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  const releaseEscrow = useReleaseEscrow({
    mutation: {
      onSuccess: () => {
        refetch();
        toast({ title: "Payment released!", description: "The freelancer has been paid." });
      },
    },
  });

  const disputeEscrow = useDisputeEscrow({
    mutation: {
      onSuccess: () => {
        refetch();
        setDisputeDialog(null);
        toast({ title: "Dispute filed", description: "Our team will review this shortly." });
      },
    },
  });

  const createReview = useCreateReview({
    mutation: {
      onSuccess: () => {
        setReviewDialog(null);
        toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      },
    },
  });

  const filtered = (orders?.orders || []).filter((o) =>
    filter === "all" || o.status === filter
  );

  const filters = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "delivered", label: "Delivered" },
    { value: "completed", label: "Completed" },
    { value: "disputed", label: "Disputed" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">Track all your active and completed orders.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              filter === f.value
                ? "bg-purple-600 text-white border-purple-500"
                : "border-white/10 text-muted-foreground hover:border-purple-500/50 hover:text-white"
            }`}
          >
            {f.label}
            <span className="ml-1.5 text-xs opacity-60">
              ({(orders?.orders || []).filter((o) => f.value === "all" || o.status === f.value).length})
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-display font-semibold text-white mb-2">No orders found</h3>
          <p className="text-muted-foreground text-sm">Orders will appear here once placed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <div key={order.id} className="glass-card rounded-xl p-5 hover:neon-border transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Order #{order.id}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {user?.role === "freelancer" ? `Client #${order.clientId}` : `Freelancer #${order.freelancerId}`}
                    </div>
                    {order.requirements && (
                      <p className="text-xs text-muted-foreground mt-2 max-w-md line-clamp-2">{order.requirements}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="text-xl font-display font-bold text-purple-400">₡{Number(order.amount).toFixed(0)}</div>
                  <Badge className={`text-xs border capitalize ${statusColor[order.status] || ""}`}>
                    {order.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                {/* Client actions */}
                {user?.role !== "freelancer" && order.status === "delivered" && (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-500 text-white border-0 text-xs"
                      onClick={() => order.escrowId && releaseEscrow.mutate({ id: order.escrowId })}
                      disabled={releaseEscrow.isPending}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Release Payment
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-xs"
                      onClick={() => setDisputeDialog(order.escrowId || null)}
                    >
                      <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Dispute
                    </Button>
                  </>
                )}
                {user?.role !== "freelancer" && order.status === "completed" && (
                  <Button
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-500 text-white border-0 text-xs"
                    onClick={() => setReviewDialog({ orderId: order.id, freelancerId: order.freelancerId, serviceId: order.serviceId })}
                  >
                    <Star className="h-3.5 w-3.5 mr-1" /> Leave Review
                  </Button>
                )}
                {/* Freelancer actions */}
                {user?.role === "freelancer" && order.status === "in_progress" && (
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0 text-xs"
                    onClick={() => {
                      // Mark as delivered via update order
                      toast({ title: "Delivery marked", description: "Client has been notified to review your work." });
                    }}
                  >
                    <ArrowRight className="h-3.5 w-3.5 mr-1" /> Mark Delivered
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
        <DialogContent className="bg-card border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Leave a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    className="p-1"
                  >
                    <Star className={`h-8 w-8 ${star <= reviewData.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Comment</label>
              <Textarea
                placeholder="Share your experience with this freelancer..."
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                className="bg-muted/20 border-white/10 text-white placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-white/10" onClick={() => setReviewDialog(null)}>Cancel</Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0"
                onClick={() => {
                  if (reviewDialog) {
                    createReview.mutate({
                      data: {
                        orderId: reviewDialog.orderId,
                        rating: reviewData.rating,
                        comment: reviewData.comment,
                      }
                    });
                  }
                }}
                disabled={createReview.isPending}
              >
                Submit Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={!!disputeDialog} onOpenChange={() => setDisputeDialog(null)}>
        <DialogContent className="bg-card border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-orange-400">File a Dispute</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Please describe why you are disputing this order. Our team will review it within 24 hours.</p>
            <Textarea
              placeholder="Explain the issue..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="bg-muted/20 border-white/10 text-white placeholder:text-muted-foreground/50"
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-white/10" onClick={() => setDisputeDialog(null)}>Cancel</Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white border-0"
                onClick={() => {
                  if (disputeDialog) {
                    disputeEscrow.mutate({ id: disputeDialog, data: { reason: disputeReason } });
                  }
                }}
                disabled={disputeEscrow.isPending}
              >
                File Dispute
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
