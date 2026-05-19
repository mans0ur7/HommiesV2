import { useState } from "react";
import { HousingGroup } from "@/hooks/useHousingGroups";
import { ArrowLeft, Settings, User, MessageSquare, Home, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import GroupChat from "./GroupChat";
import GroupPropertiesFeed from "./GroupPropertiesFeed";

interface GroupDetailViewProps {
  group: HousingGroup;
  onBack: () => void;
  onEditGroup: (group: HousingGroup) => void;
  onSendRequest: (data: {
    group_id: string;
    property_id: string;
    landlord_id: string;
    message?: string;
    desired_rooms?: number;
  }) => Promise<boolean>;
  sentRequestPropertyIds: string[];
}

const GroupDetailView = ({
  group,
  onBack,
  onEditGroup,
  onSendRequest,
  sentRequestPropertyIds,
}: GroupDetailViewProps) => {
  const [activeTab, setActiveTab] = useState<"beskeder" | "boliger">("beskeder");

  const acceptedMembers = group.members?.filter(m => m.status === "accepted") || [];

  const tabs = [
    { id: "beskeder" as const, label: "Beskeder", icon: MessageSquare },
    { id: "boliger" as const, label: "Boliger", icon: Home },
  ];

  return (
    <div className="space-y-5">
      {/* Back navigation */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 px-3 h-9 -ml-3 text-muted-foreground hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Tilbage til Focus</span>
      </Button>

      {/* Elegant group header card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary via-primary to-primary/80 p-6 md:p-8">
        {/* Decorative blob */}
        <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-20 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <button
          onClick={() => onEditGroup(group)}
          className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-xs font-medium transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Indstillinger
        </button>

        <div className="relative">
          <div className="flex -space-x-3 mb-4">
            {acceptedMembers.slice(0, 4).map((member, idx) => (
              <div
                key={member.id}
                className="w-12 h-12 rounded-full border-[3px] border-primary overflow-hidden bg-white/20"
                style={{ zIndex: 4 - idx }}
              >
                {member.profile?.avatar_url ? (
                  <img
                    src={member.profile.avatar_url}
                    alt={member.profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white/70" />
                  </div>
                )}
              </div>
            ))}
            {acceptedMembers.length > 4 && (
              <div className="w-12 h-12 rounded-full border-[3px] border-primary bg-white/20 flex items-center justify-center">
                <span className="text-xs text-white font-semibold">
                  +{acceptedMembers.length - 4}
                </span>
              </div>
            )}
          </div>

          <h2 className="font-semibold text-white text-2xl md:text-3xl tracking-tight">
            {group.name}
          </h2>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {acceptedMembers.length} {acceptedMembers.length === 1 ? "medlem" : "medlemmer"}
            </span>
            {group.budget_per_person && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-white/50" />
                {group.budget_per_person.toLocaleString()} kr / person
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Segmented tabs */}
      <div className="inline-flex p-1 rounded-full bg-muted">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div>
        {activeTab === "beskeder" && (
          <div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
            <GroupChat group={group} />
          </div>
        )}
        {activeTab === "boliger" && (
          <GroupPropertiesFeed
            group={group}
            groupId={group.id}
            onSendRequest={onSendRequest}
            sentRequestPropertyIds={sentRequestPropertyIds}
          />
        )}
      </div>
    </div>
  );
};

export default GroupDetailView;
