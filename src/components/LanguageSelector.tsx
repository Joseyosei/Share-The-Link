import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { LANGUAGES } from "@/i18n";

export function LanguageSelector({ variant = "navbar" }: { variant?: "navbar" | "sidebar" }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
    // Set dir attribute for RTL languages
    document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
  };

  if (variant === "sidebar") {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Globe className="w-5 h-5 flex-shrink-0" />
          <span className="truncate">{currentLang.flag} {currentLang.name}</span>
        </button>
        {open && (
          <div className="absolute bottom-full left-0 mb-1 w-48 bg-popover border border-border rounded-xl shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleChange(lang.code)}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors ${
                  i18n.language === lang.code
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Change language"
      >
        <span className="text-sm">{currentLang.flag}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-xl shadow-xl z-50 py-1 max-h-80 overflow-y-auto">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors ${
                i18n.language === lang.code
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-muted/50"
              }`}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
