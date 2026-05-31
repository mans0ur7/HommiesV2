import { Search, Home, User, UsersRound, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/ui/empty-state";
import { usePresence } from "@/hooks/usePresence";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  type: "landlord" | "roomie";
  updated_at: string;
  property_id?: string | null;
  group_id?: string | null;
  property?: {
    id: string;
    title: string;
    image?: string;
  } | null;
  groupInfo?: {
    id: string;
    name: string;
    memberCount: number;
    memberAvatars: (string | null)[];
  } | null;
  otherUser: {
    id: string;
    name: string;
    avatar_url: string | null;
    age: number | null;
    study: string | null;
    last_seen_at?: string | null;
  };
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unreadCount: number;
}

interface InboxConversationListProps {
  regularConversations: Conversation[];
  groupConversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loading: boolean;
  activeTab: "landlord" | "roomie";
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 px-3 py-2">
    <div className="h-px w-8 bg-foreground/40" />
    <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">{children}</span>
  </div>
);

const InboxConversationList = ({
  regularConversations,
  groupConversations,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  loading,
  activeTab,
}: InboxConversationListProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isOnline } = usePresence();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "I går";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("da-DK", { weekday: "short" });
    } else {
      return date.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
    }
  };

  const renderConversationItem = (conversation: Conversation, isGroup: boolean = false) => {
    const selected = selectedId === conversation.id;
    const unread = conversation.unreadCount > 0;
    const ringClass = selected
      ? "ring-2 ring-foreground/70"
      : unread
        ? "ring-2 ring-secondary"
        : "ring-1 ring-border/60";

    return (
      <button
        type="button"
        key={conversation.id}
        onClick={(e) => {
          e.preventDefault();
          onSelect(conversation);
        }}
        className={cn(
          "w-full flex items-center gap-3 p-3 cursor-pointer transition-colors text-left rounded-2xl group",
          selected ? "bg-muted" : "hover:bg-muted/50"
        )}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {isGroup && conversation.groupInfo ? (
            <div className={cn("relative w-11 h-11 rounded-full overflow-hidden bg-muted", ringClass)}>
              {conversation.groupInfo.memberAvatars.slice(0, 2).map((avatar, idx) => (
                <img
                  key={idx}
                  src={avatar || "/placeholder.svg"}
                  alt="Gruppemedlem"
                  className={cn(
                    "w-5 h-5 rounded-full border border-background object-cover absolute",
                    idx === 0 ? "top-1.5 left-1.5" : "bottom-1.5 right-1.5"
                  )}
                />
              ))}
              {conversation.groupInfo.memberAvatars.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <UsersRound className="w-4 h-4 text-foreground/50" />
                </div>
              )}
            </div>
          ) : conversation.otherUser.avatar_url ? (
            <img
              src={conversation.otherUser.avatar_url}
              alt={conversation.otherUser.name}
              className={cn("w-11 h-11 rounded-full object-cover bg-muted", ringClass)}
            />
          ) : (
            <div className={cn("w-11 h-11 rounded-full bg-muted flex items-center justify-center", ringClass)}>
              <User className="w-5 h-5 text-foreground/40" />
            </div>
          )}
          {unread && (
            <div className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-secondary rounded-full flex items-center justify-center">
              <span className="text-[9px] font-bold text-secondary-foreground">
                {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
              </span>
            </div>
          )}
          {!isGroup && isOnline(conversation.otherUser.id) && !unread && (
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background"
              title="Online nu"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={cn("text-sm truncate", unread ? "font-semibold text-foreground" : "font-medium text-foreground/90")}>
                {conversation.groupInfo?.name || conversation.otherUser.name}
              </span>
              {isGroup ? (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-muted text-foreground/70 text-[9px] font-semibold flex-shrink-0">
                  <UsersRound className="w-2.5 h-2.5" />
                  Gruppe
                </span>
              ) : (
                <span
                  className={cn(
                    "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold flex-shrink-0",
                    activeTab === "landlord" ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {activeTab === "landlord" ? <Home className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                  {activeTab === "landlord" ? "Udlejer" : "Roomie"}
                </span>
              )}
            </div>
            {conversation.lastMessage && (
              <span className={cn("text-[10px] flex-shrink-0 tabular-nums", unread ? "text-foreground font-semibold" : "text-foreground/40")}>
                {formatTime(conversation.lastMessage.created_at)}
              </span>
            )}
          </div>
          {isGroup && conversation.groupInfo && (
            <p className="text-[11px] text-foreground/50 mt-0.5">{conversation.groupInfo.memberCount} medlemmer</p>
          )}
          {conversation.property && (
            <div className="flex items-center gap-1 mt-1">
              <Home className="w-3 h-3 text-foreground/40 flex-shrink-0" />
              <span className="text-[11px] text-foreground/55 font-medium truncate">{conversation.property.title}</span>
            </div>
          )}
          <p className={cn("text-[11px] truncate mt-1 leading-relaxed", unread ? "text-foreground/80" : "text-foreground/50")}>
            {conversation.lastMessage?.content || "Start en samtale..."}
          </p>
        </div>
      </button>
    );
  };

  const hasGroupConversations = groupConversations.length > 0;
  const hasRegularConversations = regularConversations.length > 0;
  const isEmpty = !hasGroupConversations && !hasRegularConversations && !loading;

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søg i samtaler..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-border/60 rounded-full h-11 focus-visible:ring-1 focus-visible:ring-foreground/20"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2">
        {loading ? (
          <div className="space-y-2 p-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse rounded-2xl">
                <div className="w-11 h-11 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 bg-muted rounded-lg" />
                  <div className="h-3 w-40 bg-muted/60 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyState
            icon={MessageCircle}
            tone="primary"
            variant="compact"
            title={t("inbox.emptyTitle")}
            description={t("inbox.emptyBody")}
            actionLabel={t("inbox.emptyAction")}
            onAction={() => navigate("/matches")}
          />
        ) : (
          <div className="space-y-4 pb-2">
            {hasGroupConversations && (
              <div>
                <SectionLabel>Grupper</SectionLabel>
                <div className="space-y-1">
                  {groupConversations.map((conv) => renderConversationItem(conv, true))}
                </div>
              </div>
            )}

            {hasRegularConversations && (
              <div>
                <SectionLabel>Beskeder</SectionLabel>
                <div className="space-y-1">
                  {regularConversations.map((conv) => renderConversationItem(conv, false))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxConversationList;
