import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X, ChevronLeft, ChevronRight, Sparkles, Calendar, Wallet, Globe, ArrowRight, Flag, Ban } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
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

const MatchProfileModal = ({ profile, property, open, onClose, onConnect, onIgnore }: MatchProfileModalProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
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
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden max-h-[90vh] md:max-h-[90vh]" aria-describedby={undefined}>
          <VisuallyHidden>
            <DialogTitle>{profile.name}</DialogTitle>
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label={t("report.reportTrigger")}
                    className="absolute top-4 right-4 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setBlockConfirmOpen(true)}
                    className="cursor-pointer text-orange-600 focus:text-orange-600"
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
              <h2 className="text-2xl font-bold text-foreground mb-1">{profile.name}</h2>
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
                  <h3 className="text-sm font-semibold text-foreground mb-3">Personlighed</h3>
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
                  <h3 className="text-sm font-semibold text-foreground mb-3">Livsstil</h3>
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
                  <h3 className="text-sm font-semibold text-foreground mb-3">Sprog</h3>
                  <p className="text-muted-foreground">{profile.languages.join(", ")}</p>
                </div>
              )}

              {/* About */}
              {profile.bio && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Om mig</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{profile.bio}</p>
                  <button className="text-primary text-sm font-medium mt-2 flex items-center gap-1 hover:underline">
                    Læs mere <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Rent preferences */}
              {(profile.monthly_budget || profile.rental_period) && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Lejepræferencer</h3>
                  <div className="space-y-3">
                    {profile.monthly_budget && (
                      <div className="flex items-center gap-3 text-sm">
                        <Wallet className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Månedligt budget</span>
                        <span className="font-medium ml-auto">{profile.monthly_budget.toLocaleString()} kr.</span>
                      </div>
                    )}
                    {profile.rental_period && (
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Lejeperiode</span>
                        <span className="font-medium ml-auto">{profile.rental_period}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons - sticky at bottom on mobile */}
              <div className="flex gap-3 pt-6 pb-6">
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
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6 font-medium"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Forbind
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label={t("report.reportTrigger")}
                    className="absolute top-4 right-4 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setBlockConfirmOpen(true)}
                    className="cursor-pointer text-orange-600 focus:text-orange-600"
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

              {/* Action buttons on image - desktop */}
              <div className="absolute bottom-8 left-4 right-4 flex gap-3">
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
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6 font-medium"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Forbind
                </Button>
              </div>
            </div>

            {/* Right: Profile info */}
            <div className="p-8 overflow-y-auto max-h-[90vh]">
              <h2 className="text-2xl font-bold text-foreground mb-1">{profile.name}</h2>
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
                  <h3 className="text-sm font-semibold text-foreground mb-3">Personlighed</h3>
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
                  <h3 className="text-sm font-semibold text-foreground mb-3">Livsstil</h3>
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
                  <h3 className="text-sm font-semibold text-foreground mb-3">Sprog</h3>
                  <p className="text-muted-foreground">{profile.languages.join(", ")}</p>
                </div>
              )}

              {/* About */}
              {profile.bio && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Om mig</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Rent preferences */}
              {(profile.monthly_budget || profile.rental_period) && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Lejepræferencer</h3>
                  <div className="space-y-3">
                    {profile.monthly_budget && (
                      <div className="flex items-center gap-3 text-sm">
                        <Wallet className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Månedligt budget</span>
                        <span className="font-medium ml-auto">{profile.monthly_budget.toLocaleString()} kr.</span>
                      </div>
                    )}
                    {profile.rental_period && (
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Lejeperiode</span>
                        <span className="font-medium ml-auto">{profile.rental_period}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
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
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                {isBlocking ? t("block.blocking") : t("block.confirmAction")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Dialog>
    );
  }

  // Property view
  if (property) {
    const images = property.images?.length ? property.images : ["/placeholder.svg"];

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden max-h-[90vh]" aria-describedby={undefined}>
          <VisuallyHidden>
            <DialogTitle>{property.title}</DialogTitle>
          </VisuallyHidden>
          {/* Mobile: Single column scrollable layout (iOS-friendly scrolling) */}
          <div className="md:hidden h-[90dvh] overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
            <div className="relative bg-muted h-64">
              <button
                onClick={handleClose}
                className="absolute top-4 left-4 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {property.owner && (
                <div
                  className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md cursor-pointer hover:bg-white transition-colors"
                  onClick={handleOwnerClick}
                >
                  <img
                    src={property.owner.avatar_url || "/placeholder.svg"}
                    alt={property.owner.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-medium text-foreground leading-tight hover:underline">{property.owner.name}</p>
                    <p className="text-[10px] text-muted-foreground">Se profil</p>
                  </div>
                </div>
              )}

              <img src={images[currentImageIndex]} alt={property.title} className="w-full h-full object-cover" />

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
                          idx === currentImageIndex ? "bg-white scale-110" : "bg-white/60 hover:bg-white/80"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-6">
              {/* Action buttons */}
              <div className="flex gap-3 pb-6">
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
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6 font-medium"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Send anmodning
                </Button>
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-1">{property.title}</h2>
              <p className="text-muted-foreground mb-6">
                {property.address}, {property.city}
              </p>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted rounded-xl">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{property.monthly_rent.toLocaleString()} kr.</p>
                  <p className="text-xs text-muted-foreground">pr. måned</p>
                </div>
                <div className="text-center border-x border-border">
                  <p className="text-lg font-bold text-foreground">{property.size_sqm || "–"} m²</p>
                  <p className="text-xs text-muted-foreground">størrelse</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{property.room_count || 1}</p>
                  <p className="text-xs text-muted-foreground">værelser</p>
                </div>
              </div>

              {/* Description */}
              {property.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Beskrivelse</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{property.description}</p>
                </div>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Faciliteter</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary" className="bg-muted">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Detaljer</h3>
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

              {/* Owner badge - clickable */}
              {property.owner && (
                <div
                  className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md cursor-pointer hover:bg-white transition-colors"
                  onClick={handleOwnerClick}
                >
                  <img
                    src={property.owner.avatar_url || "/placeholder.svg"}
                    alt={property.owner.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-medium text-foreground leading-tight hover:underline">{property.owner.name}</p>
                    <p className="text-[10px] text-muted-foreground">Se profil</p>
                  </div>
                </div>
              )}

              <img src={images[currentImageIndex]} alt={property.title} className="w-full h-full object-cover" />

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
                          idx === currentImageIndex ? "bg-white scale-110" : "bg-white/60 hover:bg-white/80"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Action buttons on image */}
              <div className="absolute bottom-8 left-4 right-4 flex gap-3">
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
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6 font-medium"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Send anmodning
                </Button>
              </div>
            </div>

            {/* Right: Property info */}
            <div className="p-6 md:p-8 overflow-y-auto max-h-[90vh]">
              <h2 className="text-2xl font-bold text-foreground mb-1">{property.title}</h2>
              <p className="text-muted-foreground mb-6">{property.address}, {property.city}</p>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted rounded-xl">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{property.monthly_rent.toLocaleString()} kr.</p>
                  <p className="text-xs text-muted-foreground">pr. måned</p>
                </div>
                <div className="text-center border-x border-border">
                  <p className="text-lg font-bold text-foreground">{property.size_sqm || "–"} m²</p>
                  <p className="text-xs text-muted-foreground">størrelse</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{property.room_count || 1}</p>
                  <p className="text-xs text-muted-foreground">værelser</p>
                </div>
              </div>

              {/* Description */}
              {property.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Beskrivelse</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{property.description}</p>
                </div>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Faciliteter</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary" className="bg-muted">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Detaljer</h3>
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
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
};

export default MatchProfileModal;
