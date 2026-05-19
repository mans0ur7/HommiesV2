import { useState } from "react";
import { GroupMember } from "@/hooks/useHousingGroups";
import { Button } from "@/components/ui/button";
import { Users, Check, X, ChevronRight } from "lucide-react";
import GroupInvitationModal from "./GroupInvitationModal";

interface PendingGroupInvitationsProps {
  invitations: (GroupMember & {
    housing_groups?: {
      id: string;
      name: string;
      city: string | null;
      area: string | null;
      budget_per_person: number | null;
      budget_total: number | null;
      desired_rooms: number | null;
      created_by: string;
    };
    inviterProfile?: {
      name: string;
      avatar_url: string | null;
    };
  })[];
  onRespond: (memberId: string, accept: boolean) => Promise<boolean>;
}

const PendingGroupInvitations = ({
  invitations,
  onRespond,
}: PendingGroupInvitationsProps) => {
  const [selectedInvitation, setSelectedInvitation] = useState<typeof invitations[0] | null>(null);

  if (invitations.length === 0) return null;

  return (
    <>
      <div className="mb-6 p-4 bg-gradient-to-r from-secondary/10 via-secondary/15 to-secondary/10 rounded-xl border border-secondary/20">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
          Gruppe-invitationer ({invitations.length})
        </h3>

        <div className="space-y-3">
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() => setSelectedInvitation(inv)}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {inv.housing_groups?.name || "Ukendt gruppe"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Inviteret af {inv.inviterProfile?.name || "Ukendt"}
                  {inv.housing_groups?.city && ` · ${inv.housing_groups.city}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Quick action buttons */}
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRespond(inv.id, false);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRespond(inv.id, true);
                  }}
                >
                  <Check className="w-4 h-4" />
                </Button>
                {/* Arrow to indicate clickable */}
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Group details modal */}
      <GroupInvitationModal
        open={!!selectedInvitation}
        onClose={() => setSelectedInvitation(null)}
        group={selectedInvitation?.housing_groups ? {
          id: selectedInvitation.housing_groups.id,
          name: selectedInvitation.housing_groups.name,
          city: selectedInvitation.housing_groups.city,
          area: selectedInvitation.housing_groups.area,
          budget_per_person: selectedInvitation.housing_groups.budget_per_person,
          budget_total: selectedInvitation.housing_groups.budget_total,
          desired_rooms: selectedInvitation.housing_groups.desired_rooms,
          created_by: selectedInvitation.housing_groups.created_by,
        } : null}
        inviterId={selectedInvitation?.invited_by || ""}
        inviterName={selectedInvitation?.inviterProfile?.name || "Ukendt"}
        inviterAvatar={selectedInvitation?.inviterProfile?.avatar_url || null}
        memberId={selectedInvitation?.id || ""}
        onRespond={onRespond}
      />
    </>
  );
};

export default PendingGroupInvitations;
