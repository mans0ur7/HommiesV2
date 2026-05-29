import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Check, X, Briefcase, GraduationCap, Globe, ExternalLink, Flag, MoreVertical, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
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
import ReportUserModal from "@/components/ReportUserModal";

interface MatchRequest {
  id: string;
  sender_id: string;
  status: string;
  type: "landlord" | "roomie";
  created_at: string;
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
    age: number | null;
    study: string | null;
  };
}

interface FullProfile {
  name: string;
  avatar_url: string | null;
  images: string[] | null;
  age: number | null;
  gender: string | null;
  study: string | null;
  work: string | null;
  bio: string | null;
  personality: string[] | null;
  lifestyle: string[] | null;
  languages: string[] | null;
  monthly_budget: number | null;
  rental_period: string | null;
  nationality: string | null;
}

interface RequestProfileModalProps {
  request: MatchRequest | null;
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}

const RequestProfileModal = ({
  request,
  open,
  onClose,
  onAccept,
  onReject,
}: RequestProfileModalProps) => {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const handleBlock = async () => {
    if (!request || !user) return;
    setIsBlocking(true);
    try {
      // Reject the request first so it disappears from the list
      onReject();
      const { error } = await supabase
        .from("blocked_users")
        .insert({ user_id: user.id, blocked_user_id: request.sender_id });
      if (error && !error.message?.includes("duplicate")) throw error;
      toast.success(t("block.blocked", { name: profile?.name ?? "" }));
      setBlockConfirmOpen(false);
      onClose();
    } catch (err) {
      console.error("Block failed:", err);
      toast.error(t("block.failed"));
    } finally {
      setIsBlocking(false);
    }
  };

  useEffect(() => {
    if (request && open) {
      fetchFullProfile();
    }
  }, [request, open]);

  const fetchFullProfile = async () => {
    if (!request) return;
    setLoading(true);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", request.sender_id)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
    setLoading(false);
  };

  if (!request) return null;
  
  // Loading state
  if (loading || !profile) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
          <div className="flex items-center justify-center h-[300px] bg-gradient-to-br from-muted/50 to-muted">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-muted-foreground">Indlæser profil...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getGenderLabel = (gender: string | null) => {
    if (!gender) return null;
    const genderMap: Record<string, string> = {
      'male': 'Mand',
      'female': 'Kvinde',
      'other': 'Andet'
    };
    return genderMap[gender.toLowerCase()] || gender;
  };

  const handleViewProfile = () => {
    onClose();
    navigate(`/user/${request.sender_id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-sm p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl"
        aria-describedby={undefined}
      >
        <VisuallyHidden.Root>
          <DialogTitle>Anmodning fra {profile?.name || 'bruger'}</DialogTitle>
        </VisuallyHidden.Root>

        {/* View Profile Button - Top Left */}
        <button
          onClick={handleViewProfile}
          className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm text-xs font-medium text-foreground/80 hover:text-foreground transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <ExternalLink className="w-3 h-3" />
          Vis profil
        </button>

        {/* Report dropdown - Top Right */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label={t("report.reportTrigger")}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm transition-colors shadow-sm"
            >
              <MoreVertical className="w-4 h-4" />
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

        {/* Header with Avatar */}
        <div className="relative bg-gradient-to-br from-primary/20 via-secondary/20 to-muted p-6 pt-12">
          {/* Avatar - Not clickable */}
          <div className="flex justify-center">
            {profile.avatar_url ? (
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-xl">
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-4 border-background shadow-xl">
                <span className="text-2xl font-bold text-white">
                  {getInitials(profile.name)}
                </span>
              </div>
            )}
          </div>

          {/* Name and basic info */}
          <div className="text-center mt-4">
            <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mt-1 flex-wrap">
              {profile.age && <span>{profile.age} år</span>}
              {profile.gender && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                  <span>{getGenderLabel(profile.gender)}</span>
                </>
              )}
              {profile.nationality && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {profile.nationality}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Study/Work Section */}
        <div className="p-4 bg-background">
          {(profile.study || profile.work) ? (
            <div className="flex flex-wrap gap-2 justify-center">
              {profile.study && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <GraduationCap className="w-4 h-4" />
                  {profile.study}
                </div>
              )}
              {profile.work && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                  <Briefcase className="w-4 h-4" />
                  {profile.work}
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm">
                <Briefcase className="w-4 h-4" />
                unemployed
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 pt-0 bg-background">
          <div className="flex gap-3">
            <Button
              onClick={onAccept}
              className="flex-1 gap-2 h-11 text-base font-semibold rounded-xl"
            >
              <Check className="h-5 w-5" />
              Accepter
            </Button>
            <Button
              onClick={onReject}
              variant="outline"
              className="flex-1 gap-2 h-11 text-base font-semibold border-2 rounded-xl hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
            >
              <X className="h-5 w-5" />
              Afvis
            </Button>
          </div>
        </div>
      </DialogContent>
      {request && (
        <ReportUserModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          reportedUserId={request.sender_id}
          reportedUserName={profile?.name}
          onReported={onClose}
        />
      )}
      <AlertDialog open={blockConfirmOpen} onOpenChange={(o) => !isBlocking && setBlockConfirmOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("block.confirmTitle", { name: profile?.name ?? "" })}</AlertDialogTitle>
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
};

export default RequestProfileModal;
