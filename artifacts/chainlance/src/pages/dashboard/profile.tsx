import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useUpdateUser, useCreateFreelancer, useGetFreelancer } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Star, Shield, Award, Code2, Plus, X } from "lucide-react";

const CATEGORIES = ["FiveM Script", "Roblox Script", "Minecraft Plugin", "Discord Bot", "UI Design", "Web3 Dev", "Other"];

export default function ProfilePage() {
  const { user, login, token } = useAuth();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [freelancerMode, setFreelancerMode] = useState(false);
  const [form, setForm] = useState({ username: user?.username || "", avatarUrl: user?.avatarUrl || "" });
  const [flForm, setFlForm] = useState({
    bio: "", category: "FiveM Script", skills: [] as string[], skillInput: "", hourlyRate: ""
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: freelancerProfile } = useGetFreelancer(user?.id || 0, {
    query: { enabled: !!user?.id && user.role === "freelancer" } as any
  });

  const updateUser = useUpdateUser({
    mutation: {
      onSuccess: (updated) => {
        if (token) login(token, updated);
        setEditMode(false);
        toast({ title: "Profile updated!" });
      },
    },
  });

  const createFreelancer = useCreateFreelancer({
    mutation: {
      onSuccess: () => {
        setFreelancerMode(false);
        toast({ title: "Freelancer profile created!", description: "You can now list your services." });
      },
      onError: () => {
        toast({ title: "Failed to create profile", variant: "destructive" });
      },
    },
  });

  const addSkill = () => {
    if (flForm.skillInput.trim() && !flForm.skills.includes(flForm.skillInput.trim())) {
      setFlForm({ ...flForm, skills: [...flForm.skills, flForm.skillInput.trim()], skillInput: "" });
    }
  };

  const removeSkill = (s: string) => {
    setFlForm({ ...flForm, skills: flForm.skills.filter((sk) => sk !== s) });
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account information.</p>
      </div>

      {/* Profile Card */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start gap-5">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-3xl text-white font-bold flex-shrink-0 overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                user.username[0].toUpperCase()
              )}
            </div>
            <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background flex items-center justify-center ${
              user.role === "admin" ? "bg-yellow-500" : user.role === "freelancer" ? "bg-green-500" : "bg-purple-500"
            }`}>
              {user.role === "admin" ? "★" : user.role === "freelancer" ? "✓" : "●"}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-display font-bold text-white">{user.username}</h2>
              <Badge className={`text-xs border ${
                user.role === "admin" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                user.role === "freelancer" ? "bg-green-500/20 text-green-300 border-green-500/30" :
                "bg-purple-500/20 text-purple-300 border-purple-500/30"
              }`}>
                {user.role}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-yellow-400" />
                <span>Level {user.level || 1}</span>
              </div>
              {user.trustScore && (
                <div className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-green-400" />
                  <span>Trust Score: {Number(user.trustScore).toFixed(1)}</span>
                </div>
              )}
              {user.walletAddress && (
                <div className="flex items-center gap-1 font-mono">
                  <Code2 className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-4)}</span>
                </div>
              )}
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="border-white/10 text-muted-foreground hover:text-white text-xs"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? "Cancel" : "Edit"}
          </Button>
        </div>

        {editMode && (
          <div className="mt-5 pt-5 border-t border-white/5 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Username</label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="bg-muted/20 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Avatar URL</label>
              <Input
                value={form.avatarUrl}
                onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                className="bg-muted/20 border-white/10 text-white"
                placeholder="https://..."
              />
            </div>
            <Button
              className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0"
              onClick={() => updateUser.mutate({ id: user.id, data: form })}
              disabled={updateUser.isPending}
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Freelancer Profile */}
      {user.role === "freelancer" && (
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" /> Freelancer Profile
            </h2>
            {!freelancerProfile && (
              <Button
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0 text-xs"
                onClick={() => setFreelancerMode(!freelancerMode)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Setup Profile
              </Button>
            )}
          </div>

          {freelancerProfile ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{freelancerProfile.bio}</p>
              <div className="flex flex-wrap gap-2">
                {freelancerProfile.skills?.map((skill) => (
                  <Badge key={skill} className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="glass-card rounded-lg p-3 text-center">
                  <div className="text-lg font-display font-bold text-white">{freelancerProfile.completedOrders}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="glass-card rounded-lg p-3 text-center">
                  <div className="text-lg font-display font-bold text-yellow-400">
                    {freelancerProfile.avgRating ? Number(freelancerProfile.avgRating).toFixed(1) : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Rating</div>
                </div>
                <div className="glass-card rounded-lg p-3 text-center">
                  <div className="text-lg font-display font-bold text-cyan-400">
                    ₡{Number(freelancerProfile.totalEarnings).toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Earned</div>
                </div>
              </div>
            </div>
          ) : freelancerMode ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Bio</label>
                <Textarea
                  placeholder="Describe your expertise and experience..."
                  value={flForm.bio}
                  onChange={(e) => setFlForm({ ...flForm, bio: e.target.value })}
                  className="bg-muted/20 border-white/10 text-white placeholder:text-muted-foreground/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Primary Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setFlForm({ ...flForm, category: c })}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                        flForm.category === c
                          ? "border-purple-500 bg-purple-500/10 text-purple-300"
                          : "border-white/10 text-muted-foreground hover:border-white/20"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Skills</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add a skill..."
                    value={flForm.skillInput}
                    onChange={(e) => setFlForm({ ...flForm, skillInput: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    className="bg-muted/20 border-white/10 text-white text-sm"
                  />
                  <Button size="sm" variant="outline" className="border-white/10" onClick={addSkill}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {flForm.skills.map((s) => (
                    <Badge key={s} className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs flex items-center gap-1">
                      {s}
                      <button onClick={() => removeSkill(s)}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Hourly Rate (₡)</label>
                <Input
                  type="number"
                  placeholder="75"
                  value={flForm.hourlyRate}
                  onChange={(e) => setFlForm({ ...flForm, hourlyRate: e.target.value })}
                  className="bg-muted/20 border-white/10 text-white"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-white/10" onClick={() => setFreelancerMode(false)}>Cancel</Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0"
                  onClick={() => createFreelancer.mutate({ data: {
                    bio: flForm.bio,
                    category: flForm.category,
                    skills: flForm.skills,
                    hourlyRate: Number(flForm.hourlyRate),
                  }})}
                  disabled={createFreelancer.isPending}
                >
                  Create Profile
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Set up your freelancer profile to start receiving orders.</p>
          )}
        </div>
      )}
    </div>
  );
}
