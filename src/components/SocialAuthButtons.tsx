import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QRCodeModal } from "@/components/QRCodeModal";
import { useToast } from "@/hooks/use-toast";

interface SocialAuthButtonsProps {
  type: "signup" | "login";
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

export const SocialAuthButtons = ({ type }: SocialAuthButtonsProps) => {
  const { toast } = useToast();
  const [showQRModal, setShowQRModal] = useState(false);

  const handleGoogleAuth = () => {
    toast({
      title: "Google Authentication",
      description: "Google OAuth requires backend setup. Enable Lovable Cloud to use this feature.",
    });
  };

  const handleAppleAuth = () => {
    toast({
      title: "Apple Authentication",
      description: "Apple OAuth requires backend setup. Enable Lovable Cloud to use this feature.",
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

      {/* Social Buttons */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleAuth}
          className="w-full py-6 text-base font-medium bg-background hover:bg-muted transition-all hover:shadow-md"
        >
          <GoogleIcon />
          <span className="ml-3">Continue with Google</span>
        </Button>

        <Button
          type="button"
          onClick={handleAppleAuth}
          className="w-full py-6 text-base font-medium bg-foreground text-background hover:bg-foreground/90 transition-all hover:shadow-md"
        >
          <AppleIcon />
          <span className="ml-3">Continue with Apple</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setShowQRModal(true)}
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
      </div>

      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        type={type}
      />
    </>
  );
};
