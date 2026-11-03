import { useState, useEffect, useRef } from "react";
import { Eye, Type, ZapOff, X } from "lucide-react";

export const AccessibilityButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const hc = localStorage.getItem("a11y-high-contrast") === "1";
      const lt = localStorage.getItem("a11y-large-text") === "1";
      const rm = localStorage.getItem("a11y-reduce-motion") === "1";
      document.documentElement.classList.toggle("high-contrast", hc);
      document.documentElement.classList.toggle("large-text", lt);
      document.documentElement.classList.toggle("reduce-motion", rm);
      setHighContrast(hc);
      setLargeText(lt);
      setReduceMotion(rm);
    } catch { /* storage unavailable */ }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const toggle = (key: string, value: boolean, setter: (v: boolean) => void) => {
    const next = !value;
    setter(next);
    document.documentElement.classList.toggle(key, next);
    try { localStorage.setItem(`a11y-${key}`, next ? "1" : "0"); } catch {}
  };

  const anyActive = highContrast || largeText || reduceMotion;

  const options = [
    { key: "high-contrast", label: "High Contrast", icon: Eye, value: highContrast, setter: setHighContrast, desc: "Boost color contrast" },
    { key: "large-text", label: "Large Text", icon: Type, value: largeText, setter: setLargeText, desc: "Increase text size" },
    { key: "reduce-motion", label: "Reduce Motion", icon: ZapOff, value: reduceMotion, setter: setReduceMotion, desc: "Disable animations" },
  ];

  return (
    <div ref={ref} className="fixed bottom-6 left-4 sm:left-6 z-50 pb-[env(safe-area-inset-bottom)]">
      {isOpen && (
        <div className="absolute bottom-16 left-0 w-72 rounded-2xl a11y-panel p-4 space-y-2 animate-scale-in shadow-2xl">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">Accessibility</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors"
              aria-label="Close accessibility menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.key}
                onClick={() => toggle(opt.key, opt.value, opt.setter)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                  opt.value
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "hover:bg-muted/50 text-foreground border border-transparent"
                }`}
                aria-pressed={opt.value}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
                <div
                  className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${
                    opt.value ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                  aria-hidden="true"
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      opt.value ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center ${
          isOpen || anyActive
            ? "bg-primary text-white"
            : "bg-background/90 backdrop-blur-lg text-foreground border border-border/50"
        }`}
        aria-label="Accessibility options"
        aria-expanded={isOpen}
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="4.5" r="2" />
          <path d="M12 7v5l-3 5" />
          <path d="M12 12l3 5" />
          <path d="M6 9h12" />
        </svg>
      </button>
    </div>
  );
};
