import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReputationBadgeProps {
  average: number;
  count: number;
  className?: string;
}

/** Kompakt omdømme-chip: "★ 4.8 · 5 anmeldelser". Skjules helt hvis 0 anmeldelser. */
const ReputationBadge = ({ average, count, className }: ReputationBadgeProps) => {
  if (!count) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-secondary/20 border border-border/60 px-2.5 py-1 text-xs font-medium text-foreground",
        className,
      )}
    >
      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
      {average.toFixed(1)}
      <span className="text-muted-foreground">
        · {count} {count === 1 ? "anmeldelse" : "anmeldelser"}
      </span>
    </span>
  );
};

export default ReputationBadge;
