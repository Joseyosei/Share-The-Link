import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface QRCodeWidgetProps {
  username: string;
  size?: "small" | "medium" | "large";
}

export const QRCodeWidget = ({ username, size = "medium" }: QRCodeWidgetProps) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const profileUrl = `${window.location.origin}/${username}`;

  const sizes = { small: 150, medium: 200, large: 280 };
  const qrSize = sizes[size];

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    canvas.width = 512;
    canvas.height = 512;
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${username}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "URL copied!", description: "Profile link copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Please copy the URL manually.", variant: "destructive" });
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <QrCode className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-foreground text-sm">Your QR Code</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* QR Code display */}
      <div className="px-4 pb-4">
        <div ref={qrRef} className="flex justify-center bg-muted/30 rounded-xl p-4">
          <QRCodeSVG
            value={profileUrl}
            size={expanded ? Math.max(qrSize, 240) : qrSize}
            level="H"
            includeMargin
            bgColor="transparent"
            fgColor="currentColor"
            className="text-foreground"
          />
        </div>

        {/* Compact actions */}
        <div className="flex gap-2 mt-3">
          <Button onClick={downloadQR} size="sm" className="flex-1 gradient-button text-primary-foreground">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download
          </Button>
          <Button onClick={copyUrl} size="sm" variant="outline" className="flex-1">
            {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
            {copied ? "Copied!" : "Copy URL"}
          </Button>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* URL display */}
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs font-mono text-muted-foreground break-all text-center">
                {profileUrl}
              </p>
            </div>

            {/* Tips */}
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
              <h4 className="font-semibold text-foreground text-sm mb-2">Quick Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 w-1 h-1 rounded-full bg-primary" />
                  Print on business cards
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 w-1 h-1 rounded-full bg-primary" />
                  Display at events and conferences
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 w-1 h-1 rounded-full bg-primary" />
                  Add to email signatures
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 w-1 h-1 rounded-full bg-primary" />
                  Share on social media
                </li>
              </ul>
            </div>

            {/* Link to full generator */}
            <a
              href="/dashboard/qr-code"
              className="block text-center text-xs text-primary font-medium hover:underline"
            >
              Open full QR Code Generator
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
