/**
 * Product Shop Dashboard
 *
 * Simple product management for entrepreneurs and content creators.
 * Users can list products/services, manage them, and share their shop link.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { useToast } from "@/hooks/use-toast";
import { isBlockedText, isBlockedUrl } from "@/lib/content-moderation";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  Store, Plus, Edit2, Trash2, ExternalLink, Package, DollarSign,
  Image as ImageIcon, Link2, Copy, ToggleLeft, ToggleRight, Loader2,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  category: string;
  external_url: string | null;
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = [
  { value: "digital", label: "Digital Product" },
  { value: "physical", label: "Physical Product" },
  { value: "service", label: "Service" },
  { value: "course", label: "Course / Tutorial" },
  { value: "membership", label: "Membership" },
  { value: "other", label: "Other" },
];

const ConnectDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    category: "digital",
    external_url: "",
  });

  const fetchProducts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data, error } = await supabase
        .from("user_products")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[v0] Products fetch error:", error);
        toast({ title: "Error loading products", description: error.message, variant: "destructive" });
      } else {
        setProducts((data || []) as Product[]);
      }
    } catch (err) {
      console.error("[v0] Products fetch exception:", err);
      toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", image_url: "", category: "digital", external_url: "" });
    setEditingProduct(null);
  };

  const openAddModal = () => { resetForm(); setShowModal(true); };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: (product.price_cents / 100).toFixed(2),
      image_url: product.image_url || "",
      category: product.category,
      external_url: product.external_url || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // Content moderation
      if (isBlockedText(form.name) || isBlockedText(form.description)) {
        throw new Error("Product name or description contains content that violates our community guidelines. Adult content is not allowed.");
      }
      if (form.external_url && isBlockedUrl(form.external_url)) {
        throw new Error("Product URL points to a site that violates our community guidelines.");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const priceCents = Math.round(parseFloat(form.price || "0") * 100);
      const payload = {
        user_id: user.id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        price_cents: priceCents,
        image_url: form.image_url.trim() || null,
        category: form.category,
        external_url: form.external_url.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("user_products")
          .update(payload)
          .eq("id", editingProduct.id);
        if (error) {
          console.error("[v0] Product update error:", error);
          throw new Error(error.message || "Failed to update product");
        }
        toast({ title: "Product updated!" });
      } else {
        const { error } = await supabase
          .from("user_products")
          .insert(payload);
        if (error) {
          console.error("[v0] Product insert error:", error);
          throw new Error(error.message || "Failed to add product");
        }
        toast({ title: "Product added!" });
      }

      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to save.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("user_products").delete().eq("id", id);
    fetchProducts();
    toast({ title: "Product deleted" });
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    await supabase.from("user_products").update({ is_active: !currentActive }).eq("id", id);
    fetchProducts();
  };

  const shopUrl = profile?.username ? `${window.location.origin}/${profile.username}` : "";
  const activeProducts = products.filter((p) => p.is_active);
  const totalValue = products.reduce((sum, p) => sum + p.price_cents, 0);

  return (
    <div className="min-h-screen bg-muted">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Store className="w-6 h-6" />
                My Shop
              </h1>
              <p className="text-muted-foreground">
                List your products and services for your audience to discover
              </p>
            </div>
            <Button onClick={openAddModal} className="gradient-button text-primary-foreground hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>

          {/* Shop Link */}
          {profile?.username && (
            <Card>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Link2 className="w-5 h-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Your shop link</p>
                    <p className="font-mono text-sm truncate">{shopUrl}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { navigator.clipboard.writeText(shopUrl); toast({ title: "Link copied!" }); }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/${profile.username}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{products.length}</p>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeProducts.length}</p>
                  <p className="text-sm text-muted-foreground">Active Listings</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${(totalValue / 100).toFixed(0)}</p>
                  <p className="text-sm text-muted-foreground">Catalog Value</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Store className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                <p className="text-muted-foreground mb-6">
                  Add your first product to start selling to your audience
                </p>
                <Button onClick={openAddModal} className="gradient-button text-primary-foreground hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Product
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {products.map((product) => (
                <Card key={product.id} className={!product.is_active ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold truncate">{product.name}</h3>
                            <Badge variant="secondary" className="text-[10px] mt-1">
                              {CATEGORIES.find((c) => c.value === product.category)?.label || product.category}
                            </Badge>
                          </div>
                          <p className="font-bold text-primary whitespace-nowrap">
                            {product.price_cents > 0 ? `$${(product.price_cents / 100).toFixed(2)}` : "Free"}
                          </p>
                        </div>
                        {product.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                        )}
                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(product)}>
                            <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleToggle(product.id, product.is_active)}>
                            {product.is_active ? <ToggleRight className="w-4 h-4 mr-1 text-green-500" /> : <ToggleLeft className="w-4 h-4 mr-1" />}
                            {product.is_active ? "Active" : "Hidden"}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Product Modal */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) { setShowModal(false); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="My Awesome Product"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe your product..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="9.99"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Image URL</label>
              <Input
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Purchase / External Link</label>
              <Input
                value={form.external_url}
                onChange={(e) => setForm((f) => ({ ...f, external_url: e.target.value }))}
                placeholder="https://gumroad.com/l/my-product"
              />
              <p className="text-xs text-muted-foreground mt-1">Link where buyers can purchase (Gumroad, Shopify, etc.)</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button className="flex-1 gradient-button text-primary-foreground" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingProduct ? "Update" : "Add Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConnectDashboard;
