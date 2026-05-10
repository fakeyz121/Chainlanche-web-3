import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Mode = "login" | "register";
type Role = "user" | "freelancer";

export default function AuthPage({ mode: initialMode = "login" }: { mode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [role, setRole] = useState<Role>("user");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.user);
        setLocation(data.user.role === "admin" ? "/admin" : "/dashboard");
      },
      onError: () => {
        toast({ title: "Login failed", description: "Invalid email or password.", variant: "destructive" });
      },
    },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.user);
        setLocation("/dashboard");
        toast({ title: "Welcome to ChainLance!", description: "Your account has been created." });
      },
      onError: () => {
        toast({ title: "Registration failed", description: "Email may already be in use.", variant: "destructive" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      loginMutation.mutate({ data: { email: form.email, password: form.password } });
    } else {
      registerMutation.mutate({ data: { username: form.username, email: form.email, password: form.password, role } });
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-bold">CL</span>
              </div>
              <span className="font-display font-bold text-2xl text-white">ChainLance</span>
            </div>
          </Link>
          <h1 className="text-2xl font-display font-bold text-white">
            {mode === "login" ? "Welcome back" : "Join ChainLance"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "login" ? "Sign in to your account" : "Create your free account today"}
          </p>
        </div>

        <div className="glass-card neon-border rounded-2xl p-8">
          {/* Mode Toggle */}
          <div className="flex bg-muted/30 rounded-lg p-1 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "login" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "register" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 block">Username</Label>
                <Input
                  placeholder="cooldev_2026"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  className="bg-muted/20 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-purple-500"
                />
              </div>
            )}

            <div>
              <Label className="text-muted-foreground text-xs mb-1.5 block">Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="bg-muted/20 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-purple-500"
              />
            </div>

            <div>
              <Label className="text-muted-foreground text-xs mb-1.5 block">Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="bg-muted/20 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-purple-500"
              />
            </div>

            {mode === "register" && (
              <div>
                <Label className="text-muted-foreground text-xs mb-1.5 block">I want to</Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("user")}
                    className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all ${
                      role === "user"
                        ? "border-purple-500 bg-purple-500/10 text-purple-300"
                        : "border-white/10 text-muted-foreground hover:border-white/20"
                    }`}
                  >
                    🎮 Hire Talent
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("freelancer")}
                    className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all ${
                      role === "freelancer"
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                        : "border-white/10 text-muted-foreground hover:border-white/20"
                    }`}
                  >
                    💻 Get Hired
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 p-3 rounded-lg bg-muted/20 border border-white/5">
            <p className="text-xs text-muted-foreground text-center">Demo accounts (password: <span className="text-white font-mono">password123</span>)</p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { label: "Client", email: "alex@chainlance.io" },
                { label: "Freelancer", email: "marco@chainlance.io" },
                { label: "Admin", email: "admin@chainlance.io" },
              ].map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setForm({ username: "", email: d.email, password: "password123" });
                  }}
                  className="text-xs py-1.5 px-2 rounded bg-muted/20 border border-white/5 text-muted-foreground hover:text-white hover:border-purple-500/50 transition-all"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
