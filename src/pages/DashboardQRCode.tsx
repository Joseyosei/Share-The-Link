import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Share2, QrCode, Copy, Check, Printer, Mail, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";

const COLOR_PRESETS = [
  { label: "Classic", bg: "#FFFFFF", fg: "#000000", border: "border-foreground/30" },
  { label: "Brand", bg: "#FFFFFF", fg: "#7C3AED", border: "border-primary" },
  { label: "Dark", bg: "#1F2937", fg: "#FFFFFF", border: "border-muted-foreground" },
];

const DashboardQRCode = () => {
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const username = profile?.username || "user";
  const profileUrl = `${window.location.origin}/${username}`;

  const [qrSize, setQrSize] = useState(256);
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [fgColor, setFgColor] = useState("#000000");
  const [includeLogo, setIncludeLogo] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQR = (exportSize = 512) => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    canvas.width = exportSize;
    canvas.height = exportSize;
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, exportSize, exportSize);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${username}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast({ title: "Downloaded!", description: `QR code saved as ${username}-qr-code.png` });
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const shareQR = async () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    canvas.width = 512;
    canvas.height = 512;
    img.onload = async () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `${username}-qr-code.png`, { type: "image/png" });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `${username}'s QR Code`,
              text: "Scan to visit my profile!",
            });
          } catch {
            // Share cancelled
          }
        } else {
          downloadQR();
        }
      });
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
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-button flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">QR Code Generator</h1>
              <p className="text-muted-foreground text-sm">
                Create a custom QR code to share your profile at events, on cards, or anywhere offline
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Preview Panel */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-8 flex flex-col items-center">
                  <div
                    ref={qrRef}
                    className="rounded-2xl p-6 shadow-inner border-2 border-border"
                    style={{ backgroundColor: bgColor }}
                  >
                    <QRCodeSVG
                      value={profileUrl}
                      size={qrSize}
                      bgColor={bgColor}
                      fgColor={fgColor}
                      level="H"
                      includeMargin
                      imageSettings={
                        includeLogo
                          ? {
                              src: "/logo-icon.png",
                              x: undefined,
                              y: undefined,
                              height: 24,
                              width: 24,
                              excavate: true,
                            }
                          : undefined
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    {qrSize}px x {qrSize}px preview
                  </p>
                </CardContent>
              </Card>

              {/* URL + actions */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-2 items-center mb-4">
                    <Input
                      value={profileUrl}
                      readOnly
                      className="flex-1 font-mono text-xs bg-muted"
                    />
                    <Button size="sm" variant="outline" onClick={copyUrl}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => downloadQR()} className="flex-1 gradient-button text-primary-foreground">
                      <Download className="w-4 h-4 mr-2" />
                      Download PNG
                    </Button>
                    <Button onClick={shareQR} variant="outline" className="flex-1">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controls Panel */}
            <div className="space-y-6">
              {/* Size */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Size</CardTitle>
                  <CardDescription>Adjust the QR code dimensions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Slider
                    value={[qrSize]}
                    onValueChange={([v]) => setQrSize(v)}
                    min={128}
                    max={512}
                    step={32}
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground">{qrSize}px (exports at 512px for print quality)</p>
                </CardContent>
              </Card>

              {/* Colors */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Colors</CardTitle>
                  <CardDescription>Customize foreground and background colors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm mb-2 block">Background Color</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-border shrink-0"
                      />
                      <Input
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="font-mono text-sm flex-1"
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block">Foreground Color</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-border shrink-0"
                      />
                      <Input
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="font-mono text-sm flex-1"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  {/* Presets */}
                  <div>
                    <Label className="text-sm mb-2 block">Quick Presets</Label>
                    <div className="flex gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => {
                            setBgColor(preset.bg);
                            setFgColor(preset.fg);
                          }}
                          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover:scale-[1.02] ${preset.border}`}
                          style={{ backgroundColor: preset.bg, color: preset.fg }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Options */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="includeLogo"
                      checked={includeLogo}
                      onCheckedChange={(c) => setIncludeLogo(!!c)}
                    />
                    <Label htmlFor="includeLogo" className="text-sm cursor-pointer">
                      Include Share The Link logo in center
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Use cases */}
              <Card className="bg-primary/5 border-primary/10">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-3">Great for</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Printer, label: "Business Cards" },
                      { icon: Presentation, label: "Events & Conferences" },
                      { icon: Mail, label: "Email Signatures" },
                      { icon: Share2, label: "Social Media" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        {label}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardQRCode;
