import { HousingGroup } from "@/hooks/useHousingGroups";
import { Settings, Users, User, Plus, MessageSquare, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";

interface YourGroupsSectionProps {
  groups: HousingGroup[];
  loading: boolean;
  onSelectGroup: (group: HousingGroup) => void;
  onEditGroup: (group: HousingGroup) => void;
  onCreateGroup: () => void;
}

const YourGroupsSection = ({
  groups,
  loading,
  onSelectGroup,
  onEditGroup,
  onCreateGroup,
}: YourGroupsSectionProps) => {
  if (loading) {
    return (
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-px w-6 bg-foreground/40" />
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">Dine grupper</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-px w-6 bg-foreground/40" />
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">Dine grupper</span>
          </div>
          {groups.length > 0 && (
            <p className="text-sm text-foreground/60">Tryk på en gruppe for at åbne chat og fælles boligsøgning</p>
          )}
        </div>
        <Button
          onClick={onCreateGroup}
          size="sm"
          className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-9 px-4 gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Opret gruppe
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="border border-dashed border-border/60 rounded-2xl">
          <EmptyState
            icon={Users}
            tone="primary"
            variant="compact"
            title="Du har ingen grupper endnu"
            description="Opret en gruppe og invitér dine roomie-forbindelser."
            actionLabel={<><Plus className="w-4 h-4 mr-1" />Opret gruppe</>}
            onAction={onCreateGroup}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => {
            const acceptedMembers = group.members?.filter(m => m.status === "accepted") || [];

            return (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group)}
                className="group text-left rounded-2xl border border-border/60 bg-background p-5 hover:border-foreground/40 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {acceptedMembers.slice(0, 3).map((member, idx) => (
                        <div
                          key={member.id}
                          className="w-9 h-9 rounded-full border-2 border-background overflow-hidden bg-muted"
                          style={{ zIndex: 3 - idx }}
                        >
                          {member.profile?.avatar_url ? (
                            <img
                              src={member.profile.avatar_url}
                              alt={member.profile.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-4 h-4 text-foreground/50" />
                            </div>
                          )}
                        </div>
                      ))}
                      {acceptedMembers.length > 3 && (
                        <div className="w-9 h-9 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                          <span className="text-xs text-foreground/70 font-medium">
                            +{acceptedMembers.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-foreground/60">
                      {acceptedMembers.length} {acceptedMembers.length === 1 ? "medlem" : "medlemmer"}
                    </div>
                  </div>

                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditGroup(group);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        onEditGroup(group);
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-foreground/70" />
                  </span>
                </div>

                <h3 className="font-semibold text-foreground text-lg mb-1 truncate">
                  {group.name}
                </h3>
                {group.budget_per_person && (
                  <p className="text-xs text-foreground/60 mb-4">
                    Budget: {group.budget_per_person.toLocaleString()} kr/person
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-border/60">
                  <div className="flex items-center gap-3 text-xs text-foreground/70">
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5" />
                      Boliger
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground group-hover:gap-2 transition-all">
                    Åbn gruppe
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default YourGroupsSection;
