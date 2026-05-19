import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <Loader2 
        className={cn(
          sizeClasses[size],
          "animate-spin text-primary",
          className
        )} 
        aria-hidden="true"
      />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
      <span className="sr-only">{text || "Indlæser..."}</span>
    </div>
  );
}

export function PageLoader({ text = "Indlæser..." }: { text?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

export function SectionLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}

export function ButtonLoader({ className }: { className?: string }) {
  return (
    <Loader2 
      className={cn("h-4 w-4 animate-spin", className)} 
      aria-hidden="true"
    />
  );
}
