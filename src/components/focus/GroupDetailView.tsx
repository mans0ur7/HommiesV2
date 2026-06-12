import { useState } from "react";
import { HousingGroup } from "@/hooks/useHousingGroups";
import { ArrowLeft, Settings, User, MessageSquare, Home, LayoutDashboard } from "lucide-react";
import GroupChat from "./GroupChat";
import GroupPropertiesFeed from "./GroupPropertiesFeed";
import HouseholdHub from "./HouseholdHub";

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
  const [activeTab, setActiveTab] = useState<"beskeder" | "boliger" | "husstand">("beskeder");

  const acceptedMembers = group.members?.filter(m => m.status === "accepted") || [];

  const tabs = [
    { id: "beskeder" as const, label: "Beskeder", icon: MessageSquare },
    { id: "boliger" as const, label: "Boliger", icon: Home },
    { id: "husstand" as const, label: "Husstand", icon: LayoutDashboard },
  ];

  // Full-height, one-page layout: compact header + tabs are fixed, the content
  // (chat or properties) fills the rest. The app header/bottom-nav are hidden by
  // the parent on mobile, so we add safe-area padding here.
  return (
    <div className="flex flex-1 flex-col min-h-0 w-full max-w-3xl mx-auto px-3 md:px-6 pt-[calc(var(--safe-top)+0.5rem)] md:pt-5">
      {/* Compact header */}
      <div className="shrink-0 flex items-center gap-3 pb-3 border-b border-border/60">
        <button
          onClick={onBack}
          className="w-9 h-9 -ml-1 rounded-full hover:bg-muted flex items-center justify-center text-foreground/70 shrink-0"
          aria-label="Tilbage"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex -space-x-2 shrink-0">
          {acceptedMembers.slice(0, 3).map((member, idx) => (
            <div
              key={member.id}
              className="w-8 h-8 rounded-full border-2 border-background overflow-hidden bg-secondary/20"
              style={{ zIndex: 3 - idx }}
            >
              {member.profile?.avatar_url ? (
                <img src={member.profile.avatar_url} alt={member.profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-4 h-4 text-foreground/50" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-foreground text-base leading-tight truncate">{group.name}</h2>
          <p className="text-xs text-foreground/55 truncate">
            {acceptedMembers.length} {acceptedMembers.length === 1 ? "medlem" : "medlemmer"}
            {group.budget_per_person ? ` · ${group.budget_per_person.toLocaleString("da-DK")} kr/pers.` : ""}
          </p>
        </div>

        <button
          onClick={() => onEditGroup(group)}
          className="w-9 h-9 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center text-foreground/70 shrink-0"
          aria-label="Indstillinger"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs — split full-width on mobile (3 tabs), fit content on desktop */}
      <div className="shrink-0 py-3">
        <div className="flex w-full sm:inline-flex sm:w-auto p-1 rounded-full bg-muted">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none min-w-0 inline-flex items-center justify-center gap-2 px-2.5 sm:px-5 py-2 rounded-full text-[13px] sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content fills the remaining height */}
      <div className="flex-1 min-h-0 pb-[calc(0.5rem+var(--safe-bottom))]">
        {activeTab === "beskeder" ? (
          <div className="h-full rounded-2xl border border-border/60 overflow-hidden">
            <GroupChat group={group} />
          </div>
        ) : activeTab === "boliger" ? (
          <div className="h-full overflow-y-auto">
            <GroupPropertiesFeed
              group={group}
              groupId={group.id}
              onSendRequest={onSendRequest}
              sentRequestPropertyIds={sentRequestPropertyIds}
            />
          </div>
        ) : (
          // Husstands-hub — full-bleed on mobile, card-like on desktop (the
          // hub's hero is md:rounded-3xl); the "Gruppe-chat" quick link and
          // any "tilbage" intent routes back to the chat tab.
          <div className="h-full overflow-y-auto -mx-3 md:mx-0">
            <HouseholdHub group={group} embedded onBack={() => setActiveTab("beskeder")} />
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetailView;
