import { useEffect } from "react";
import confetti from "canvas-confetti";
import { useTranslation } from "react-i18next";
import { Sparkles, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hapticSuccess } from "@/lib/haptics";

interface MatchCelebrationProps {
  open: boolean;
  onClose: () => void;
  matchedName?: string;
  matchedAvatar?: string | null;
  myAvatar?: string | null;
  onMessage?: () => void;
}

const MatchCelebration = ({
  open,
  onClose,
  matchedName,
  matchedAvatar,
  myAvatar,
  onMessage,
}: MatchCelebrationProps) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    hapticSuccess();
    // Two confetti bursts from each side
    const duration = 1500;
    const end = Date.now() + duration;
    const colors = ["#FCC9BA", "#1a3d4d", "#a7d2b6", "#fffaf3"];
    const tick = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(tick);
    };
    tick();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-primary/95 to-secondary/95 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-label="It's a match"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-6 right-6 p-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-colors"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      <div className="flex flex-col items-center text-center px-8 max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center gap-2 text-white">
          <Sparkles className="w-6 h-6 animate-pulse" />
          <span className="text-xs uppercase tracking-[0.3em] font-semibold">{t("match.eyebrow")}</span>
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-3 animate-scale-in">
          {t("match.title")}
        </h1>

        {matchedName && (
          <p className="text-lg text-white/80 mb-10">
            {t("match.subtitle", { name: matchedName })}
          </p>
        )}

        <div className="flex items-center gap-4 mb-12">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/40 shadow-2xl">
            {myAvatar ? (
              <img src={myAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/20" />
            )}
          </div>
          <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/40 shadow-2xl">
            {matchedAvatar ? (
              <img src={matchedAvatar} alt={matchedName ?? ""} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/20" />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {onMessage && (
            <Button
              onClick={onMessage}
              className="rounded-full bg-white text-foreground hover:bg-white/90 h-12 px-8 font-semibold"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {t("match.messageCta")}
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="ghost"
            className="rounded-full text-white hover:bg-white/10 h-12 px-8"
          >
            {t("match.keepSwiping")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MatchCelebration;
