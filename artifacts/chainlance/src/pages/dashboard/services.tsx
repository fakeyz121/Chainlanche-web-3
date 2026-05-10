import { useState } from "react";
import { useListServices, useCreateService, useUpdateService, useDeleteService } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Star, Package, Eye, EyeOff } from "lucide-react";

const CATEGORIES = ["FiveM Script", "Roblox Script", "Minecraft Plugin", "Discord Bot", "UI Design", "Web3 Dev", "Other"];

type ServiceForm = {
  title: string;
  description: string;
  category: string;
  price: string;
  deliveryDays: string;
  thumbnailUrl: string;
  tags: string[];
  tagInput: string;
};

const defaultForm: ServiceForm = {
  title: "", description: "", category: "FiveM Script",
  price: "", deliveryDays: "", thumbnailUrl: "", tags: [], tagInput: "",
};

export default function ServicesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: services, refetch } = useListServices();
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ServiceForm>(defaultForm);

  const myServices = services?.services?.filter((s) => s.freelancerId === user?.id) || [];

  const createService = useCreateService({
    mutation: {
      onSuccess: () => {
        setDialog(null);
        setForm(defaultForm);
        refetch();
        toast({ title: "Service created!", description: "Your service is now live on the marketplace." });
      },
      onError: () => {
        toast({ title: "Failed to create service", variant: "destructive" });
      },
    },
  });

  const updateService = useUpdateService({
    mutation: {
      onSuccess: () => {
        setDialog(null);
        setEditId(null);
        refetch();
        toast({ title: "Service updated!" });
      },
    },
  });

  const deleteService = useDeleteService({
    mutation: {
      onSuccess: () => {
        refetch();
        toast({ title: "Service deleted." });
      },
    },
  });

  const openEdit = (s: typeof myServices[0]) => {
    setEditId(s.id);
    setForm({
      title: s.title,
      description: s.description,
      category: s.category,
      price: String(s.price),
      deliveryDays: String(s.deliveryDays),
      thumbnailUrl: s.thumbnailUrl || "",
      tags: s.tags || [],
      tagInput: "",
    });
    setDialog("edit");
  };

  const addTag = () => {
    if (form.tagInput.trim() && !form.tags.includes(form.tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, form.tagInput.trim()], tagInput: "" });
    }
  };

  const handleSubmit = () => {
    const data = {
      title: form.title,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      deliveryDays: Number(form.deliveryDays),
      thumbnailUrl: form.thumbnailUrl || undefined,
      tags: form.tags,
    };
    if (dialog === "create") {
      createService.mutate({ data });
    } else if (editId) {
      updateService.mutate({ id: editId, data });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">My Services</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage your service listings.</p>
        </div>
        <Button
          className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0"
          onClick={() => { setForm(defaultForm); setDialog("create"); }}
        >
          <Plus className="h-4 w-4 mr-2" /> New Service
        </Button>
      </div>

      {myServices.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-display font-semibold text-white mb-2">No services yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Create your first service to start getting orders.</p>
          <Button
            className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0"
            onClick={() => { setForm(defaultForm); setDialog("create"); }}
          >
            <Plus className="h-4 w-4 mr-2" /> Create Service
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {myServices.map((service) => (
            <div key={service.id} className="glass-card rounded-xl overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-purple-900/40 to-cyan-900/40 relative overflow-hidden">
                {service.thumbnailUrl && (
                  <img src={service.thumbnailUrl} alt={service.title} className="w-full h-full object-cover opacity-60" />
                )}
                <Badge className="absolute top-2 left-2 bg-purple-600/80 text-white border-0 text-xs">{service.category}</Badge>
                <Badge className={`absolute top-2 right-2 border-0 text-xs ${
                  service.status === "active" ? "bg-green-600/80 text-white" : "bg-gray-600/80 text-gray-300"
                }`}>
                  {service.status === "active" ? <Eye className="h-3 w-3 mr-1 inline" /> : <EyeOff className="h-3 w-3 mr-1 inline" />}
                  {service.status}
                </Badge>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white line-clamp-1">{service.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      {service.avgRating ? Number(service.avgRating).toFixed(1) : "New"}
                    </span>
                    <span>{service.totalOrders} orders</span>
                  </div>
                  <span className="text-purple-400 font-bold font-display">₡{Number(service.price).toFixed(0)}</span>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-white/10 text-xs"
                    onClick={() => openEdit(service)}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                    onClick={() => deleteService.mutate({ id: service.id })}
                    disabled={deleteService.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="bg-card border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{dialog === "create" ? "Create New Service" : "Edit Service"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Title *</label>
              <Input
                placeholder="E.g. Custom FiveM Economy System"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-muted/20 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Description *</label>
              <Textarea
                placeholder="Describe what you offer, what's included, and any requirements..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-muted/20 border-white/10 text-white min-h-[100px]"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, category: c })}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                      form.category === c ? "border-purple-500 bg-purple-500/10 text-purple-300" : "border-white/10 text-muted-foreground hover:border-white/20"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Price (₡) *</label>
                <Input
                  type="number"
                  placeholder="99"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="bg-muted/20 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Delivery (days) *</label>
                <Input
                  type="number"
                  placeholder="5"
                  value={form.deliveryDays}
                  onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })}
                  className="bg-muted/20 border-white/10 text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Thumbnail URL</label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={form.thumbnailUrl}
                onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                className="bg-muted/20 border-white/10 text-white text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tags</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="e.g. ESX, FiveM..."
                  value={form.tagInput}
                  onChange={(e) => setForm({ ...form, tagInput: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  className="bg-muted/20 border-white/10 text-white text-sm"
                />
                <Button size="sm" variant="outline" className="border-white/10" onClick={addTag}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.tags.map((t) => (
                  <Badge key={t} className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs flex items-center gap-1">
                    {t}
                    <button onClick={() => setForm({ ...form, tags: form.tags.filter((x) => x !== t) })}>×</button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 border-white/10" onClick={() => setDialog(null)}>Cancel</Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0"
                onClick={handleSubmit}
                disabled={createService.isPending || updateService.isPending}
              >
                {dialog === "create" ? "Create Service" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
