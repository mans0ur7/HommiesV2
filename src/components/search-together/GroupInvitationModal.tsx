import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Wallet, Home, Check, X, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GroupMemberProfile {
  user_id: string;
  status: string;
  profile: {
    name: string;
    avatar_url: string | null;
    age: number | null;
  } | null;
}

interface GroupDetails {
  id: string;
  name: string;
  city: string | null;
  area: string | null;
  budget_per_person: number | null;
  budget_total: number | null;
  desired_rooms: number | null;
  created_by: string;
}

interface GroupInvitationModalProps {
  open: boolean;
  onClose: () => void;
  group: GroupDetails | null;
  inviterId: string;
  inviterName: string;
  inviterAvatar: string | null;
  memberId: string;
  onRespond: (memberId: string, accept: boolean) => Promise<boolean>;
}

const GroupInvitationModal = ({
  open,
  onClose,
  group,
  inviterId,
  inviterName,
  inviterAvatar,
  memberId,
  onRespond,
}: GroupInvitationModalProps) => {
  const [members, setMembers] = useState<GroupMemberProfile[]>([]);
  const [creatorProfile, setCreatorProfile] = useState<{ name: string; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (open && group) {
      fetchGroupMembers();
    }
  }, [open, group]);

  const fetchGroupMembers = async () => {
    if (!group) return;
    setLoading(true);

    try {
      // Fetch all members of the group
      const { data: membersData } = await supabase
        .from("housing_group_members")
        .select("user_id, status")
        .eq("group_id", group.id)
        .eq("status", "accepted");

      // Fetch profiles for members
      const membersWithProfiles = await Promise.all(
        (membersData || []).map(async (m) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, avatar_url, age")
            .eq("user_id", m.user_id)
            .maybeSingle();

          return {
            ...m,
            profile,
          };
        })
      );

      setMembers(membersWithProfiles);

      // Fetch creator profile
      const { data: creator } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("user_id", group.created_by)
        .maybeSingle();

      setCreatorProfile(creator);
    } catch (error) {
      console.error("Error fetching group members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (accept: boolean) => {
    setResponding(true);
    const success = await onRespond(memberId, accept);
    setResponding(false);
    if (success) {
      onClose();
    }
  };

  if (!group) return null;

  // Combine creator + accepted members (avoid duplicates)
  const allMembers = [
    // Creator first
    ...(creatorProfile
      ? [
          {
            user_id: group.created_by,
            status: "creator",
            profile: { ...creatorProfile, age: null as number | null },
          },
        ]
      : []),
    // Then other accepted members (excluding creator)
    ...members.filter((m) => m.user_id !== group.created_by),
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {group.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Invited by */}
          <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg border border-secondary/20">
            {inviterAvatar ? (
              <img
                src={inviterAvatar}
                alt={inviterName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{inviterName}</p>
              <p className="text-xs text-muted-foreground">har inviteret dig</p>
            </div>
          </div>

          {/* Group details */}
          <div className="grid grid-cols-2 gap-3">
            {group.city && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{group.city}</span>
              </div>
            )}
            {group.budget_per_person && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="w-4 h-4" />
                <span>{group.budget_per_person.toLocaleString()} kr/md</span>
              </div>
            )}
            {group.desired_rooms && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Home className="w-4 h-4" />
                <span>{group.desired_rooms} værelser</span>
              </div>
            )}
          </div>

          {/* Members */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Medlemmer ({allMembers.length})
            </h4>

            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-muted" />
                    <div className="h-4 w-24 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {allMembers.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    {member.profile?.avatar_url ? (
                      <img
                        src={member.profile.avatar_url}
                        alt={member.profile.name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.profile?.name || "Ukendt"}
                      </p>
                      {member.status === "creator" && (
                        <p className="text-[10px] text-primary font-medium">Oprettet gruppen</p>
                      )}
                    </div>
                  </div>
                ))}

                {allMembers.length === 0 && !loading && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Ingen medlemmer endnu
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <Button
            variant="outline"
            onClick={() => handleRespond(false)}
            disabled={responding}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Afvis
          </Button>
          <Button
            onClick={() => handleRespond(true)}
            disabled={responding}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            {responding ? "Accepterer..." : "Accepter"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupInvitationModal;
