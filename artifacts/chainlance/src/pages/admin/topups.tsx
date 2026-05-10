import { useListTopupRequests, useApproveTopup } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Copy, ExternalLink, Coins } from "lucide-react";

export default function AdminTopups() {
  const { toast } = useToast();
  const { data: requests, refetch } = useListTopupRequests({ status: undefined });

  const approve = useApproveTopup({
    mutation: {
      onSuccess: (_d, vars) => {
        refetch();
        toast({
          title: vars.data.status === "approved" ? "Top-up approved!" : "Top-up rejected",
          description: vars.data.status === "approved" ? "ChainCoin has been credited to the user." : "Request has been rejected.",
        });
      },
      onError: () => {
        toast({ title: "Action failed", variant: "destructive" });
      },
    },
  });

  const pendingCount = requests?.filter((r) => r.status === "pending").length || 0;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      approved: "bg-green-500/20 text-green-300 border-green-500/30",
      rejected: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    return map[status] || "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Top-up Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">Verify and approve ChainCoin top-up requests.</p>
        </div>
        {pendingCount > 0 && (
          <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-400" />
            <span className="text-sm text-white font-medium">{pendingCount} pending</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["all", "pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            className="px-4 py-1.5 rounded-full text-sm font-medium border border-white/10 text-muted-foreground hover:text-white transition-colors capitalize"
          >
            {s} ({requests?.filter((r) => s === "all" || r.status === s).length || 0})
          </button>
        ))}
      </div>

      {/* Requests */}
      {(!requests || requests.length === 0) ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-display font-semibold text-white mb-2">No requests yet</h3>
          <p className="text-muted-foreground text-sm">Top-up requests will appear here when users submit them.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className={`glass-card rounded-xl p-5 transition-all ${
              req.status === "pending" ? "neon-border" : ""
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <Coins className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">User #{req.userId}</span>
                      <Badge className={`text-xs border ${statusBadge(req.status)}`}>{req.status}</Badge>
                    </div>
                    <div className="text-2xl font-display font-bold text-cyan-400 mb-2">
                      ₡{Number(req.amount).toFixed(2)}
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white/60">Method:</span>
                        <span className="text-white">{req.paymentMethod}</span>
                        <span className="text-white/40">·</span>
                        <span>{req.network}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">TX Hash:</span>
                        <span className="font-mono text-cyan-400 truncate max-w-[240px]">{req.txHash}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(req.txHash)}
                          className="text-muted-foreground hover:text-white transition-colors"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <a
                          href={`https://solscan.io/tx/${req.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-cyan-400 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white/60">Submitted:</span>
                        <span>{new Date(req.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {req.status === "pending" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-500 text-white border-0 text-xs"
                      onClick={() => approve.mutate({ id: req.id, data: { status: "approved" } })}
                      disabled={approve.isPending}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                      onClick={() => approve.mutate({ id: req.id, data: { status: "rejected" } })}
                      disabled={approve.isPending}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
