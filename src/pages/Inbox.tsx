import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/landing/Navbar";
import AppLayout from "@/components/navigation/AppLayout";
import PendingRequests from "@/components/inbox/PendingRequests";
import ChatArea from "@/components/inbox/ChatArea";
import MatchModal from "@/components/inbox/MatchModal";
import { supabase } from "@/integrations/supabase/client";
import { useGroupRequests } from "@/hooks/useGroupRequests";
import { useIsMobile } from "@/hooks/use-mobile";
import InboxConversationList from "@/components/inbox/InboxConversationList";
import PullToRefresh from "@/components/PullToRefresh";
import type { Conversation, MatchRequest } from "@/types/inbox";

type TabType = "landlord" | "roomie";

const Inbox = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const isLandlord = profile?.user_type === "landlord";
  
  // Tabs are now "landlord" or "roomie" - default based on user type
  const [activeTab, setActiveTab] = useState<TabType>(isLandlord ? "roomie" : "landlord");

  // Group requests hook
  const { receivedRequests: groupRequests, respondToRequest: handleGroupResponse, refetch: refetchGroupRequests } = useGroupRequests();

  // All conversations (we'll filter them based on type)
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [groupConversations, setGroupConversations] = useState<Conversation[]>([]);

  // Keep pending requests per tab so accepted/rejected ones stay hidden
  const [pendingRequestsByTab, setPendingRequestsByTab] = useState<
    Record<"landlord" | "roomie", MatchRequest[]>
  >({ landlord: [], roomie: [] });

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<{ name: string; avatar_url: string | null } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Update default tab when profile loads
  useEffect(() => {
    if (profile?.user_type) {
      setActiveTab(isLandlord ? "roomie" : "landlord");
    }
  }, [profile?.user_type, isLandlord]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    await Promise.all([fetchAllConversations(), fetchAllPendingRequests()]);
    setLoading(false);
  };

  const fetchAllPendingRequests = async () => {
    await Promise.all([
      fetchPendingRequestsForTab("roomie"),
      fetchPendingRequestsForTab("landlord"),
    ]);
  };

  const fetchAllConversations = async () => {
    if (!user) return;

    const [{ data: participations }, { data: blockedUsers }] = await Promise.all([
      supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id),
      supabase
        .from("blocked_users")
        .select("blocked_user_id")
        .eq("user_id", user.id),
    ]);

    if (!participations?.length) {
      setAllConversations([]);
      setGroupConversations([]);
      return;
    }

    const conversationIds = participations.map((p) => p.conversation_id);
    const blockedUserIds = new Set((blockedUsers || []).map((entry) => entry.blocked_user_id));

    // Fetch all conversations (both with and without group_id, but exclude internal group chats)
    const { data: regularConvos } = await supabase
      .from("conversations")
      .select("*")
      .in("id", conversationIds)
      .is("group_id", null)
      .order("updated_at", { ascending: false });

    // Only show landlord-group chats for groups the user is still part of (creator or accepted member)
    const [{ data: memberGroups }, { data: createdGroups }] = await Promise.all([
      supabase
        .from("housing_group_members")
        .select("group_id")
        .eq("user_id", user.id)
        .eq("status", "accepted"),
      supabase
        .from("housing_groups")
        .select("id")
        .eq("created_by", user.id),
    ]);

    const allowedGroupIds = Array.from(
      new Set([
        ...(memberGroups?.map((g) => g.group_id) || []),
        ...(createdGroups?.map((g) => g.id) || []),
      ])
    );

    // Udlejeren er hverken medlem eller skaber af lejergruppen, så den må også kunne
    // se landlord-gruppe-chatten via EJERSKAB af boligen. Ellers kan medlemmerne skrive
    // til udlejeren, men udlejeren ser aldrig tråden.
    const { data: ownedProps } = await supabase
      .from("properties")
      .select("id")
      .eq("user_id", user.id);
    const ownedPropertyIds = new Set((ownedProps || []).map((p) => p.id));

    // Hent ALLE landlord-gruppe-chats (group_id + property_id) hvor brugeren deltager,
    // og vis dem hvis brugeren enten er medlem/skaber af gruppen ELLER ejer boligen.
    const { data: allGroupConvos } = await supabase
      .from("conversations")
      .select("*")
      .in("id", conversationIds)
      .not("group_id", "is", null)
      .not("property_id", "is", null)
      .order("updated_at", { ascending: false });

    const groupConvos = (allGroupConvos || []).filter(
      (c) => allowedGroupIds.includes(c.group_id) || ownedPropertyIds.has(c.property_id)
    );

    const processConversations = async (convos: any[]) => {
      if (!convos?.length) return [];

      const processedConversations = await Promise.all(
        convos.map(async (conv) => {
          const { data: participants } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conv.id)
            .neq("user_id", user.id);

          let groupInfo = null;
          if (conv.group_id) {
            const { data: groupData } = await supabase
              .from("housing_groups")
              .select("id, name")
              .eq("id", conv.group_id)
              .maybeSingle();

            const memberAvatars: (string | null)[] = [];
            for (const p of participants || []) {
              const { data: memberProfile } = await supabase
                .from("profiles")
                .select("avatar_url")
                .eq("user_id", p.user_id)
                .maybeSingle();
              memberAvatars.push(memberProfile?.avatar_url || null);
            }

            groupInfo = {
              id: groupData?.id || conv.group_id,
              name: groupData?.name || t("inbox.groupChat"),
              memberCount: (participants?.length || 0) + 1,
              memberAvatars: memberAvatars.slice(0, 3),
            };
          }

          const otherUserId = conv.group_id ? undefined : participants?.[0]?.user_id;

          let otherProfile = null;
          if (otherUserId) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("id, name, avatar_url, age, study, user_id, user_type, last_seen_at")
              .eq("user_id", otherUserId)
              .maybeSingle();
            otherProfile = profileData;
          }

          const { data: messages } = await supabase
            .from("messages")
            .select("content, created_at, sender_id")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", user.id)
            .is("read_at", null);

          let propertyInfo = null;
          if (conv.property_id) {
            const { data: propertyData } = await supabase
              .from("properties")
              .select("id, title, images")
              .eq("id", conv.property_id)
              .maybeSingle();
            
            if (propertyData) {
              propertyInfo = {
                id: propertyData.id,
                title: propertyData.title,
                image: propertyData.images?.[0],
              };
            }
          }

          const displayType = otherProfile?.user_type === "landlord" ? "landlord" : "roomie";

          return {
            id: conv.id,
            type: displayType as "landlord" | "roomie",
            updated_at: conv.updated_at,
            property_id: conv.property_id,
            group_id: conv.group_id,
            property: propertyInfo,
            groupInfo,
            otherUser: {
              id: otherProfile?.user_id || otherUserId || "",
              name: groupInfo?.name || otherProfile?.name || t("inbox.unknown"),
              avatar_url: otherProfile?.avatar_url,
              age: otherProfile?.age,
              study: otherProfile?.study,
              last_seen_at: otherProfile?.last_seen_at ?? null,
            },
            lastMessage: messages?.[0],
            unreadCount: count || 0,
          };
        })
      );

      return processedConversations.filter((conversation) => {
        if (conversation.group_id) {
          return true;
        }

        if (!conversation.otherUser.id || conversation.otherUser.id === user.id) {
          return false;
        }

        if (blockedUserIds.has(conversation.otherUser.id)) {
          return false;
        }

        return true;
      });
    };

    const [processedRegular, processedGroup] = await Promise.all([
      processConversations(regularConvos || []),
      processConversations(groupConvos || []),
    ]);

    setAllConversations(processedRegular);
    setGroupConversations(processedGroup);
  };

  const fetchPendingRequestsForTab = async (tab: "roomie" | "landlord") => {
    if (!user) return;

    const { data } = await supabase
      .from("match_requests")
      .select("*")
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!data?.length) {
      setPendingRequestsByTab((prev) => ({ ...prev, [tab]: [] }));
      return;
    }

    const requestsWithProfiles = await Promise.all(
      data.map(async (req) => {
        const { data: senderProfile } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, age, study, user_id, user_type")
          .eq("user_id", req.sender_id)
          .maybeSingle();

        const senderType = senderProfile?.user_type === "landlord" ? "landlord" : "roomie";

        return {
          ...req,
          type: senderType as "landlord" | "roomie",
          sender: {
            id: senderProfile?.user_id || req.sender_id,
            name: senderProfile?.name || t("inbox.unknown"),
            avatar_url: senderProfile?.avatar_url,
            age: senderProfile?.age,
            study: senderProfile?.study,
          },
        };
      })
    );

    const filteredRequests = requestsWithProfiles.filter((req) => req.type === tab);
    setPendingRequestsByTab((prev) => ({ ...prev, [tab]: filteredRequests }));
  };

  // Real-time: surface incoming match requests and reorder conversations as they
  // arrive, so the inbox updates live without a manual refresh. (Group requests
  // are handled separately by useGroupRequests; RLS limits message events to the
  // user's own conversations.)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`inbox-realtime-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_requests", filter: `receiver_id=eq.${user.id}` },
        () => {
          fetchPendingRequestsForTab("roomie");
          fetchPendingRequestsForTab("landlord");
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => { fetchAllConversations(); }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAcceptRequest = async (requestId: string) => {
    if (!user) return;
    
    const request = 
      pendingRequestsByTab.landlord.find((r) => r.id === requestId) ||
      pendingRequestsByTab.roomie.find((r) => r.id === requestId);
    
    if (!request) return;

    const { error: updateError } = await supabase
      .from("match_requests")
      .update({ status: "accepted" })
      .eq("id", requestId);

    if (updateError) {
      console.error("Error updating match request:", updateError);
      toast.error(t("inbox.acceptFailed"));
      return;
    }

    const { data, error } = await supabase.functions.invoke("create-conversation", {
      body: {
        type: request.type,
        participant_ids: [user.id, request.sender_id],
        property_id: request.property_id ?? null,
      },
    });

    if (error) {
      console.error("Error creating conversation:", error);
      // Rul status tilbage til pending, så anmodningen ikke ender i limbo
      // (accepteret men uden samtale) og kan accepteres igen.
      await supabase
        .from("match_requests")
        .update({ status: "pending" })
        .eq("id", requestId);
      toast.error(t("inbox.chatCreateFailed"));
      return;
    }

    const conversation = (data as any)?.conversation as { id: string; type: "landlord" | "roomie"; updated_at: string; property_id?: string } | undefined;

    setPendingRequestsByTab((prev) => ({
      landlord: prev.landlord.filter((r) => r.id !== requestId),
      roomie: prev.roomie.filter((r) => r.id !== requestId),
    }));

    if (conversation) {
      const newConversation: Conversation = {
        id: conversation.id,
        type: conversation.type,
        updated_at: conversation.updated_at,
        property_id: request.property_id ?? undefined,
        otherUser: {
          id: request.sender.id,
          name: request.sender.name,
          avatar_url: request.sender.avatar_url,
          age: request.sender.age,
          study: request.sender.study,
        },
        lastMessage: undefined,
        unreadCount: 0,
      };

      setAllConversations((prev) => [newConversation, ...prev]);

      setMatchedUser({
        name: request.sender.name,
        avatar_url: request.sender.avatar_url,
      });
      setShowMatchModal(true);
      
      setSelectedConversation(newConversation);
      
      // Switch to the appropriate tab
      setActiveTab(request.type);
    }

    fetchData();
  };

  const handleRejectRequest = async (requestId: string) => {
    await supabase
      .from("match_requests")
      .update({ status: "rejected" })
      .eq("id", requestId);

    setPendingRequestsByTab((prev) => ({
      landlord: prev.landlord.filter((r) => r.id !== requestId),
      roomie: prev.roomie.filter((r) => r.id !== requestId),
    }));
  };

  // Filter conversations based on activeTab (landlord or roomie)
  const filteredConversations = allConversations
    .filter((conv) => conv.type === activeTab)
    .filter((conv) => conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Filter group conversations based on search
  const filteredGroupConversations = groupConversations
    .filter((conv) => conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);

    if (conversation.unreadCount > 0) {
      // Update in the appropriate list
      if (conversation.group_id) {
        setGroupConversations((prev) =>
          prev.map((c) => c.id === conversation.id ? { ...c, unreadCount: 0 } : c)
        );
      } else {
        setAllConversations((prev) =>
          prev.map((c) => c.id === conversation.id ? { ...c, unreadCount: 0 } : c)
        );
      }
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-card border border-border/40 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-muted animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-48 bg-muted/70 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const roomieRequests = [...pendingRequestsByTab.roomie];
  const landlordRequests = [...pendingRequestsByTab.landlord];

  // Per-tab unread message totals — so each tab shows where new messages are.
  // Opening the inbox from a notification, you immediately see which side it's on
  // instead of landing on an empty tab and having to switch manually.
  const landlordUnread = allConversations
    .filter((c) => c.type === "landlord")
    .reduce((n, c) => n + (c.unreadCount || 0), 0);
  const roomieUnread =
    allConversations.filter((c) => c.type === "roomie").reduce((n, c) => n + (c.unreadCount || 0), 0) +
    groupConversations.reduce((n, c) => n + (c.unreadCount || 0), 0);

  const handleSelectConversationMobile = (conversation: Conversation) => {
    handleSelectConversation(conversation);
    const isMobileView = window.matchMedia("(max-width: 767px)").matches;
    setShowMobileChat(isMobileView);
  };

  return (
    <AppLayout hideBottomNav={showMobileChat} hideHeader={showMobileChat}>
      <div className="min-h-screen bg-background flex flex-col">
        {!isMobile && <Navbar />}

        <main className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 48px)', minHeight: 0 }}>
          <div className={`max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0 ${isMobile && showMobileChat ? "" : "px-3 sm:px-6 lg:px-12 py-4 sm:py-8"}`}>

            {/* Editorial Header */}
            <div className={`mb-5 md:mb-8 ${showMobileChat ? "hidden md:block" : "block"}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-foreground/40" />
                <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">{t("inbox.eyebrow")}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-display text-foreground leading-[1.05]">
                {t("inbox.title")}
              </h1>
              <p className="mt-2 text-sm text-foreground/60 hidden sm:block">
                {t("inbox.subtitle")}
              </p>
            </div>

            {/* Pending Requests */}
            <div className={`flex-shrink-0 ${showMobileChat ? "hidden md:block" : "block"}`}>
              <PendingRequests
                roomieRequests={roomieRequests}
                landlordRequests={landlordRequests}
                groupRequests={isLandlord ? groupRequests : []}
                onAccept={handleAcceptRequest}
                onReject={handleRejectRequest}
                onAcceptGroup={async (requestId) => {
                  const result = await handleGroupResponse(requestId, true);
                  if (result.success) {
                    toast.success(t("inbox.groupRequestAccepted"));
                    await fetchData();

                    if (result.conversationId) {
                      const conv = groupConversations.find(c => c.id === result.conversationId);
                      if (conv) {
                        handleSelectConversation(conv);
                      }
                    }
                  }
                }}
                onRejectGroup={async (requestId) => {
                  const result = await handleGroupResponse(requestId, false);
                  if (result.success) {
                    toast.success(t("inbox.groupRequestRejected"));
                  }
                }}
                isLandlord={isLandlord}
              />
            </div>

            {/* Main Chat Layout — full-bleed on mobile when a chat is open so it
                isn't visually "boxed in"; bordered split card otherwise. */}
            <div className={`flex bg-background overflow-hidden flex-1 min-h-0 ${isMobile && showMobileChat ? "" : "rounded-2xl border border-border/60"}`}>
              {/* Left side: Toggle + Conversation Lists */}
              <div className={`${showMobileChat ? 'hidden' : 'flex'} md:flex w-full md:w-[340px] lg:w-[380px] flex-col border-r border-border/60`}>
                {/* Toggle: Udlejer / Roomies */}
                <div className="px-3 md:px-4 py-3 md:py-4 border-b border-border/60 flex-shrink-0">
                  <div className="inline-flex items-center bg-muted/50 rounded-full p-1 border border-border/60 w-full">
                    <button
                      onClick={() => setActiveTab("landlord")}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-1 ${
                        activeTab === "landlord"
                          ? "bg-foreground text-background shadow-sm"
                          : "text-foreground/60 hover:text-foreground"
                      }`}
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>{t("inbox.tabLandlord")}</span>
                      {landlordUnread > 0 && (
                        <span className={`ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center ${
                          activeTab === "landlord" ? "bg-background text-foreground" : "bg-secondary text-secondary-foreground"
                        }`}>
                          {landlordUnread > 9 ? "9+" : landlordUnread}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab("roomie")}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-1 ${
                        activeTab === "roomie"
                          ? "bg-foreground text-background shadow-sm"
                          : "text-foreground/60 hover:text-foreground"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>{t("inbox.tabRoomies")}</span>
                      {roomieUnread > 0 && (
                        <span className={`ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center ${
                          activeTab === "roomie" ? "bg-background text-foreground" : "bg-secondary text-secondary-foreground"
                        }`}>
                          {roomieUnread > 9 ? "9+" : roomieUnread}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Conversation Lists with Sections — pull-to-refresh on mobile */}
                <div className="flex-1 min-h-0">
                  <PullToRefresh onRefresh={fetchData}>
                    <InboxConversationList
                      regularConversations={filteredConversations}
                      groupConversations={filteredGroupConversations}
                      selectedId={selectedConversation?.id}
                      onSelect={handleSelectConversationMobile}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      loading={loading}
                      activeTab={activeTab}
                    />
                  </PullToRefresh>
                </div>
              </div>

              {/* Right side: Chat Area */}
              <div className={`${showMobileChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-w-0 min-h-0 bg-background`}>
                <ChatArea
                  conversation={selectedConversation}
                  currentUserId={user.id}
                  currentUserAvatar={profile?.avatar_url}
                  onMessageSent={fetchAllConversations}
                  onConversationDeleted={() => {
                    setSelectedConversation(null);
                    setShowMobileChat(false);
                    fetchAllConversations();
                  }}
                  onBack={() => setShowMobileChat(false)}
                  showBackButton={showMobileChat}
                />
              </div>
            </div>
          </div>
        </main>

        <MatchModal
          open={showMatchModal}
          onClose={() => setShowMatchModal(false)}
          matchedUser={matchedUser}
          currentUserAvatar={profile?.avatar_url}
        />
      </div>
    </AppLayout>
  );
};

export default Inbox;
