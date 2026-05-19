import { useState } from "react";
import { Flag, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

const ReportPropertyModal = ({ propertyId, propertyTitle }: ReportPropertyModalProps) => {
  const { user } = useAuth();
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive gap-2"
        >
          <Flag className="w-4 h-4" />
          Rapportér
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Rapportér annonce
          </DialogTitle>
          <DialogDescription>
            Rapportér "{propertyTitle}" hvis du mener, der er noget galt med denne annonce.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Vælg årsag *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {reportReasons.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                    selectedReason === reason.id
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                >
                  {reason.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Yderligere kommentarer (valgfrit)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Beskriv problemet mere detaljeret..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-destructive/50"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="flex-1"
          >
            Annuller
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className="flex-1 bg-destructive hover:bg-destructive/90"
          >
            {isSubmitting ? "Sender..." : "Send rapport"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportPropertyModal;
