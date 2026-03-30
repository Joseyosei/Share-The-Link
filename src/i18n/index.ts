import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import pt from "./locales/pt.json";
import ja from "./locales/ja.json";
import zh from "./locales/zh.json";
import ko from "./locales/ko.json";
import hi from "./locales/hi.json";
import ar from "./locales/ar.json";

export const LANGUAGES = [
  { code: "en", name: "English", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "es", name: "Español", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "fr", name: "Français", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "de", name: "Deutsch", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "pt", name: "Português", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "ja", name: "日本語", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "zh", name: "中文", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "ko", name: "한국어", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "hi", name: "हिन्दी", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "ar", name: "العربية", flag: "\u{1F1F8}\u{1F1E6}" },
] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
      pt: { translation: pt },
      ja: { translation: ja },
      zh: { translation: zh },
      ko: { translation: ko },
      hi: { translation: hi },
      ar: { translation: ar },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;
