import { Search, Home, User, UsersRound, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/ui/empty-state";
import { usePresence } from "@/hooks/usePresence";

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

  const renderConversationItem = (conversation: Conversation, index: number, isGroup: boolean = false) => (
    <button
      type="button"
      key={conversation.id}
      onClick={(e) => {
        e.preventDefault();
        onSelect(conversation);
      }}
      className={`w-full flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 text-left rounded-xl group animate-fade-in ${
        selectedId === conversation.id
          ? "bg-gradient-to-r from-primary/10 to-primary/5 shadow-md border border-primary/20"
          : "hover:bg-muted/40 hover:shadow-sm border border-transparent"
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {isGroup && conversation.groupInfo ? (
          <div className={`relative w-11 h-11 rounded-xl transition-all overflow-hidden ${
            selectedId === conversation.id
              ? "ring-2 ring-primary shadow-lg"
              : conversation.unreadCount > 0
                ? "ring-2 ring-secondary shadow-md"
                : "ring-1 ring-border/50"
          }`}>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20" />
            {conversation.groupInfo.memberAvatars.slice(0, 2).map((avatar, idx) => (
              <img
                key={idx}
                src={avatar || "/placeholder.svg"}
                alt="Gruppemedlem"
                className={`w-5 h-5 rounded-md border border-background object-cover absolute transition-transform duration-300 group-hover:scale-110 ${
                  idx === 0 ? "top-1.5 left-1.5" : "bottom-1.5 right-1.5"
                }`}
              />
            ))}
            {conversation.groupInfo.memberAvatars.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <UsersRound className="w-4 h-4 text-violet-500" />
              </div>
            )}
          </div>
        ) : conversation.otherUser.avatar_url ? (
          <img
            src={conversation.otherUser.avatar_url}
            alt={conversation.otherUser.name}
            className={`w-11 h-11 rounded-xl object-cover transition-all duration-300 group-hover:scale-105 ${
              selectedId === conversation.id
                ? "ring-2 ring-primary shadow-lg"
                : conversation.unreadCount > 0
                  ? "ring-2 ring-secondary shadow-md"
                  : "ring-1 ring-border/30"
            }`}
          />
        ) : (
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${
            selectedId === conversation.id
              ? "ring-2 ring-primary shadow-lg"
              : conversation.unreadCount > 0
                ? "ring-2 ring-secondary shadow-md"
                : "ring-1 ring-border/30"
          }`}>
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        {conversation.unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-md flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-[9px] font-bold text-secondary-foreground">
              {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
            </span>
          </div>
        )}
        {!isGroup && isOnline(conversation.otherUser.id) && conversation.unreadCount === 0 && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background"
            title="Online nu"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-sm truncate transition-colors duration-200 ${
              conversation.unreadCount > 0 ? "font-semibold text-foreground" : "font-medium text-foreground/90"
            } group-hover:text-primary`}>
              {conversation.groupInfo?.name || conversation.otherUser.name}
            </span>
            {/* Group badge for group conversations */}
            {isGroup && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-violet-500 text-white text-[9px] font-bold flex-shrink-0 shadow-sm">
                <UsersRound className="w-2.5 h-2.5" />
                Gruppe
              </span>
            )}
            {/* Type badge for regular conversations */}
            {!isGroup && (
              <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold flex-shrink-0 shadow-sm ${
                activeTab === "landlord" 
                  ? "bg-amber-500 text-white"
                  : "bg-teal-500 text-white"
              }`}>
                {activeTab === "landlord" ? (
                  <>
                    <Home className="w-2.5 h-2.5" />
                    Udlejer
                  </>
                ) : (
                  <>
                    <User className="w-2.5 h-2.5" />
                    Roomie
                  </>
                )}
              </span>
            )}
          </div>
          {conversation.lastMessage && (
            <span className={`text-[10px] flex-shrink-0 tabular-nums transition-colors duration-200 ${
              conversation.unreadCount > 0 
                ? "text-secondary font-semibold" 
                : "text-muted-foreground/70"
            }`}>
              {formatTime(conversation.lastMessage.created_at)}
            </span>
          )}
        </div>
        {/* Member count for groups */}
        {isGroup && conversation.groupInfo && (
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
            {conversation.groupInfo.memberCount} medlemmer
          </p>
        )}
        {/* Property title */}
        {conversation.property && (
          <div className="flex items-center gap-1 mt-1">
            <div className="w-3.5 h-3.5 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Home className="w-2 h-2 text-primary" />
            </div>
            <span className="text-[11px] text-primary/80 font-medium truncate">
              {conversation.property.title}
            </span>
          </div>
        )}
        <p className={`text-[11px] truncate mt-1 leading-relaxed transition-colors duration-200 ${
          conversation.unreadCount > 0 
            ? "text-foreground/80" 
            : "text-muted-foreground/60"
        }`}>
          {conversation.lastMessage?.content || "Start en samtale..."}
        </p>
      </div>
    </button>
  );

  const hasGroupConversations = groupConversations.length > 0;
  const hasRegularConversations = regularConversations.length > 0;
  const isEmpty = !hasGroupConversations && !hasRegularConversations && !loading;

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
          <Input
            placeholder="Søg i samtaler..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-muted/20 border-border/30 rounded-xl h-11 focus:bg-background focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all duration-200 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2">
        {loading ? (
          <div className="space-y-2 p-2">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 p-3 animate-pulse rounded-xl"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 bg-muted/50 rounded-lg" />
                  <div className="h-3 w-40 bg-muted/30 rounded-lg" />
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
            {/* Groups Section - always visible */}
            {hasGroupConversations && (
              <div>
                <div className="flex items-center gap-2 px-3 py-2">
                  <UsersRound className="w-4 h-4 text-violet-500" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Grupper
                  </h3>
                  <div className="flex-1 h-px bg-border/30" />
                </div>
                <div className="space-y-1">
                  {groupConversations.map((conv, index) => renderConversationItem(conv, index, true))}
                </div>
              </div>
            )}

            {/* Messages Section */}
            {hasRegularConversations && (
              <div>
                <div className="flex items-center gap-2 px-3 py-2">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Beskeder
                  </h3>
                  <div className="flex-1 h-px bg-border/30" />
                </div>
                <div className="space-y-1">
                  {regularConversations.map((conv, index) => renderConversationItem(conv, index, false))}
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
