import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QRCodeModal } from "@/components/QRCodeModal";
import { useToast } from "@/hooks/use-toast";

interface SocialAuthButtonsProps {
  type: "signup" | "login";
}

export const SocialAuthButtons = ({ type }: SocialAuthButtonsProps) => {
  const { toast } = useToast();
  const [showQRModal, setShowQRModal] = useState(false);

  const handleQRClick = () => {
    toast({
      title: "Coming soon!",
      description: "QR code authentication will be available soon. Please use email signup for now.",
    });
  };

  return (
    <>
      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-card text-muted-foreground">OR</span>
        </div>
      </div>

      {/* QR Code Button Only */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleQRClick}
          className="w-full py-6 text-base font-medium bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 hover:from-primary/20 hover:to-secondary/20 transition-all hover:shadow-md"
        >
          <svg
            className="w-5 h-5 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span className="ml-3">
            {type === "signup" ? "Sign up" : "Log in"} with QR Code
          </span>
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          More login options coming soon!
        </p>
      </div>

      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        type={type}
      />
    </>
  );
};
