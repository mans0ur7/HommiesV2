import { useState, useEffect } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "hommies_experience_rating";
const DISMISSED_KEY = "hommies_experience_dismissed";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

const ExperienceRatingPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [overallRating, setOverallRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [detailedRatings, setDetailedRatings] = useState({
    appOplevelse: 0,
    boligSøgning: 0,
    matchOplevelse: 0,
    chatOplevelse: 0,
    support: 0,
  });
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user submitted a rating (60 day cooldown)
    const ratingStored = localStorage.getItem(STORAGE_KEY);
    if (ratingStored) {
      const { timestamp } = JSON.parse(ratingStored);
      const timeSinceSubmission = Date.now() - timestamp;
      if (timeSinceSubmission < SIXTY_DAYS_MS) {
        setIsVisible(false);
        return;
      }
    }
    
    // Check if user dismissed without rating (7 day cooldown)
    const dismissedStored = localStorage.getItem(DISMISSED_KEY);
    if (dismissedStored) {
      const dismissedTimestamp = parseInt(dismissedStored, 10);
      const timeSinceDismissed = Date.now() - dismissedTimestamp;
      if (timeSinceDismissed < SEVEN_DAYS_MS) {
        setIsVisible(false);
        return;
      }
    }
    
    setIsVisible(true);
  }, []);

  const handleStarSelect = (star: number) => {
    setOverallRating(star);
    // Open the detailed modal right away (small delay lets the star fill animate)
    setTimeout(() => setShowModal(true), 200);
  };

  const handleDetailedSubmit = () => {
    setIsSubmitting(true);
    
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        overallRating,
        detailedRatings,
        feedback,
      })
    );

    setTimeout(() => {
      setShowModal(false);
      setIsVisible(false);
    }, 300);
  };

  const handleDismiss = () => {
    // Save dismissed timestamp for 7-day cooldown
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setIsVisible(false);
  };

  const getRatingLabel = (rating: number) => {
    const labels = ["", "Dårlig", "Ikke så god", "Okay", "God", "Fantastisk"];
    return labels[rating] || "";
  };

  const updateDetailedRating = (key: keyof typeof detailedRatings, value: number) => {
    setDetailedRatings((prev) => ({ ...prev, [key]: value }));
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Inline Rating Card */}
      <div className="bg-gradient-to-r from-[hsl(30,50%,96%)] to-[hsl(30,50%,94%)] rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-sm animate-fade-in">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors z-10"
          aria-label="Luk"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                Hvordan er din oplevelse<br className="hidden sm:block" />
                med Hommies indtil videre?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Din feedback hjælper os med at blive bedre
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarSelect(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-all duration-200 hover:scale-125 active:scale-95"
                  >
                    <Star
                      className={cn(
                        "w-8 h-8 md:w-10 md:h-10 transition-colors duration-200",
                        (hoveredRating || overallRating) >= star
                          ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                          : "fill-muted-foreground/20 text-muted-foreground/30"
                      )}
                    />
                  </button>
                ))}
              </div>
              {(hoveredRating || overallRating) > 0 && (
                <span className="text-sm font-semibold text-foreground animate-fade-in">
                  {getRatingLabel(hoveredRating || overallRating)}
                </span>
              )}
            </div>
          </div>

          {/* Illustration */}
          <div className="hidden sm:flex items-center justify-center w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10 flex-shrink-0">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center relative overflow-hidden">
                  {/* Simple face illustration */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#FFD9B3] relative">
                      {/* Hair */}
                      <div className="absolute -top-1 -left-1 -right-1 h-5 bg-[#4A3728] rounded-t-full" />
                      {/* Eyes */}
                      <div className="absolute top-3 left-1.5 w-1 h-1 bg-[#333] rounded-full" />
                      <div className="absolute top-3 right-1.5 w-1 h-1 bg-[#333] rounded-full" />
                      {/* Smile */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-1 border-b-2 border-[#333] rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Star decoration */}
              <div className="absolute -top-1 -right-1">
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400 drop-shadow-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Rating Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center pb-2">
            {/* Modal illustration */}
            <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center relative overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-[#FFD9B3] relative">
                    <div className="absolute -top-1 -left-1 -right-1 h-5 bg-[#4A3728] rounded-t-full" />
                    <div className="absolute top-3 left-1.5 w-1 h-1 bg-[#333] rounded-full" />
                    <div className="absolute top-3 right-1.5 w-1 h-1 bg-[#333] rounded-full" />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-1 border-b-2 border-[#333] rounded-full" />
                  </div>
                </div>
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-center">
              Fortæl os mere om din oplevelse
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Hvor tilfreds er du med:
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {[
              { key: "appOplevelse", label: "App-oplevelse" },
              { key: "boligSøgning", label: "Boligsøgning" },
              { key: "matchOplevelse", label: "Match-oplevelse" },
              { key: "chatOplevelse", label: "Chat-oplevelse" },
              { key: "support", label: "Support" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        updateDetailedRating(key as keyof typeof detailedRatings, star)
                      }
                      className="transition-all duration-150 hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={cn(
                          "w-6 h-6 transition-colors duration-150",
                          detailedRatings[key as keyof typeof detailedRatings] >= star
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-muted-foreground/20 text-muted-foreground/30"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-2">
              <label className="text-sm text-muted-foreground block mb-2">
                Har du yderligere feedback? Det vil hjælpe os med at forbedre din roomie-oplevelse.
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Fortæl os mere..."
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <Button
            onClick={handleDetailedSubmit}
            disabled={isSubmitting}
            className="w-full mt-2"
            size="lg"
          >
            {isSubmitting ? "Sender..." : "Indsend"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExperienceRatingPrompt;
