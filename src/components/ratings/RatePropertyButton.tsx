import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import StarRating from "./StarRating";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface RatePropertyButtonProps {
  propertyId: string;
  propertyTitle: string;
  onRated?: () => void;
}

const RatePropertyButton = ({
  propertyId,
  propertyTitle,
  onRated,
}: RatePropertyButtonProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [eligibilityMessage, setEligibilityMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && propertyId) {
      checkEligibility();
    } else {
      setLoading(false);
    }
  }, [user, propertyId]);

  const checkEligibility = async () => {
    if (!user) return;

    try {
      // Check if user has already rated this property
      const { data: existingRating } = await supabase
        .from("ratings")
        .select("id")
        .eq("property_id", propertyId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingRating) {
        setHasRated(true);
        setCanRate(false);
        setLoading(false);
        return;
      }

      // Check if user has an accepted match request for this property
      const { data: matchRequest } = await supabase
        .from("match_requests")
        .select("id, created_at, status")
        .eq("sender_id", user.id)
        .eq("property_id", propertyId)
        .eq("status", "accepted")
        .maybeSingle();

      if (!matchRequest) {
        setEligibilityMessage("Du skal have en godkendt forbindelse for at bedømme");
        setCanRate(false);
        setLoading(false);
        return;
      }

      // Check if 7 days have passed
      const acceptedDate = new Date(matchRequest.created_at);
      const daysSince = (Date.now() - acceptedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince < 7) {
        const daysLeft = Math.ceil(7 - daysSince);
        setEligibilityMessage(`Du kan bedømme om ${daysLeft} dag${daysLeft > 1 ? "e" : ""}`);
        setCanRate(false);
      } else {
        setCanRate(true);
      }
    } catch (error) {
      console.error("Error checking eligibility:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedRating === 0) {
      toast.error("Vælg venligst en rating");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get match request id for the rating
      const { data: matchRequest } = await supabase
        .from("match_requests")
        .select("id")
        .eq("sender_id", user?.id)
        .eq("property_id", propertyId)
        .eq("status", "accepted")
        .single();

      const { error } = await supabase.from("ratings").insert({
        property_id: propertyId,
        user_id: user?.id,
        rating: selectedRating,
        comment: comment.trim() || null,
        match_request_id: matchRequest?.id,
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
      setIsOpen(false);
      setHasRated(true);
      setCanRate(false);
      onRated?.();
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Kunne ikke gemme bedømmelsen");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show button if loading, not logged in, or user is the landlord
  if (loading || !user) {
    return null;
  }

  // Already rated
  if (hasRated) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span>Du har bedømt denne bolig</span>
      </div>
    );
  }

  // Can't rate (no connection or too early)
  if (!canRate && eligibilityMessage) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Star className="w-4 h-4" />
        <span>{eligibilityMessage}</span>
      </div>
    );
  }

  // Can rate
  if (!canRate) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Star className="w-4 h-4" />
        Bedøm denne bolig
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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

            <div className="flex justify-center py-4">
              <StarRating
                rating={selectedRating}
                size="lg"
                interactive
                onRatingChange={setSelectedRating}
              />
            </div>

            <Textarea
              placeholder="Skriv en kommentar (valgfrit)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
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
    </>
  );
};

export default RatePropertyButton;
