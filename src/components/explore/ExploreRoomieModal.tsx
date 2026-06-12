import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getTraitBadgeClass } from "@/lib/traits";
import ProfilePrompts from "@/components/profile/ProfilePrompts";
import ProfileVideo from "@/components/profile/ProfileVideo";
import ReputationBadge from "@/components/profile/ReputationBadge";
import { useRoomieReviews } from "@/hooks/useRoomieReviews";

interface RoomieProfile {
  id: string;
  user_id: string;
  name: string;
  age: number | null;
  gender: string | null;
  study: string | null;
  work: string | null;
  bio: string | null;
  avatar_url: string | null;
  images: string[] | null;
  personality: string[] | null;
  lifestyle: string[] | null;
  languages: string[] | null;
  monthly_budget: number | null;
  rental_period: string | null;
  last_seen_at?: string | null;
  median_response_minutes?: number | null;
}

interface ExploreRoomieModalProps {
  roomie: RoomieProfile | null;
  open: boolean;
  onClose: () => void;
}

const TagSection = ({ label, items }: { label: string; items: string[] }) => (
  <div>
    <h3 className="text-[11px] uppercase tracking-[0.18em] text-foreground/60 mb-2.5">{label}</h3>
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} variant="secondary" className={`${getTraitBadgeClass(item)} border-none`}>
          <span className="mr-1">●</span> {item}
        </Badge>
      ))}
    </div>
  </div>
);

const ExploreRoomieModal = ({ roomie, open, onClose }: ExploreRoomieModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const { average, count } = useRoomieReviews(roomie?.user_id ?? null);

  if (!roomie) return null;

  const images = roomie.images?.length
    ? roomie.images
    : roomie.avatar_url
      ? [roomie.avatar_url]
      : ["/placeholder.svg"];
  const genderLabel = roomie.gender === "male" ? "Mand" : roomie.gender === "female" ? "Kvinde" : roomie.gender;
  // Keep it to a short, clean line — separator only between present parts.
  const subline = [roomie.age ? `${roomie.age}` : null, genderLabel, roomie.study || "Studerende"]
    .filter(Boolean)
    .join(" • ");

  const handlePrevImage = () => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const handleNextImage = () => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  const handleClose = () => {
    setCurrentImageIndex(0);
    onClose();
  };

  const handleViewProfile = () => {
    navigate(`/user/${roomie.user_id}`);
    handleClose();
  };

  const handleConnect = async () => {
    if (isConnecting) return;
    if (!user) {
      toast.error("Log ind for at forbinde med roomies");
      return;
    }
    if (user.id === roomie.user_id) {
      toast.error("Du kan ikke forbinde med dig selv");
      return;
    }

    setIsConnecting(true);
    try {
      const { data: existingRequest } = await supabase
        .from("match_requests")
        .select("id")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${roomie.user_id}),and(sender_id.eq.${roomie.user_id},receiver_id.eq.${user.id})`
        )
        .maybeSingle();

      if (existingRequest) {
        toast.info("Der findes allerede en anmodning mellem jer");
        handleClose();
        return;
      }

      // Best-effort: a connection row may already exist (UNIQUE constraint) from a
      // prior swipe — it must NOT block creating the request the recipient receives.
      await supabase.from("connections").upsert(
        { user_id: user.id, target_user_id: roomie.user_id, connection_type: "roomie" },
        { onConflict: "user_id,target_user_id", ignoreDuplicates: true }
      );

      const { error: requestError } = await supabase.from("match_requests").insert({
        sender_id: user.id,
        receiver_id: roomie.user_id,
        status: "pending",
        type: "roomie",
      });

      if (requestError && !requestError.message.includes("duplicate")) {
        throw requestError;
      }

      toast.success(`Forbindelsesanmodning sendt til ${roomie.name}!`);
      handleClose();
    } catch (error) {
      console.error("Error connecting:", error);
      toast.error("Kunne ikke sende anmodning. Prøv igen.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-md p-0 gap-0 overflow-hidden rounded-3xl [&>button.absolute]:hidden"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>{roomie.name}</DialogTitle>
        </VisuallyHidden>

        {/* Photo */}
        <div className="relative aspect-[4/3] bg-muted">
          <button
            onClick={handleClose}
            aria-label="Luk"
            className="absolute top-4 left-4 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>

          <img src={images[currentImageIndex]} alt={roomie.name} className="w-full h-full object-cover" />

          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                aria-label="Forrige billede"
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextImage}
                aria-label="Næste billede"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Minimal info — name, what they do, tags, a short "about". Everything
            else lives on the full profile (the "Se profil" button below). */}
        <div className="px-6 pt-5 pb-4 max-h-[46vh] overflow-y-auto">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-2xl font-display text-foreground">{roomie.name}</h2>
            <ReputationBadge average={average} count={count} />
          </div>
          <p className="text-sm text-foreground/60 mt-0.5">{subline}</p>

          <div className="mt-5 space-y-5">
            {(roomie as any).video_url && (
              <ProfileVideo url={(roomie as any).video_url} poster={roomie.avatar_url} className="mx-auto" />
            )}
            {roomie.personality && roomie.personality.length > 0 && (
              <TagSection label="Personlighed" items={roomie.personality} />
            )}
            {roomie.lifestyle && roomie.lifestyle.length > 0 && (
              <TagSection label="Livsstil" items={roomie.lifestyle} />
            )}
            {roomie.bio && (
              <div>
                <h3 className="text-[11px] uppercase tracking-[0.18em] text-foreground/60 mb-2">Om mig</h3>
                <p className="text-sm text-foreground/70 leading-relaxed line-clamp-4">{roomie.bio}</p>
              </div>
            )}
            <ProfilePrompts prompts={(roomie as any).prompts} />
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border/60 px-6 py-4 flex gap-3 bg-background">
          <Button
            variant="outline"
            onClick={handleViewProfile}
            className="flex-1 rounded-full border-border/60 h-11"
          >
            Se profil
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex-1 rounded-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            {isConnecting ? "Sender..." : "Forbind"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExploreRoomieModal;
