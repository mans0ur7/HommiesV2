import { ReactNode } from "react";
import { LucideIcon, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  actionLabel?: ReactNode;
  actionHref?: string;
  onAction?: () => void;
  secondaryActionLabel?: ReactNode;
  onSecondaryAction?: () => void;
  variant?: "default" | "muted" | "card" | "compact";
  tone?: "primary" | "secondary" | "neutral";
  className?: string;
}

const toneMap = {
  primary: {
    blob: "from-primary/25 via-primary/10 to-transparent",
    ring: "ring-primary/20",
    iconBg: "bg-primary/10",
    icon: "text-primary",
  },
  secondary: {
    blob: "from-secondary/25 via-secondary/10 to-transparent",
    ring: "ring-secondary/20",
    iconBg: "bg-secondary/15",
    icon: "text-secondary",
  },
  neutral: {
    blob: "from-muted/60 via-muted/20 to-transparent",
    ring: "ring-border/60",
    iconBg: "bg-muted/60",
    icon: "text-muted-foreground",
  },
} as const;

const EmptyState = ({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = "default",
  tone = "primary",
  className = "",
}: EmptyStateProps) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) onAction();
    else if (actionHref) navigate(actionHref);
  };

  const containerClasses = {
    default: "py-14 px-6",
    muted: "py-10 px-5 bg-muted/30 rounded-2xl",
    card: "py-12 px-6 bg-card border border-border/50 rounded-3xl shadow-sm",
    compact: "py-8 px-4",
  };

  const t = toneMap[tone];
  const isCompact = variant === "compact";
  const iconBox = isCompact ? "w-14 h-14" : "w-20 h-20";
  const iconSize = isCompact ? "w-6 h-6" : "w-9 h-9";
  const blobSize = isCompact ? "w-28 h-28" : "w-40 h-40";

  return (
    <div className={`relative flex flex-col items-center justify-center text-center ${containerClasses[variant]} ${className}`}>
      {/* Decorative blurred blob behind the icon */}
      <div
        aria-hidden
        className={`pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 ${blobSize} rounded-full bg-gradient-to-br ${t.blob} blur-3xl opacity-80`}
      />

      <div className="relative">
        <div
          className={`${iconBox} rounded-3xl ${t.iconBg} ring-1 ${t.ring} flex items-center justify-center mb-4 mx-auto shadow-sm animate-scale-in`}
        >
          <Icon className={`${iconSize} ${t.icon}`} strokeWidth={1.75} />
        </div>
        <h3 className={`${isCompact ? "text-base" : "text-lg md:text-xl"} font-semibold text-foreground mb-1.5 tracking-tight animate-fade-in`}>
          {title}
        </h3>
        {description && (
          <p
            className={`${isCompact ? "text-xs" : "text-sm"} text-muted-foreground max-w-sm mx-auto leading-relaxed animate-fade-in`}
            style={{ animationDelay: "80ms" }}
          >
            {description}
          </p>
        )}
        {(actionLabel || secondaryActionLabel) && (
          <div
            className="mt-5 flex flex-wrap items-center justify-center gap-2 animate-fade-in-up"
            style={{ animationDelay: "160ms" }}
          >
            {actionLabel && (
              <Button onClick={handleAction} className="rounded-full">
                {actionLabel}
              </Button>
            )}
            {secondaryActionLabel && (
              <Button
                onClick={onSecondaryAction}
                variant="outline"
                className="rounded-full"
              >
                {secondaryActionLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
