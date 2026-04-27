import { useState, useEffect } from "react";
import { FlaskConical, Plus, Trash2, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLinks } from "@/hooks/useLinks";

interface LinkVariant {
  id: string;
  link_id: string;
  variant_name: string;
  title: string;
  url: string;
  impressions: number;
  clicks: number;
  is_active: boolean;
  created_at: string;
}

const DashboardABTesting = () => {
  const { toast } = useToast();
  const { links } = useLinks();
  const [variants, setVariants] = useState<LinkVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedLink, setSelectedLink] = useState("");
  const [variantTitle, setVariantTitle] = useState("");
  const [variantUrl, setVariantUrl] = useState("");

  useEffect(() => {
    fetchVariants();
  }, []);

  const fetchVariants = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("link_variants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVariants((data || []) as LinkVariant[]);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedLink || !variantTitle.trim() || !variantUrl.trim()) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("link_variants")
        .insert({
          link_id: selectedLink,
          variant_name: "B",
          title: variantTitle.trim(),
          url: variantUrl.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      setVariants((prev) => [data as LinkVariant, ...prev]);
      setSelectedLink("");
      setVariantTitle("");
      setVariantUrl("");
      setShowForm(false);
      toast({ title: "Variant created!", description: "Traffic will be split 50/50 between variants." });
    } catch {
      toast({ title: "Error", description: "Failed to create variant", variant: "destructive" });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("link_variants").update({ is_active: !isActive }).eq("id", id);
    if (!error) {
      setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, is_active: !isActive } : v)));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("link_variants").delete().eq("id", id);
    if (!error) {
      setVariants((prev) => prev.filter((v) => v.id !== id));
      toast({ title: "Variant deleted" });
    }
  };

  const ctr = (clicks: number, impressions: number) =>
    impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) + "%" : "0%";

  return (
    <div className="min-h-screen bg-muted liquid-glass-muted overflow-x-hidden">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 pb-8 pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
                <FlaskConical className="w-7 h-7 text-primary" />
                A/B Testing
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Test different titles and URLs to find what gets the most clicks.
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Test
            </Button>
          </div>

          {/* Create Form */}
          {showForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-base">Create A/B Test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Select a link to test</label>
                  <select
                    value={selectedLink}
                    onChange={(e) => {
                      setSelectedLink(e.target.value);
                      const link = links.find((l) => l.id === e.target.value);
                      if (link) {
                        setVariantTitle(link.title);
                        setVariantUrl(link.url);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Choose a link...</option>
                    {links.map((link) => (
                      <option key={link.id} value={link.id}>{link.title}</option>
                    ))}
                  </select>
                </div>

                {selectedLink && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">Original (A)</Badge>
                      <ArrowRight className="w-3 h-3" />
                      <Badge className="text-[10px] bg-primary/10 text-primary">Variant (B)</Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Variant B Title</label>
                      <input
                        type="text"
                        value={variantTitle}
                        onChange={(e) => setVariantTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Variant B URL</label>
                      <input
                        type="url"
                        value={variantUrl}
                        onChange={(e) => setVariantUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleCreate} disabled={!selectedLink}>Create Test</Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Tests */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => <div key={i} className="h-32 bg-background rounded-xl animate-pulse" />)}
            </div>
          ) : variants.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FlaskConical className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No A/B tests yet. Create one to optimize your link performance.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {variants.map((variant) => {
                const originalLink = links.find((l) => l.id === variant.link_id);
                const originalCtr = originalLink
                  ? ctr(originalLink.clicks || 0, (originalLink.clicks || 0) + variant.impressions)
                  : "N/A";
                const variantCtr = ctr(variant.clicks, variant.impressions);

                return (
                  <Card key={variant.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-sm">
                              {originalLink?.title || "Original"} vs {variant.title}
                            </h3>
                            <Badge variant={variant.is_active ? "default" : "secondary"} className="text-[10px]">
                              {variant.is_active ? "Running" : "Paused"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={variant.is_active}
                            onCheckedChange={() => handleToggle(variant.id, variant.is_active)}
                          />
                          <button
                            onClick={() => handleDelete(variant.id)}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Comparison bars */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-muted/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-[10px]">A - Original</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{originalLink?.title}</p>
                          <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-lg font-bold">{originalCtr}</span>
                            <span className="text-[10px] text-muted-foreground">CTR</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{originalLink?.clicks || 0} clicks</p>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="text-[10px] bg-primary/10 text-primary">B - Variant</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{variant.title}</p>
                          <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-lg font-bold">{variantCtr}</span>
                            <span className="text-[10px] text-muted-foreground">CTR</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{variant.clicks} clicks / {variant.impressions} views</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardABTesting;
