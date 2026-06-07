import { useState } from "react";
import { GroupMember } from "@/hooks/useHousingGroups";
import { Users, Check, X, MapPin, Wallet, BedDouble, Loader2 } from "lucide-react";
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

const chip = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background border border-border/60 text-[11px] text-foreground/70";

const PendingGroupInvitations = ({
  invitations,
  onRespond,
}: PendingGroupInvitationsProps) => {
  const [selectedInvitation, setSelectedInvitation] = useState<typeof invitations[0] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (invitations.length === 0) return null;

  const respond = async (e: React.MouseEvent, memberId: string, accept: boolean) => {
    e.stopPropagation();
    if (busyId) return;
    setBusyId(memberId);
    await onRespond(memberId, accept);
    setBusyId(null);
  };

  return (
    <>
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-3">
          <span className="h-px w-8 bg-foreground/40" />
          <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">
            Gruppe-invitationer
          </span>
          <span className="text-[11px] text-foreground/40">{invitations.length}</span>
        </div>

        <div className="space-y-3">
          {invitations.map((inv) => {
            const g = inv.housing_groups;
            const busy = busyId === inv.id;
            return (
              <div
                key={inv.id}
                className="rounded-3xl border border-secondary/60 bg-secondary/10 overflow-hidden"
              >
                {/* Tappable info area opens full group details */}
                <button
                  type="button"
                  onClick={() => setSelectedInvitation(inv)}
                  className="w-full text-left p-4 flex items-start gap-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                    {inv.inviterProfile?.avatar_url ? (
                      <img
                        src={inv.inviterProfile.avatar_url}
                        alt={inv.inviterProfile?.name || "Afsender"}
                        className="w-12 h-12 object-cover"
                      />
                    ) : (
                      <Users className="w-6 h-6 text-secondary-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-foreground/50 mb-0.5">
                      Invitation
                    </p>
                    <p className="font-semibold text-foreground leading-tight truncate">
                      {g?.name || "Boliggruppe"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      <span className="font-medium text-foreground/80">
                        {inv.inviterProfile?.name || "En roomie"}
                      </span>{" "}
                      har inviteret dig
                    </p>

                    {(g?.city || g?.area || g?.budget_per_person || g?.desired_rooms) && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(g?.area || g?.city) && (
                          <span className={chip}>
                            <MapPin className="w-3 h-3" /> {g?.area || g?.city}
                          </span>
                        )}
                        {g?.budget_per_person ? (
                          <span className={chip}>
                            <Wallet className="w-3 h-3" /> {g.budget_per_person.toLocaleString("da-DK")} kr./pers.
                          </span>
                        ) : null}
                        {g?.desired_rooms ? (
                          <span className={chip}>
                            <BedDouble className="w-3 h-3" /> {g.desired_rooms} værelser
                          </span>
                        ) : null}
                      </div>
                    )}

                    <span className="inline-block text-xs text-foreground/50 underline underline-offset-2 mt-2">
                      Se gruppen
                    </span>
                  </div>
                </button>

                {/* Always-visible, touch-friendly actions */}
                <div className="flex gap-2 px-4 pb-4">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={(e) => respond(e, inv.id, false)}
                    className="flex-1 h-11 rounded-full border border-border/60 bg-background text-sm font-medium text-foreground/70 hover:bg-muted transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    <X className="w-4 h-4" />
                    Afvis
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={(e) => respond(e, inv.id, true)}
                    className="flex-1 h-11 rounded-full bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Accepter
                  </button>
                </div>
              </div>
            );
          })}
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
