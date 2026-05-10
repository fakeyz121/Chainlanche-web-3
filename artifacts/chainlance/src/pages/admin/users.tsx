import { useState } from "react";
import { useListUsers, useSuspendUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, ShieldBan, ShieldCheck, Users, Star } from "lucide-react";

export default function AdminUsers() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { data: users, refetch } = useListUsers({
    role: roleFilter !== "all" ? roleFilter : undefined,
    search: search || undefined,
  });

  const suspendUser = useSuspendUser({
    mutation: {
      onSuccess: (_d, vars) => {
        refetch();
        toast({ title: `User ${vars.data.suspended ? "suspended" : "unsuspended"}.` });
      },
    },
  });

  const roleColors: Record<string, string> = {
    admin: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    freelancer: "bg-green-500/20 text-green-300 border-green-500/30",
    user: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">User Management</h1>
        <p className="text-muted-foreground text-sm mt-1">View and manage all platform users.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/20 border-white/10 text-white placeholder:text-muted-foreground/50"
          />
        </div>
        <div className="flex gap-2">
          {["all", "user", "freelancer", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                roleFilter === r
                  ? "bg-purple-600 text-white border-purple-500"
                  : "border-white/10 text-muted-foreground hover:border-purple-500/50 hover:text-white"
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        {["user", "freelancer", "admin"].map((r) => (
          <div key={r} className="glass-card rounded-xl p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-lg font-display font-bold text-white">
                {users?.users?.filter((u) => u.role === r).length || 0}
              </div>
              <div className="text-xs text-muted-foreground capitalize">{r}s</div>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">User</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Role</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Balance</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Trust</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Joined</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Status</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/3">
              {(users?.users || []).map((u) => (
                <tr key={u.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs text-white font-bold flex-shrink-0 overflow-hidden">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                        ) : (
                          u.username[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-white text-xs">{u.username}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs border ${roleColors[u.role] || ""}`}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-cyan-400 font-mono text-xs">₡{Number(u.chainCoinBalance).toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-muted-foreground">{u.trustScore ? Number(u.trustScore).toFixed(0) : "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs border ${
                      u.isSuspended
                        ? "bg-red-500/20 text-red-300 border-red-500/30"
                        : "bg-green-500/20 text-green-300 border-green-500/30"
                    }`}>
                      {u.isSuspended ? "Suspended" : "Active"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== "admin" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className={`text-xs h-7 ${
                          u.isSuspended
                            ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                            : "border-red-500/30 text-red-400 hover:bg-red-500/10"
                        }`}
                        onClick={() => suspendUser.mutate({ id: u.id, data: { suspended: !u.isSuspended } })}
                        disabled={suspendUser.isPending}
                      >
                        {u.isSuspended ? (
                          <><ShieldCheck className="h-3 w-3 mr-1" /> Restore</>
                        ) : (
                          <><ShieldBan className="h-3 w-3 mr-1" /> Suspend</>
                        )}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!users?.users || users.users.length === 0) && (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-sm">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
