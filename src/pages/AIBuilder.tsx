import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { AIPageBuilderWizard } from "@/components/ai-builder/AIPageBuilderComponents";
import { Wand2 } from "lucide-react";

const AIBuilder = () => {
  return (
    <div className="min-h-screen bg-muted">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 pb-8 pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
              <Wand2 className="w-4 h-4" />
              AI-Powered Design
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              AI Page Builder
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Describe your business and let AI create a professional page design in seconds
            </p>
          </div>

          {/* Wizard */}
          <AIPageBuilderWizard />
        </div>
      </main>
    </div>
  );
};

export default AIBuilder;
