import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "stl-cookie-consent";

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] flex justify-center pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-lg rounded-2xl border border-white/20 p-5 shadow-2xl animate-in slide-in-from-bottom-5 duration-500"
        style={{
          background: "rgba(18, 18, 24, 0.75)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
        }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Cookie className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-white">We use cookies</h3>
              <button
                onClick={handleReject}
                className="text-white/40 hover:text-white/70 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-white/60 leading-relaxed mb-4">
              We use cookies to improve your experience, analyze site traffic, and personalize content.
              By clicking "Accept", you consent to our use of cookies.
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAccept}
                size="sm"
                className="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs px-4 hover:opacity-90 border-0"
              >
                Accept
              </Button>
              <Button
                onClick={handleReject}
                size="sm"
                variant="ghost"
                className="rounded-lg text-white/60 hover:text-white hover:bg-white/10 text-xs px-4"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
