import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const LANGS = [
  { code: "da", label: "Dansk" },
  { code: "en", label: "English" },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language;

  return (
    <div className="flex items-center gap-1 rounded-full border border-border/60 p-1">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => i18n.changeLanguage(l.code)}
          className={cn(
            "flex-1 text-xs font-medium px-3 py-1.5 rounded-full transition-colors",
            current === l.code
              ? "bg-foreground text-background"
              : "text-foreground/60 hover:text-foreground"
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
