import { useState } from "react";
import { Link2, MousePointerClick, ToggleRight, Plus, Radio, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LinkCard } from "@/components/dashboard/LinkCard";
import { AddLinkModal } from "@/components/dashboard/AddLinkModal";
import { EditLinkModal } from "@/components/dashboard/EditLinkModal";
import { ThemedProfilePreview } from "@/components/dashboard/ThemedProfilePreview";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useLinks } from "@/hooks/useLinks";
import { useAppearanceSettings } from "@/hooks/useAppearanceSettings";
import { useSubscription } from "@/hooks/useSubscription";
import { themes } from "@/pages/DashboardAppearance";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { toast } = useToast();
  const { profile, loading: profileLoading } = useUserProfile();
  const { 
    links, 
    loading: linksLoading, 
    stats, 
    addLink, 
    updateLink,
    deleteLink, 
    toggleLink 
  } = useLinks();
  const { settings: appearanceSettings } = useAppearanceSettings();
  const { subscription } = useSubscription();
  
  // Look up the user's selected theme
  const userTheme = themes.find((t) => t.id === appearanceSettings?.theme) || themes[0];
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<{ id: string; title: string; url: string; type: string } | null>(null);

  const handleToggle = async (id: string) => {
    try {
      await toggleLink(id);
    } catch (error) {
      console.error("Error toggling link:", error);
      toast({
        title: "Error",
        description: "Failed to toggle link status.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (id: string) => {
    const link = links.find(l => l.id === id);
    if (link) {
      setEditingLink({
        id: link.id,
        title: link.title,
        url: link.url,
        type: link.type || "standard",
      });
    }
  };

  const handleUpdateLink = async (id: string, updates: { title: string; url: string; type: string }) => {
    try {
      await updateLink(id, updates);
      toast({
        title: "Link updated!",
        description: "Your link has been updated successfully.",
      });
      setEditingLink(null);
    } catch (error) {
      console.error("Error updating link:", error);
      toast({
        title: "Error",
        description: "Failed to update link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLink(id);
      toast({
        title: "Link deleted",
        description: "The link has been removed from your profile.",
      });
    } catch (error) {
      console.error("Error deleting link:", error);
      toast({
        title: "Error",
        description: "Failed to delete link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddLink = async (newLink: { title: string; url: string; type: string }) => {
    try {
      await addLink({
        title: newLink.title,
        url: newLink.url,
        type: newLink.type,
      });
      toast({
        title: "Link added!",
        description: "Your new link is now live on your profile.",
      });
    } catch (error) {
      console.error("Error adding link:", error);
      toast({
        title: "Error",
        description: "Failed to add link. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get display name from profile
  const displayName = profile?.full_name || profile?.username || "there";
  const firstName = displayName.split(" ")[0];
  const username = profile?.username || "user";
  const bio = profile?.bio || "Entrepreneur & Creator";

  const loading = profileLoading || linksLoading;

  // Transform links for ProfilePreview
  const previewLinks = links.map(link => ({
    id: link.id,
    title: link.title,
    url: link.url,
    isActive: link.is_active ?? true,
  }));

  return (
    <div className="min-h-screen bg-muted">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              {loading ? (
                <>
                  <div className="h-8 w-64 bg-muted-foreground/20 rounded animate-pulse mb-2" />
                  <div className="h-5 w-80 bg-muted-foreground/10 rounded animate-pulse" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold text-foreground">
                      Welcome back, {firstName}!
                    </h1>
                    {subscription?.subscribed && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs border-0 px-2.5 py-1">
                        {subscription.tier?.toUpperCase() || "PRO"} Plan
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    Here's what's happening with your links today.
                  </p>
                </>
              )}
            </div>
            <Button asChild className="gradient-button text-primary-foreground hover:opacity-90">
              <a href={`/${username}`} target="_blank" rel="noopener noreferrer">
                View Profile
              </a>
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Stats */}
              <div className="grid sm:grid-cols-3 gap-4">
                <StatsCard
                  icon={Link2}
                  label="Total Links"
                  value={stats.totalLinks}
                />
                <StatsCard
                  icon={MousePointerClick}
                  label="Total Clicks"
                  value={stats.totalClicks}
                  change="12%"
                  positive
                />
                <StatsCard
                  icon={ToggleRight}
                  label="Active Links"
                  value={stats.activeLinks}
                />
              </div>

              {/* New Features Section */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Link to="/streaming">
                  <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20 hover:shadow-lg transition-all cursor-pointer h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
                          <Radio className="w-6 h-6 text-destructive" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold">Live Streaming</h3>
                            <Badge className="bg-destructive text-destructive-foreground text-[10px]">NEW</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Stream live to your audience and earn tips with 90/10 split
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <Link to="/ai-builder">
                  <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20 hover:shadow-lg transition-all cursor-pointer h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                          <Wand2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold">AI Page Builder</h3>
                            <Badge className="bg-primary/20 text-primary text-[10px]">NEW</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Describe your business, get a pro page in 30 seconds
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Links Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">Your Links</h2>
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="gradient-button text-primary-foreground hover:opacity-90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Link
                  </Button>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-card rounded-2xl p-4 shadow-lg animate-pulse">
                        <div className="h-6 bg-muted-foreground/20 rounded w-1/3 mb-2" />
                        <div className="h-4 bg-muted-foreground/10 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : links.length > 0 ? (
                  <div className="space-y-3">
                    {links.map((link) => (
                      <LinkCard
                        key={link.id}
                        id={link.id}
                        title={link.title}
                        url={link.url}
                        clicks={link.clicks || 0}
                        isActive={link.is_active ?? true}
                        onToggle={handleToggle}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-card rounded-2xl p-12 text-center shadow-lg">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                      <Link2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No links yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Create your first link to get started
                    </p>
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      className="gradient-button text-primary-foreground hover:opacity-90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Link
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Sidebar - reflects the user's selected theme */}
            <div className="hidden lg:block">
              <ThemedProfilePreview
                username={username}
                fullName={displayName}
                bio={bio}
                theme={userTheme}
                links={previewLinks}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Add Link Modal */}
      <AddLinkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddLink}
      />

      {/* Edit Link Modal */}
      <EditLinkModal
        isOpen={!!editingLink}
        onClose={() => setEditingLink(null)}
        onSave={handleUpdateLink}
        link={editingLink}
      />
    </div>
  );
};

export default Dashboard;
