import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useHomeBriefing } from "@/hooks/useHomeBriefing";

/**
 * "Siden sidst" — a calm status briefing. One priority next-best-action banner
 * plus a wrap of stat chips that only render when their count is > 0.
 */
const SinceLastVisit = () => {
  const navigate = useNavigate();
  const { action, chips } = useHomeBriefing();

  return (
    <div>
      {/* Eyebrow */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px w-8 bg-foreground/40" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">
          Siden sidst
        </span>
      </div>

      {/* Priority next-best-action banner */}
      <button
        onClick={() => navigate(action.to)}
        className="w-full text-left rounded-2xl border border-border/60 bg-secondary/20 p-5 md:p-6 hover:border-foreground/30 transition-colors group"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-base md:text-lg font-medium text-foreground">
              {action.title}
            </p>
            <p className="text-sm text-foreground/60 mt-1">
              {action.description}
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 group-hover:text-foreground transition-colors">
            <span className="hidden sm:inline">{action.cta}</span>
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </button>

      {/* Stat chips — only the ones with count > 0 */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {chips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => navigate(chip.to)}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3.5 py-1.5 text-xs font-medium text-foreground/70 hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              {chip.label}
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-foreground text-background text-[10px] px-1">
                {chip.count}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SinceLastVisit;
