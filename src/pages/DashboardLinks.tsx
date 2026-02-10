import { useState } from "react";
import { Link2, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { LinkCard } from "@/components/dashboard/LinkCard";
import { AddLinkModal } from "@/components/dashboard/AddLinkModal";
import { EditLinkModal } from "@/components/dashboard/EditLinkModal";
import { AutoShareLinks } from "@/components/dashboard/AutoShareLinks";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useLinks } from "@/hooks/useLinks";

const DashboardLinks = () => {
  const { toast } = useToast();
  const { 
    links, 
    loading, 
    addLink, 
    updateLink, 
    deleteLink, 
    toggleLink,
    reorderLinks 
  } = useLinks();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<{
    id: string;
    title: string;
    url: string;
    type: string;
  } | null>(null);

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
    const link = links.find((l) => l.id === id);
    if (link) {
      setEditingLink({
        id: link.id,
        title: link.title,
        url: link.url,
        type: link.type || "standard",
      });
    }
  };

  const handleSaveEdit = async (id: string, updates: { title: string; url: string; type: string }) => {
    try {
      await updateLink(id, updates);
      toast({
        title: "Link updated",
        description: "Your changes have been saved.",
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

  return (
    <div className="min-h-screen bg-muted">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">Links Management</h1>
              <p className="text-muted-foreground">Manage all your links in one place</p>
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="gradient-button text-primary-foreground hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Link
            </Button>
          </div>

          {/* Links List */}
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
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Link2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">No links yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first link to get started!
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

          {/* Auto-Share Section */}
          <div className="mt-10">
            <AutoShareLinks />
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddLinkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddLink}
      />

      <EditLinkModal
        isOpen={!!editingLink}
        onClose={() => setEditingLink(null)}
        onSave={handleSaveEdit}
        link={editingLink}
      />
    </div>
  );
};

export default DashboardLinks;
