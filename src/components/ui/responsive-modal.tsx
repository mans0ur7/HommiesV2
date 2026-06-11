import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Skjul titlen visuelt (stadig til stede for skærmlæsere). */
  hideTitle?: boolean;
}

/**
 * Ét konsistent modal-mønster: centreret dialog på desktop, bund-sheet med
 * drag-handle på mobil. Begge bygger på @radix-ui/react-dialog, så open/
 * onOpenChange + fokus-fælde + Escape opfører sig ens. Bund-sheet'en arver
 * safe-area-bund fra SheetContent (pb med var(--safe-bottom)).
 */
export const ResponsiveModal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  hideTitle,
}: ResponsiveModalProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className={cn("max-h-[90dvh] overflow-y-auto rounded-t-2xl", className)}
        >
          <div className="mx-auto -mt-2 mb-3 h-1.5 w-12 rounded-full bg-muted" aria-hidden />
          {(title || description) && (
            <SheetHeader className="mb-2">
              {title && (
                <SheetTitle className={hideTitle ? "sr-only" : undefined}>{title}</SheetTitle>
              )}
              {description && <SheetDescription>{description}</SheetDescription>}
            </SheetHeader>
          )}
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        {(title || description) && (
          <DialogHeader>
            {title && (
              <DialogTitle className={hideTitle ? "sr-only" : undefined}>{title}</DialogTitle>
            )}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
};
