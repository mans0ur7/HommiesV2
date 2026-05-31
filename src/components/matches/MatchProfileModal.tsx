import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X, ChevronLeft, ChevronRight, Sparkles, Calendar, Wallet, Globe, ArrowRight, Flag, Ban } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getTraitBadgeClass } from "@/lib/traits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical } from "lucide-react";
import ReportUserModal from "@/components/ReportUserModal";
import LastActive from "@/components/common/LastActive";
import ResponseTime from "@/components/common/ResponseTime";
import { usePresence } from "@/hooks/usePresence";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  age: number | null;
  gender: string | null;
  study: string | null;
  work: string | null;
  nationality: string | null;
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

interface Property {
  id: string;
  user_id: string;
  title: string;
  address: string;
  city: string;
  monthly_rent: number;
  size_sqm: number | null;
  images: string[] | null;
  description: string | null;
  room_count: number | null;
  bed_count: number | null;
  bathroom_count: number | null;
  amenities: string[] | null;
  is_furnished: boolean | null;
  bills_included: boolean | null;
  available_from: string | null;
  owner?: {
    name: string;
    avatar_url: string | null;
    age: number | null;
    gender: string | null;
  };
}

interface MatchProfileModalProps {
  profile?: Profile | null;
  property?: Property | null;
  open: boolean;
  onClose: () => void;
  onConnect: () => void;
  onIgnore: () => void;
}

const eyebrowLabel = "text-[11px] uppercase tracking-[0.18em] text-foreground/60";
const imageChrome =
  "p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors";

const MatchProfileModal = ({ profile, property, open, onClose, onConnect, onIgnore }: MatchProfileModalProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { isOnline } = usePresence();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const handleBlock = async () => {
    if (!profile || !user) return;
    setIsBlocking(true);
    try {
      const { error } = await supabase
        .from("blocked_users")
        .insert({ user_id: user.id, blocked_user_id: profile.user_id });
      if (error && !error.message?.includes("duplicate")) throw error;
      toast.success(t("block.blocked", { name: profile.name }));
      setBlockConfirmOpen(false);
      onIgnore();
      onClose();
    } catch (err) {
      console.error("Block failed:", err);
      toast.error(t("block.failed"));
    } finally {
      setIsBlocking(false);
    }
  };

  const handlePrevImage = () => {
    const images = profile?.images || property?.images || [];
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    const images = profile?.images || property?.images || [];
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleClose = () => {
    setCurrentImageIndex(0);
    onClose();
  };

  const handleOwnerClick = () => {
    if (property?.user_id) {
      handleClose();
      navigate(`/user/${property.user_id}`);
    }
  };

  // Profile view
  if (profile) {
    const images = profile.images?.length ? profile.images : (profile.avatar_url ? [profile.avatar_url] : ["/placeholder.svg"]);
    const genderLabel = profile.gender === "male" ? "Mand" : profile.gender === "female" ? "Kvinde" : profile.gender;

    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(
            "p-0 gap-0 bg-background flex flex-col overflow-hidden",
            isMobile ? "h-[88vh] rounded-t-3xl" : "w-full sm:max-w-md border-l border-border/60"
          )}
        >
          <VisuallyHidden>
            <SheetTitle>{profile.name}</SheetTitle>
          </VisuallyHidden>

          {/* Image carousel */}
          <div className="relative bg-muted h-64 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label={t("report.reportTrigger")}
                  className={cn("absolute top-4 left-4 z-20", imageChrome)}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => setBlockConfirmOpen(true)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  {t("block.trigger")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setReportOpen(true)} className="text-destructive cursor-pointer">
                  <Flag className="w-4 h-4 mr-2" />
                  {t("report.reportTrigger")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <img
              src={images[currentImageIndex]}
              alt={profile.name}
              className="w-full h-full object-cover"
            />

            {images.length > 1 && (
              <>
                <button
                  aria-label="Forrige billede"
                  onClick={handlePrevImage}
                  className={cn("absolute left-4 top-1/2 -translate-y-1/2", imageChrome)}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  aria-label="Næste billede"
                  onClick={handleNextImage}
                  className={cn("absolute right-4 top-1/2 -translate-y-1/2", imageChrome)}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentImageIndex
                          ? "bg-background"
                          : "bg-background/60 hover:bg-background/80"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Profile info */}
          <div className="overflow-y-auto px-6 py-6 flex-1">
            <h2 className="text-2xl font-medium tracking-tight text-foreground mb-1">{profile.name}</h2>
            <p className="text-muted-foreground mb-2">
              {profile.age && `${profile.age}`}
              {profile.age && genderLabel && " • "}
              {genderLabel}
              {(profile.age || genderLabel) && profile.study && " • "}
              {profile.study || "Studerende"}
            </p>
            <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1">
              <LastActive lastSeenAt={profile.last_seen_at} isOnline={isOnline(profile.user_id)} hideIfUnknown />
              <ResponseTime medianMinutes={profile.median_response_minutes} />
            </div>

            {/* Personality */}
            {profile.personality && profile.personality.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-foreground/40" />
                  <span className={eyebrowLabel}>Personlighed</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.personality.map((trait) => (
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
            {profile.lifestyle && profile.lifestyle.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-foreground/40" />
                  <span className={eyebrowLabel}>Livsstil</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.lifestyle.map((item) => (
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
            {profile.languages && profile.languages.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-foreground/40" />
                  <span className={eyebrowLabel}>Sprog</span>
                </div>
                <p className="text-muted-foreground">{profile.languages.join(", ")}</p>
              </div>
            )}

            {/* About */}
            {profile.bio && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-foreground/40" />
                  <span className={eyebrowLabel}>Om mig</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Rent preferences */}
            {(profile.monthly_budget || profile.rental_period) && (
              <div className="border-t border-border/60 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-foreground/40" />
                  <span className={eyebrowLabel}>Lejepræferencer</span>
                </div>
                <div className="space-y-3">
                  {profile.monthly_budget && (
                    <div className="flex items-center gap-3 text-sm">
                      <Wallet className="w-4 h-4 text-foreground/60" />
                      <span className="text-muted-foreground">Månedligt budget</span>
                      <span className="font-medium ml-auto">{profile.monthly_budget.toLocaleString()} kr.</span>
                    </div>
                  )}
                  {profile.rental_period && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-foreground/60" />
                      <span className="text-muted-foreground">Lejeperiode</span>
                      <span className="font-medium ml-auto">{profile.rental_period}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sticky footer actions */}
          <div className="border-t border-border/60 px-6 py-4 flex gap-3 bg-background">
            <Button
              variant="outline"
              onClick={() => {
                onIgnore();
                handleClose();
              }}
              className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground border-none rounded-full py-6 font-medium"
            >
              <X className="w-5 h-5 mr-2" />
              Ignorer
            </Button>
            <Button
              onClick={() => {
                onConnect();
                handleClose();
              }}
              className="flex-1 bg-foreground hover:bg-foreground/90 text-background rounded-full py-6 font-medium"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Forbind
            </Button>
          </div>
        </SheetContent>
        <ReportUserModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          reportedUserId={profile.user_id}
          reportedUserName={profile.name}
          onReported={handleClose}
        />
        <AlertDialog open={blockConfirmOpen} onOpenChange={(o) => !isBlocking && setBlockConfirmOpen(o)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("block.confirmTitle", { name: profile.name })}</AlertDialogTitle>
              <AlertDialogDescription>{t("block.confirmBody")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isBlocking}>{t("block.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBlock}
                disabled={isBlocking}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isBlocking ? t("block.blocking") : t("block.confirmAction")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Sheet>
    );
  }

  // Property view
  if (property) {
    const images = property.images?.length ? property.images : ["/placeholder.svg"];

    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(
            "p-0 gap-0 bg-background flex flex-col overflow-hidden",
            isMobile ? "h-[88vh] rounded-t-3xl" : "w-full sm:max-w-md border-l border-border/60"
          )}
        >
          <VisuallyHidden>
            <SheetTitle>{property.title}</SheetTitle>
          </VisuallyHidden>

          {/* Image carousel */}
          <div className="relative bg-muted h-64 shrink-0">
            {/* Owner badge - clickable */}
            {property.owner && (
              <div
                className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/60 cursor-pointer hover:bg-background transition-colors"
                onClick={handleOwnerClick}
              >
                <img
                  src={property.owner.avatar_url || "/placeholder.svg"}
                  alt={property.owner.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <p className="text-xs font-medium text-foreground leading-tight hover:underline">{property.owner.name}</p>
                  <p className="text-[11px] text-muted-foreground">Se profil</p>
                </div>
              </div>
            )}

            <img src={images[currentImageIndex]} alt={property.title} className="w-full h-full object-cover" />

            {images.length > 1 && (
              <>
                <button
                  aria-label="Forrige billede"
                  onClick={handlePrevImage}
                  className={cn("absolute left-4 top-1/2 -translate-y-1/2", imageChrome)}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  aria-label="Næste billede"
                  onClick={handleNextImage}
                  className={cn("absolute right-4 top-1/2 -translate-y-1/2", imageChrome)}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentImageIndex ? "bg-background" : "bg-background/60 hover:bg-background/80"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Property info */}
          <div className="overflow-y-auto px-6 py-6 flex-1">
            <h2 className="text-2xl font-medium tracking-tight text-foreground mb-1">{property.title}</h2>
            <p className="text-muted-foreground mb-6">
              {property.address}, {property.city}
            </p>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-secondary/20 border border-border/60 rounded-2xl">
              <div className="text-center">
                <p className="text-lg font-medium tracking-tight text-foreground">{property.monthly_rent.toLocaleString()} kr.</p>
                <p className="text-xs text-muted-foreground">pr. måned</p>
              </div>
              <div className="text-center border-x border-border/60">
                <p className="text-lg font-medium tracking-tight text-foreground">{property.size_sqm || "–"} m²</p>
                <p className="text-xs text-muted-foreground">størrelse</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-medium tracking-tight text-foreground">{property.room_count || 1}</p>
                <p className="text-xs text-muted-foreground">værelser</p>
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-foreground/40" />
                  <span className={eyebrowLabel}>Beskrivelse</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{property.description}</p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-foreground/40" />
                  <span className={eyebrowLabel}>Faciliteter</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="bg-secondary/20 border border-border/60 text-foreground/70">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="border-t border-border/60 pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-foreground/40" />
                <span className={eyebrowLabel}>Detaljer</span>
              </div>
              <div className="space-y-3 text-sm">
                {property.is_furnished !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Møbleret</span>
                    <span className="font-medium">{property.is_furnished ? "Ja" : "Nej"}</span>
                  </div>
                )}
                {property.bills_included !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Forbrug inkluderet</span>
                    <span className="font-medium">{property.bills_included ? "Ja" : "Nej"}</span>
                  </div>
                )}
                {property.available_from && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ledig fra</span>
                    <span className="font-medium">{new Date(property.available_from).toLocaleDateString("da-DK")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky footer actions */}
          <div className="border-t border-border/60 px-6 py-4 flex gap-3 bg-background">
            <Button
              variant="outline"
              onClick={() => {
                onIgnore();
                handleClose();
              }}
              className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground border-none rounded-full py-6 font-medium"
            >
              <X className="w-5 h-5 mr-2" />
              Ignorer
            </Button>
            <Button
              onClick={() => {
                onConnect();
                handleClose();
              }}
              className="flex-1 bg-foreground hover:bg-foreground/90 text-background rounded-full py-6 font-medium"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Send anmodning
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return null;
};

export default MatchProfileModal;
