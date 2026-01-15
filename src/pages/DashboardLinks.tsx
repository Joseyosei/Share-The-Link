import { useState } from "react";
import { Link2, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { LinkCard } from "@/components/dashboard/LinkCard";
import { AddLinkModal } from "@/components/dashboard/AddLinkModal";
import { EditLinkModal } from "@/components/dashboard/EditLinkModal";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface LinkItem {
  id: string;
  title: string;
  url: string;
  type: string;
  clicks: number;
  isActive: boolean;
}

const DashboardLinks = () => {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([
    {
      id: "1",
      title: "My Portfolio",
      url: "https://myportfolio.com",
      type: "standard",
      clicks: 234,
      isActive: true,
    },
    {
      id: "2",
      title: "Buy My Course",
      url: "https://course.example.com",
      type: "product",
      clicks: 156,
      isActive: true,
    },
    {
      id: "3",
      title: "Watch My YouTube",
      url: "https://youtube.com/@example",
      type: "video",
      clicks: 89,
      isActive: true,
    },
  ]);

  const handleToggle = (id: string) => {
    setLinks((prev) =>
      prev.map((link) =>
        link.id === id ? { ...link, isActive: !link.isActive } : link
      )
    );
  };

  const handleEdit = (id: string) => {
    const link = links.find((l) => l.id === id);
    if (link) {
      setEditingLink(link);
    }
  };

  const handleSaveEdit = (updatedLink: { id: string; title: string; url: string; type: string }) => {
    setLinks((prev) =>
      prev.map((link) =>
        link.id === updatedLink.id
          ? { ...link, title: updatedLink.title, url: updatedLink.url, type: updatedLink.type }
          : link
      )
    );
    toast({
      title: "Link updated",
      description: "Your changes have been saved.",
    });
    setEditingLink(null);
  };

  const handleDelete = (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id));
    toast({
      title: "Link deleted",
      description: "The link has been removed from your profile.",
    });
  };

  const handleAddLink = (newLink: { title: string; url: string; type: string }) => {
    const link: LinkItem = {
      id: Date.now().toString(),
      ...newLink,
      clicks: 0,
      isActive: true,
    };
    setLinks((prev) => [...prev, link]);
    toast({
      title: "Link added!",
      description: "Your new link is now live on your profile.",
    });
  };

  const handleDragEnd = (draggedId: string, targetId: string) => {
    const draggedIndex = links.findIndex((l) => l.id === draggedId);
    const targetIndex = links.findIndex((l) => l.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newLinks = [...links];
    const [removed] = newLinks.splice(draggedIndex, 1);
    newLinks.splice(targetIndex, 0, removed);
    
    setLinks(newLinks);
    toast({
      title: "Links reordered",
      description: "Your link order has been updated.",
    });
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
          {links.length > 0 ? (
            <div className="space-y-3">
              {links.map((link) => (
                <LinkCard
                  key={link.id}
                  {...link}
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
        </div>
      </main>

      {/* Modals */}
      <AddLinkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddLink}
      />

      {editingLink && (
        <EditLinkModal
          isOpen={!!editingLink}
          onClose={() => setEditingLink(null)}
          onSave={handleSaveEdit}
          link={editingLink}
        />
      )}
    </div>
  );
};

export default DashboardLinks;
