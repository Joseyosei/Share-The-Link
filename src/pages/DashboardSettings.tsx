import { Sidebar } from "@/components/dashboard/Sidebar";
import { Settings, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const DashboardSettings = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          </div>

          <div className="bg-card rounded-2xl p-12 text-center shadow-lg">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Settings className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Coming Soon!</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Account settings, notifications, and preferences will be available here soon.
            </p>
            <Button asChild className="gradient-button text-primary-foreground">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardSettings;
