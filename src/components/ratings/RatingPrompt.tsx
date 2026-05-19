import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StarRating from "./StarRating";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RatingPromptProps {
  propertyId: string;
  propertyTitle: string;
  matchRequestId?: string;
  onClose: () => void;
  onRated: () => void;
  isManual?: boolean;
}

const RatingPrompt = ({
  propertyId,
  propertyTitle,
  matchRequestId,
  onClose,
  onRated,
  isManual = false,
}: RatingPromptProps) => {
  const [selectedRating, setSelectedRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (selectedRating === 0) {
      toast.error("Vælg venligst en rating");
      return;
    }

    setIsSubmitting(true);
    setEligibilityError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Du skal være logget ind");
        return;
      }

      // First check if user has an accepted match request for this property (7+ days old)
      const { data: matchRequest, error: matchError } = await supabase
        .from("match_requests")
        .select("id, created_at")
        .eq("sender_id", user.id)
        .eq("property_id", propertyId)
        .eq("status", "accepted")
        .maybeSingle();

      if (matchError) throw matchError;

      if (!matchRequest) {
        setEligibilityError("Du skal have en godkendt anmodning for denne bolig");
        setIsSubmitting(false);
        return;
      }

      const acceptedDate = new Date(matchRequest.created_at);
      const daysSinceAccepted = (Date.now() - acceptedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceAccepted < 7) {
        const daysLeft = Math.ceil(7 - daysSinceAccepted);
        setEligibilityError(`Du kan bedømme om ${daysLeft} dag${daysLeft > 1 ? 'e' : ''}`);
        setIsSubmitting(false);
        return;
      }

      // Check if already rated
      const { data: existingRating } = await supabase
        .from("ratings")
        .select("id")
        .eq("property_id", propertyId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingRating) {
        toast.error("Du har allerede bedømt denne annonce");
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from("ratings")
        .insert({
          property_id: propertyId,
          user_id: user.id,
          rating: selectedRating,
          match_request_id: matchRequest.id,
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("Du har allerede bedømt denne annonce");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Tak for din bedømmelse!");
      onRated();
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Kunne ikke gemme bedømmelsen");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            Bedøm annoncen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Hvor præcist var "{propertyTitle}" beskrevet?
          </p>

          {eligibilityError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{eligibilityError}</p>
            </div>
          )}

          <div className="flex justify-center py-4">
            <StarRating
              rating={selectedRating}
              size="lg"
              interactive
              onRatingChange={setSelectedRating}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annuller
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedRating === 0 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Sender..." : "Send bedømmelse"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingPrompt;
