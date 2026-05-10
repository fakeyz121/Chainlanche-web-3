import { useState } from "react";
import { useGetWalletBalance, useListTransactions, useRequestTopup, useTransferCoins } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, Copy, TrendingUp, Zap } from "lucide-react";

const typeColor: Record<string, string> = {
  topup: "text-green-400",
  earning: "text-cyan-400",
  withdrawal: "text-red-400",
  escrow_lock: "text-yellow-400",
  escrow_release: "text-purple-400",
  transfer: "text-blue-400",
};

const NETWORKS = ["Solana", "Ethereum", "Polygon", "BNB Chain", "USDT (TRC20)"];

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: balance } = useGetWalletBalance();
  const { data: transactions, refetch } = useListTransactions();
  const [topupDialog, setTopupDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState(false);
  const [topupForm, setTopupForm] = useState({ amount: "", txHash: "", paymentMethod: "Solana", network: "mainnet" });
  const [transferForm, setTransferForm] = useState({ toUserId: "", amount: "" });

  const requestTopup = useRequestTopup({
    mutation: {
      onSuccess: () => {
        setTopupDialog(false);
        refetch();
        toast({ title: "Top-up request submitted!", description: "Admin will verify and approve within 24 hours." });
      },
      onError: () => {
        toast({ title: "Failed to submit", description: "Please check your transaction hash.", variant: "destructive" });
      },
    },
  });

  const transfer = useTransferCoins({
    mutation: {
      onSuccess: () => {
        setTransferDialog(false);
        refetch();
        toast({ title: "Transfer successful!", description: "ChainCoin sent successfully." });
      },
      onError: () => {
        toast({ title: "Transfer failed", description: "Check balance or recipient.", variant: "destructive" });
      },
    },
  });

  const totalEarned = transactions?.transactions?.filter(t => t.type === "earning" || t.type === "topup")
    .reduce((a, t) => a + Number(t.amount), 0) || 0;
  const totalSpent = transactions?.transactions?.filter(t => t.type === "escrow_lock" || t.type === "withdrawal")
    .reduce((a, t) => a + Number(t.amount), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">ChainCoin Wallet</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your ChainCoin balance and transactions.</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card neon-border rounded-xl p-6 md:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-muted-foreground">Available Balance</span>
          </div>
          <div className="text-4xl font-display font-bold text-cyan-400">
            ₡{Number(balance?.chainCoin ?? user?.chainCoinBalance ?? 0).toFixed(2)}
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0 text-xs"
              onClick={() => setTopupDialog(true)}
            >
              <ArrowDownLeft className="h-3.5 w-3.5 mr-1" /> Top Up
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-white/10 text-xs"
              onClick={() => setTransferDialog(true)}
            >
              <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> Transfer
            </Button>
          </div>
        </div>
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-xs text-muted-foreground">Total Received</span>
          </div>
          <div className="text-2xl font-display font-bold text-green-400">₡{totalEarned.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">Earnings + top-ups</div>
        </div>
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-muted-foreground">Total Spent</span>
          </div>
          <div className="text-2xl font-display font-bold text-purple-400">₡{totalSpent.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">Orders + withdrawals</div>
        </div>
      </div>

      {/* Transactions */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-display font-semibold text-white mb-5">Transaction History</h2>
        {!transactions?.transactions || transactions.transactions.length === 0 ? (
          <div className="text-center py-10">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/3 transition-colors border border-white/5">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  ["earning", "topup", "escrow_release"].includes(tx.type) ? "bg-green-500/10" : "bg-red-500/10"
                }`}>
                  {["earning", "topup", "escrow_release"].includes(tx.type) ? (
                    <ArrowDownLeft className="h-4 w-4 text-green-400" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white capitalize">{tx.type.replace("_", " ")}</div>
                  {tx.description && (
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{tx.description}</div>
                  )}
                  {tx.txHash && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">{tx.txHash}</span>
                      <button onClick={() => navigator.clipboard.writeText(tx.txHash || "")}>
                        <Copy className="h-3 w-3 text-muted-foreground hover:text-white" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className={`text-sm font-bold ${typeColor[tx.type] || "text-white"}`}>
                    {["earning", "topup", "escrow_release"].includes(tx.type) ? "+" : "-"}₡{Number(tx.amount).toFixed(2)}
                  </span>
                  <Badge className={`text-xs mt-1 border ${
                    tx.status === "completed" ? "bg-green-500/10 text-green-300 border-green-500/20" :
                    tx.status === "pending" ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/20" :
                    "bg-red-500/10 text-red-300 border-red-500/20"
                  }`}>
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top-up Dialog */}
      <Dialog open={topupDialog} onOpenChange={setTopupDialog}>
        <DialogContent className="bg-card border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Top Up ChainCoin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="glass-card rounded-lg p-4 text-sm text-muted-foreground">
              <p>Send crypto to our wallet address and submit the transaction hash below for admin verification.</p>
              <div className="mt-3 p-3 bg-white/5 rounded font-mono text-xs text-cyan-400 break-all">
                0x742d35Cc6634C0532925a3b8D4C9B7F2a3d6E8f1
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Amount (ChainCoin)</label>
              <Input
                type="number"
                placeholder="100"
                value={topupForm.amount}
                onChange={(e) => setTopupForm({ ...topupForm, amount: e.target.value })}
                className="bg-muted/20 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Transaction Hash</label>
              <Input
                placeholder="0x..."
                value={topupForm.txHash}
                onChange={(e) => setTopupForm({ ...topupForm, txHash: e.target.value })}
                className="bg-muted/20 border-white/10 text-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Payment Method</label>
              <div className="flex flex-wrap gap-2">
                {NETWORKS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setTopupForm({ ...topupForm, paymentMethod: n })}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                      topupForm.paymentMethod === n
                        ? "border-purple-500 bg-purple-500/10 text-purple-300"
                        : "border-white/10 text-muted-foreground hover:border-white/20"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-white/10" onClick={() => setTopupDialog(false)}>Cancel</Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0"
                onClick={() => requestTopup.mutate({ data: {
                  amount: Number(topupForm.amount),
                  txHash: topupForm.txHash,
                  paymentMethod: topupForm.paymentMethod,
                  network: topupForm.network,
                }})}
                disabled={requestTopup.isPending || !topupForm.amount || !topupForm.txHash}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
        <DialogContent className="bg-card border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Transfer ChainCoin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Recipient User ID</label>
              <Input
                type="number"
                placeholder="User ID"
                value={transferForm.toUserId}
                onChange={(e) => setTransferForm({ ...transferForm, toUserId: e.target.value })}
                className="bg-muted/20 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Amount (₡)</label>
              <Input
                type="number"
                placeholder="50"
                value={transferForm.amount}
                onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                className="bg-muted/20 border-white/10 text-white"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-white/10" onClick={() => setTransferDialog(false)}>Cancel</Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0"
                onClick={() => transfer.mutate({ data: {
                  toUserId: Number(transferForm.toUserId),
                  amount: Number(transferForm.amount),
                }})}
                disabled={transfer.isPending}
              >
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
