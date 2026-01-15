import { useState } from "react";
import { Link2, MousePointerClick, ToggleRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LinkCard } from "@/components/dashboard/LinkCard";
import { AddLinkModal } from "@/components/dashboard/AddLinkModal";
import { ProfilePreview } from "@/components/dashboard/ProfilePreview";
import { useToast } from "@/hooks/use-toast";

interface LinkItem {
  id: string;
  title: string;
  url: string;
  type: string;
  clicks: number;
  isActive: boolean;
}

const Dashboard = () => {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const stats = {
    totalLinks: links.length,
    totalClicks: links.reduce((acc, link) => acc + link.clicks, 0),
    activeLinks: links.filter((link) => link.isActive).length,
  };

  const handleToggle = (id: string) => {
    setLinks((prev) =>
      prev.map((link) =>
        link.id === id ? { ...link, isActive: !link.isActive } : link
      )
    );
  };

  const handleEdit = (id: string) => {
    toast({
      title: "Edit link",
      description: "Edit functionality coming soon!",
    });
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

  return (
    <div className="min-h-screen bg-muted">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Welcome back, John! 👋
              </h1>
              <p className="text-muted-foreground">
                Here's what's happening with your links today.
              </p>
            </div>
            <Button asChild className="gradient-button text-primary-foreground hover:opacity-90">
              <a href="/johndoe" target="_blank" rel="noopener noreferrer">
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

              {/* Links Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">Your Links</h2>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className="gradient-button text-primary-foreground hover:opacity-90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Link
                  </Button>
                </div>

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
                      onClick={() => setIsModalOpen(true)}
                      className="gradient-button text-primary-foreground hover:opacity-90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Link
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Sidebar */}
            <div className="hidden lg:block">
              <ProfilePreview
                username="johndoe"
                fullName="John Doe"
                bio="Entrepreneur & Creator"
                links={links}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Add Link Modal */}
      <AddLinkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddLink}
      />
    </div>
  );
};

export default Dashboard;
