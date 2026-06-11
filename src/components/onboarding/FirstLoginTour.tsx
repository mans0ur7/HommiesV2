import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, MessageCircle, Search, Users, ChevronRight, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const SEEN_KEY = "hommies_first_login_tour_seen_v1";

interface Step {
  icon: typeof Sparkles;
  titleKey: string;
  bodyKey: string;
}

const steps: Step[] = [
  { icon: Search,         titleKey: "tour.s1Title", bodyKey: "tour.s1Body" },
  { icon: Sparkles,       titleKey: "tour.s2Title", bodyKey: "tour.s2Body" },
  { icon: MessageCircle,  titleKey: "tour.s3Title", bodyKey: "tour.s3Body" },
  { icon: Users,          titleKey: "tour.s4Title", bodyKey: "tour.s4Body" },
];

const FirstLoginTour = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(SEEN_KEY) === "true") return;
    setOpen(true);
  }, [user]);

  const close = () => {
    localStorage.setItem(SEEN_KEY, "true");
    setOpen(false);
  };

  if (!open) return null;

  const step = steps[index];
  const Icon = step.icon;
  const isLast = index === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[120] bg-foreground/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="bg-background w-full md:max-w-md rounded-t-3xl md:rounded-3xl border border-border/60 p-6 md:p-8 pb-[calc(1.5rem+var(--safe-bottom))] md:pb-8 relative">
        <button
          onClick={close}
          aria-label="Skip"
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-foreground/60"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-secondary/20 border border-border/60 flex items-center justify-center mb-5">
          <Icon className="w-7 h-7 text-foreground/70" />
        </div>

        <h2 className="text-2xl font-display text-foreground mb-2">{t(step.titleKey)}</h2>
        <p className="text-muted-foreground leading-relaxed mb-8">{t(step.bodyKey)}</p>

        {/* Step dots */}
        <div className="flex items-center gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-foreground" : "w-1.5 bg-foreground/20"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button onClick={close} className="text-sm text-muted-foreground hover:text-foreground">
            {t("tour.skip")}
          </button>
          <Button
            onClick={() => (isLast ? close() : setIndex((i) => i + 1))}
            className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-6"
          >
            {isLast ? t("tour.gotIt") : t("tour.next")}
            {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FirstLoginTour;
