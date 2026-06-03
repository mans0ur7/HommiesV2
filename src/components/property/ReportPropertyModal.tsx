import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReportPropertyModalProps {
  propertyId: string;
  propertyTitle: string;
}

const reportReasons = [
  { id: "fake", label: "Falsk annonce" },
  { id: "scam", label: "Mistænkt svindel" },
  { id: "misleading", label: "Vildledende information" },
  { id: "inappropriate", label: "Upassende indhold" },
  { id: "unavailable", label: "Boligen er ikke tilgængelig" },
  { id: "other", label: "Andet" },
];

const fieldLabel = "text-[11px] uppercase tracking-[0.18em] text-foreground/60";

const ReportPropertyModal = ({ propertyId, propertyTitle }: ReportPropertyModalProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Du skal være logget ind for at rapportere");
      return;
    }

    if (!selectedReason) {
      toast.error("Vælg venligst en årsag");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("property_reports").insert({
        property_id: propertyId,
        reporter_user_id: user.id,
        reason: selectedReason,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast.success("Tak for din rapport. Vi vil gennemgå den hurtigst muligt.");
      setIsOpen(false);
      setSelectedReason(null);
      setComment("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Kunne ikke sende rapporten. Prøv igen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive gap-2"
        >
          <Flag className="w-4 h-4" />
          Rapportér
        </Button>
      </SheetTrigger>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "p-0 gap-0 bg-background flex flex-col",
          isMobile ? "h-[88vh] rounded-t-3xl" : "w-full sm:max-w-md border-l border-border/60"
        )}
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-5 border-b border-border/60 text-left space-y-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-foreground/40" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-foreground/60">Rapportér</span>
          </div>
          <SheetTitle className="text-2xl font-medium tracking-tight text-foreground">
            Rapportér annonce.
          </SheetTitle>
          <p className="text-sm text-foreground/60 pt-1">
            Rapportér "{propertyTitle}" hvis du mener, der er noget galt med denne annonce.
          </p>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-6 flex-1 space-y-6">
          {/* Reason Selection */}
          <div className="space-y-3">
            <label className={fieldLabel}>
              Vælg årsag *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {reportReasons.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={cn(
                    "px-3 py-2.5 rounded-2xl text-sm text-left transition-colors",
                    selectedReason === reason.id
                      ? "bg-foreground text-background"
                      : "border border-border/60 text-foreground hover:bg-muted"
                  )}
                >
                  {reason.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-3">
            <label className={fieldLabel}>
              Yderligere kommentarer (valgfrit)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Beskriv problemet mere detaljeret..."
              className="w-full px-3 py-2 rounded-2xl border border-border/60 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20"
              rows={3}
            />
          </div>
        </div>

        {/* Sticky footer */}
        <div className="border-t border-border/60 px-6 pt-4 pb-[calc(1rem+var(--safe-bottom))] flex items-center justify-end gap-2 bg-background">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="rounded-full text-foreground/70"
          >
            Annuller
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold px-5"
          >
            {isSubmitting ? "Sender..." : "Send rapport"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ReportPropertyModal;
