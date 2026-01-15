import { useState, useEffect } from "react";
import { X, Smartphone, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "signup" | "login";
}

export const QRCodeModal = ({ isOpen, onClose, type }: QRCodeModalProps) => {
  const [sessionId, setSessionId] = useState("");
  const [countdown, setCountdown] = useState(30);

  const generateSessionId = () => {
    const id = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    setSessionId(id);
    setCountdown(30);
  };

  useEffect(() => {
    if (isOpen) {
      generateSessionId();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          generateSessionId();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const baseUrl = window.location.origin;
  const qrUrl = `${baseUrl}/${type}?session=${sessionId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary mx-auto mb-4 flex items-center justify-center">
            <Smartphone className="w-7 h-7 text-primary-foreground" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">
            Scan to {type === "signup" ? "Sign Up" : "Log In"}
          </h2>
          <p className="text-muted-foreground mb-6">
            Open your phone camera and scan this code
          </p>

          {/* QR Code */}
          <div className="bg-background p-4 rounded-xl inline-block mb-4">
            <QRCodeSVG
              value={qrUrl}
              size={200}
              level="H"
              includeMargin
              bgColor="transparent"
              fgColor="currentColor"
              className="text-foreground"
            />
          </div>

          {/* Countdown & Refresh */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
            <span>Refreshes in {countdown}s</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateSessionId}
              className="p-1 h-auto"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            This QR code will automatically refresh for security
          </p>
        </div>
      </div>
    </div>
  );
};
