import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { danishCities } from "@/data/danishCities";
import { HousingGroup } from "@/hooks/useHousingGroups";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { X, User, UserPlus, LogOut, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import InviteMemberModal from "./InviteMemberModal";

interface ConnectedRoomie {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  age: number | null;
}

interface EditGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: HousingGroup | null;
  onGroupUpdated: () => void;
  connectedRoomies?: ConnectedRoomie[];
  onInvite?: (groupId: string, userIds: string[]) => Promise<void>;
  onLeaveGroup?: (groupId: string) => Promise<boolean>;
  onDeleteGroup?: (groupId: string) => Promise<boolean>;
}

const fieldLabel = "text-[11px] uppercase tracking-[0.18em] text-foreground/60";

const EditGroupModal = ({
  open,
  onOpenChange,
  group,
  onGroupUpdated,
  connectedRoomies = [],
  onInvite,
  onLeaveGroup,
  onDeleteGroup,
}: EditGroupModalProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [budgetPerPerson, setBudgetPerPerson] = useState("");
  const [desiredRooms, setDesiredRooms] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);

  const isCreator = group?.created_by === user?.id;
  const acceptedMembers = group?.members?.filter((m) => m.status === "accepted") || [];
  const pendingMembers = group?.members?.filter((m) => m.status === "pending") || [];

  useEffect(() => {
    if (group) {
      setName(group.name);
      setCity(group.city || "");
      setBudgetPerPerson(group.budget_per_person?.toString() || "");
      setDesiredRooms(group.desired_rooms?.toString() || "");
    }
  }, [group]);

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    if (!group || !isCreator) return;

    // Can't remove the creator
    if (memberUserId === group.created_by) {
      toast.error("Du kan ikke fjerne gruppens opretteren");
      return;
    }

    setRemovingMemberId(memberId);
    try {
      const { error } = await supabase
        .from("housing_group_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Medlem fjernet fra gruppen");
      onGroupUpdated();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Kunne ikke fjerne medlemmet");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleSave = async () => {
    if (!group || !name.trim() || !isCreator || saving) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("housing_groups")
        .update({
          name: name.trim(),
          city: city || null,
          budget_per_person: budgetPerPerson ? parseInt(budgetPerPerson) : null,
          desired_rooms: desiredRooms ? parseInt(desiredRooms) : null,
        })
        .eq("id", group.id);

      if (error) throw error;

      toast.success("Gruppe opdateret");
      onGroupUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("Kunne ikke opdatere gruppen");
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!group || !onLeaveGroup || isCreator) return;

    setLeavingGroup(true);
    try {
      const success = await onLeaveGroup(group.id);
      if (success) {
        toast.success("Du har forladt gruppen");
        onOpenChange(false);
      } else {
        toast.error("Kunne ikke forlade gruppen");
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error("Kunne ikke forlade gruppen");
    } finally {
      setLeavingGroup(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || !onDeleteGroup || !isCreator) return;
    setDeleting(true);
    try {
      const success = await onDeleteGroup(group.id);
      if (success) {
        toast.success("Gruppen er slettet");
        onOpenChange(false);
      } else {
        toast.error("Kunne ikke slette gruppen");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Kunne ikke slette gruppen");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
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
              <span className="text-[11px] uppercase tracking-[0.22em] text-foreground/60">Gruppe</span>
            </div>
            <SheetTitle className="text-2xl font-medium tracking-tight text-foreground">
              {isCreator ? "Rediger gruppe." : "Gruppeindstillinger."}
            </SheetTitle>
          </SheetHeader>

          {/* Scrollable content */}
          <div className="overflow-y-auto px-6 py-6 flex-1 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="group-name" className={fieldLabel}>Gruppenavn</Label>
              <Input
                id="group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Fx 'Studiebolig 2025'"
                disabled={!isCreator}
                className="rounded-xl border-border/60 h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className={fieldLabel}>By</Label>
              <Select value={city} onValueChange={setCity} disabled={!isCreator}>
                <SelectTrigger className="rounded-xl border-border/60 h-11">
                  <SelectValue placeholder="Vælg by" />
                </SelectTrigger>
                <SelectContent>
                  {danishCities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget" className={fieldLabel}>Budget pr. person (kr/md)</Label>
              <Input
                id="budget"
                type="number"
                value={budgetPerPerson}
                onChange={(e) => setBudgetPerPerson(e.target.value)}
                placeholder="Fx 5000"
                disabled={!isCreator}
                className="rounded-xl border-border/60 h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rooms" className={fieldLabel}>Antal værelser</Label>
              <Select value={desiredRooms} onValueChange={setDesiredRooms} disabled={!isCreator}>
                <SelectTrigger className="rounded-xl border-border/60 h-11">
                  <SelectValue placeholder="Vælg antal" />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} værelser
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Members section - only show for creator */}
            {isCreator && (
              <div className="space-y-3 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between pt-4">
                  <Label className={fieldLabel}>Medlemmer</Label>
                  {onInvite && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInviteModal(true)}
                      className="gap-1.5 rounded-full border-border/60"
                    >
                      <UserPlus className="h-4 w-4" />
                      Tilføj
                    </Button>
                  )}
                </div>

                {/* Pending invitations */}
                {pendingMembers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-foreground/50">Afventer svar</p>
                    {pendingMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-2xl border border-dashed border-border/70"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={member.profile?.avatar_url || undefined} />
                            <AvatarFallback>
                              {member.profile?.name?.charAt(0) || <User className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium">{member.profile?.name || "Ukendt"}</p>
                        </div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-foreground/60">Afventer</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Accepted members */}
                {acceptedMembers.length > 0 && (
                  <div className="space-y-2">
                    {acceptedMembers.map((member) => {
                      const isGroupCreator = member.user_id === group?.created_by;
                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 rounded-2xl border border-border/60"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={member.profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                {member.profile?.name?.charAt(0) || <User className="h-4 w-4" />}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-medium">
                              {member.profile?.name || "Ukendt"}
                              {isGroupCreator && (
                                <span className="ml-2 text-xs text-foreground/50">(opretteren)</span>
                              )}
                            </p>
                          </div>
                          {!isGroupCreator && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                              onClick={() => handleRemoveMember(member.id, member.user_id)}
                              disabled={removingMemberId === member.id}
                              aria-label="Fjern medlem"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {acceptedMembers.length === 0 && pendingMembers.length === 0 && (
                  <p className="text-sm text-foreground/50 text-center py-4">
                    Ingen medlemmer endnu. Tilføj roomies til gruppen.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div className="border-t border-border/60 px-6 py-4 flex items-center justify-between gap-3 bg-background">
            {!isCreator && onLeaveGroup ? (
              <Button
                variant="ghost"
                onClick={handleLeaveGroup}
                disabled={leavingGroup}
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
              >
                <LogOut className="h-4 w-4" />
                {leavingGroup ? "Forlader..." : "Forlad"}
              </Button>
            ) : isCreator && onDeleteGroup ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    disabled={deleting}
                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleting ? "Sletter..." : "Slet"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Slet gruppen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Gruppen og alle dens beskeder slettes permanent. Denne handling kan ikke fortrydes.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuller</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteGroup}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Slet permanent
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-full text-foreground/70"
              >
                {isCreator ? "Annuller" : "Luk"}
              </Button>
              {isCreator && (
                <Button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold px-5"
                >
                  {saving ? "Gemmer..." : "Gem ændringer"}
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Invite Members Modal */}
      {onInvite && (
        <InviteMemberModal
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          group={group}
          connectedRoomies={connectedRoomies}
          onInvite={onInvite}
        />
      )}
    </>
  );
};

export default EditGroupModal;
