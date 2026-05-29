import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import da from "./locales/da.json";
import en from "./locales/en.json";

// Danish is the source/default. Untranslated keys fall back to Danish, so the
// app is never broken while English (and future languages) are filled in.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      da: { translation: da },
      en: { translation: en },
    },
    fallbackLng: "da",
    supportedLngs: ["da", "en"],
    load: "languageOnly", // en-US → en
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "hommies_lang",
      caches: ["localStorage"],
    },
  });

export default i18n;
