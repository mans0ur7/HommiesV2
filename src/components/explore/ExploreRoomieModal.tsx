import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Sparkles, Calendar, Wallet, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import LastActive from "@/components/common/LastActive";
import ResponseTime from "@/components/common/ResponseTime";
import { usePresence } from "@/hooks/usePresence";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getTraitBadgeClass } from "@/lib/traits";

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

const ExploreRoomieModal = ({ roomie, open, onClose }: ExploreRoomieModalProps) => {
  const { user } = useAuth();
  const { isOnline } = usePresence();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  if (!roomie) return null;

  const images = roomie.images?.length ? roomie.images : (roomie.avatar_url ? [roomie.avatar_url] : ["/placeholder.svg"]);
  const genderLabel = roomie.gender === "male" ? "Mand" : roomie.gender === "female" ? "Kvinde" : roomie.gender;

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleClose = () => {
    setCurrentImageIndex(0);
    onClose();
  };

  const handleConnect = async () => {
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
      // Check if connection already exists
      const { data: existingConnection } = await supabase
        .from('connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('target_user_id', roomie.user_id)
        .maybeSingle();

      if (existingConnection) {
        toast.info("Du har allerede sendt en forbindelsesanmodning til denne roomie");
        handleClose();
        return;
      }

      // Check if match request already exists
      const { data: existingRequest } = await supabase
        .from('match_requests')
        .select('id')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${roomie.user_id}),and(sender_id.eq.${roomie.user_id},receiver_id.eq.${user.id})`)
        .maybeSingle();

      if (existingRequest) {
        toast.info("Der findes allerede en anmodning mellem jer");
        handleClose();
        return;
      }

      // Create connection (this triggers check_mutual_connection which creates match_request if mutual)
      const { error: connectionError } = await supabase
        .from('connections')
        .insert({
          user_id: user.id,
          target_user_id: roomie.user_id,
          connection_type: 'roomie'
        });

      if (connectionError) throw connectionError;

      // Also create a pending match request directly
      const { error: requestError } = await supabase
        .from('match_requests')
        .insert({
          sender_id: user.id,
          receiver_id: roomie.user_id,
          status: 'pending',
          type: 'roomie'
        });

      if (requestError && !requestError.message.includes('duplicate')) {
        throw requestError;
      }

      toast.success(`Forbindelsesanmodning sendt til ${roomie.name}!`);
      handleClose();
    } catch (error) {
      console.error('Error connecting:', error);
      toast.error("Kunne ikke sende anmodning. Prøv igen.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden max-h-[90vh]" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>{roomie.name}</DialogTitle>
        </VisuallyHidden>
        
        {/* Mobile: Single column scrollable layout (iOS-friendly scrolling) */}
        <div className="md:hidden h-[90dvh] overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
          {/* Image section - scrolls with content on mobile */}
          <div className="relative bg-muted h-64">
            <button
              onClick={handleClose}
              className="absolute top-4 left-4 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={images[currentImageIndex]}
              alt={roomie.name}
              className="w-full h-full object-cover"
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-3 h-3 rounded-full transition-all shadow-md ${
                        idx === currentImageIndex 
                          ? "bg-white scale-110" 
                          : "bg-white/60 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Profile info - scrolls naturally */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-1">{roomie.name}</h2>
            <p className="text-muted-foreground mb-2">
              {roomie.age && `${roomie.age}`}
              {roomie.age && genderLabel && " • "}
              {genderLabel}
              {(roomie.age || genderLabel) && roomie.study && " • "}
              {roomie.study || "Studerende"}
            </p>
            <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1">
              <LastActive lastSeenAt={roomie.last_seen_at} isOnline={isOnline(roomie.user_id)} hideIfUnknown />
              <ResponseTime medianMinutes={roomie.median_response_minutes} />
            </div>

            {/* Personality */}
            {roomie.personality && roomie.personality.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Personlighed</h3>
                <div className="flex flex-wrap gap-2">
                  {roomie.personality.map((trait) => (
                    <Badge
                      key={trait}
                      variant="secondary"
                      className={`${getTraitBadgeClass(trait)} border-none`}
                    >
                      <span className="mr-1">●</span> {trait}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Lifestyle */}
            {roomie.lifestyle && roomie.lifestyle.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Livsstil</h3>
                <div className="flex flex-wrap gap-2">
                  {roomie.lifestyle.map((item) => (
                    <Badge
                      key={item}
                      variant="secondary"
                      className={`${getTraitBadgeClass(item)} border-none`}
                    >
                      <span className="mr-1">●</span> {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {roomie.languages && roomie.languages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Sprog</h3>
                <p className="text-muted-foreground">{roomie.languages.join(", ")}</p>
              </div>
            )}

            {/* About */}
            {roomie.bio && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Om mig</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{roomie.bio}</p>
              </div>
            )}

            {/* Rent preferences */}
            {(roomie.monthly_budget || roomie.rental_period) && (
              <div className="border-t pt-6 mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Lejepræferencer</h3>
                <div className="space-y-3">
                  {roomie.monthly_budget && (
                    <div className="flex items-center gap-3 text-sm">
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Månedligt budget</span>
                      <span className="font-medium ml-auto">{roomie.monthly_budget.toLocaleString()} kr.</span>
                    </div>
                  )}
                  {roomie.rental_period && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Lejeperiode</span>
                      <span className="font-medium ml-auto">{roomie.rental_period}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action button */}
            <div className="pt-4 pb-2">
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6 font-medium"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {isConnecting ? "Sender..." : "Forbind"}
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop: Two column layout */}
        <div className="hidden md:grid md:grid-cols-2 h-full">
          {/* Left: Image carousel */}
          <div className="relative bg-muted">
            <button
              onClick={handleClose}
              className="absolute top-4 left-4 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={images[currentImageIndex]}
              alt={roomie.name}
              className="w-full h-full object-cover"
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-3 h-3 rounded-full transition-all shadow-md ${
                        idx === currentImageIndex 
                          ? "bg-white scale-110" 
                          : "bg-white/60 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Action button on image - desktop */}
            <div className="absolute bottom-8 left-4 right-4">
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6 font-medium"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {isConnecting ? "Sender..." : "Forbind"}
              </Button>
            </div>
          </div>

          {/* Right: Profile info */}
          <div className="p-8 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold text-foreground mb-1">{roomie.name}</h2>
            <p className="text-muted-foreground mb-2">
              {roomie.age && `${roomie.age}`}
              {roomie.age && genderLabel && " • "}
              {genderLabel}
              {(roomie.age || genderLabel) && roomie.study && " • "}
              {roomie.study || "Studerende"}
            </p>
            <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1">
              <LastActive lastSeenAt={roomie.last_seen_at} isOnline={isOnline(roomie.user_id)} hideIfUnknown />
              <ResponseTime medianMinutes={roomie.median_response_minutes} />
            </div>

            {/* Personality */}
            {roomie.personality && roomie.personality.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Personlighed</h3>
                <div className="flex flex-wrap gap-2">
                  {roomie.personality.map((trait) => (
                    <Badge
                      key={trait}
                      variant="secondary"
                      className={`${getTraitBadgeClass(trait)} border-none`}
                    >
                      <span className="mr-1">●</span> {trait}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Lifestyle */}
            {roomie.lifestyle && roomie.lifestyle.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Livsstil</h3>
                <div className="flex flex-wrap gap-2">
                  {roomie.lifestyle.map((item) => (
                    <Badge
                      key={item}
                      variant="secondary"
                      className={`${getTraitBadgeClass(item)} border-none`}
                    >
                      <span className="mr-1">●</span> {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {roomie.languages && roomie.languages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Sprog</h3>
                <p className="text-muted-foreground">{roomie.languages.join(", ")}</p>
              </div>
            )}

            {/* About */}
            {roomie.bio && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Om mig</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{roomie.bio}</p>
              </div>
            )}

            {/* Rent preferences */}
            {(roomie.monthly_budget || roomie.rental_period) && (
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Lejepræferencer</h3>
                <div className="space-y-3">
                  {roomie.monthly_budget && (
                    <div className="flex items-center gap-3 text-sm">
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Månedligt budget</span>
                      <span className="font-medium ml-auto">{roomie.monthly_budget.toLocaleString()} kr.</span>
                    </div>
                  )}
                  {roomie.rental_period && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Lejeperiode</span>
                      <span className="font-medium ml-auto">{roomie.rental_period}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExploreRoomieModal;
