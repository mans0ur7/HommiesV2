import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AppLayout from "@/components/navigation/AppLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { useHousingGroups, HousingGroup } from "@/hooks/useHousingGroups";
import { useGroupRequests } from "@/hooks/useGroupRequests";
import { useGroupUnread } from "@/hooks/useGroupUnread";
import FocusHeroBanner from "@/components/focus/FocusHeroBanner";
import YourGroupsSection from "@/components/focus/YourGroupsSection";
import LikedPeopleSection from "@/components/focus/LikedPeopleSection";
import LikedPropertiesSection from "@/components/focus/LikedPropertiesSection";
import CreateGroupWizard from "@/components/focus/CreateGroupWizard";
import GroupDetailView from "@/components/focus/GroupDetailView";
import PendingGroupInvitations from "@/components/search-together/PendingGroupInvitations";
import EditGroupModal from "@/components/search-together/EditGroupModal";

interface ConnectedRoomie {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  age: number | null;
}

const SearchTogether = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const {
    groups,
    loading: groupsLoading,
    pendingInvitations,
    createGroup,
    inviteMember,
    respondToInvitation,
    deleteGroup,
    leaveGroup,
    refetch: refetchGroups,
  } = useHousingGroups();

  const {
    sentRequests,
    sendGroupRequest,
  } = useGroupRequests();

  const { unreadByGroup } = useGroupUnread();

  const [connectedRoomies, setConnectedRoomies] = useState<ConnectedRoomie[]>([]);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [editModalGroup, setEditModalGroup] = useState<HousingGroup | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<HousingGroup | null>(null);
  const [loadingRoomies, setLoadingRoomies] = useState(true);

  // Redirect non-roomie users
  useEffect(() => {
    if (!loading && (!user || profile?.user_type === "landlord")) {
      navigate("/matches");
    }
  }, [user, profile, loading, navigate]);

  // Fetch connected roomies
  useEffect(() => {
    const fetchConnectedRoomies = async () => {
      if (!user) return;
      setLoadingRoomies(true);

      const { data: acceptedRequests } = await supabase
        .from("match_requests")
        .select("sender_id, receiver_id")
        .eq("type", "roomie")
        .eq("status", "accepted")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (acceptedRequests && acceptedRequests.length > 0) {
        const partnerIds = acceptedRequests.map((req) =>
          req.sender_id === user.id ? req.receiver_id : req.sender_id
        );

        const uniqueIds = [...new Set(partnerIds)];

        const { data: partnerProfiles } = await supabase
          .from("profiles")
          .select("id, user_id, name, avatar_url, age")
          .in("user_id", uniqueIds);

        if (partnerProfiles) {
          setConnectedRoomies(partnerProfiles);
        }
      } else {
        setConnectedRoomies([]);
      }

      setLoadingRoomies(false);
    };

    fetchConnectedRoomies();
  }, [user]);

  const handleInviteMembers = async (groupId: string, userIds: string[]) => {
    for (const userId of userIds) {
      const success = await inviteMember(groupId, userId);
      if (!success) {
        toast.error(t("searchTogether.inviteFailed"));
        return;
      }
    }
    toast.success(userIds.length === 1 ? t("searchTogether.invitationsSentOne") : t("searchTogether.invitationsSentMany", { count: userIds.length }));
  };

  const handleRespondToInvitation = async (memberId: string, accept: boolean) => {
    const success = await respondToInvitation(memberId, accept);
    if (success) {
      toast.success(accept ? t("searchTogether.invitationAccepted") : t("searchTogether.invitationRejected"));
    } else {
      toast.error(t("searchTogether.somethingWrong"));
    }
    return success;
  };

  const handleEditGroup = (group: HousingGroup) => {
    setEditModalGroup(group);
  };

  // Filter sentRequests to only show requests for the currently selected group
  const getSentRequestPropertyIdsForGroup = (groupId: string) => {
    return sentRequests
      .filter((r) => r.group_id === groupId)
      .map((r) => r.property_id);
  };

  // Default list for when no specific group is selected
  const sentRequestPropertyIds = selectedGroup 
    ? getSentRequestPropertyIdsForGroup(selectedGroup.id)
    : sentRequests.map((r) => r.property_id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <AppLayout hideBottomNav={isMobile && !!selectedGroup} hideHeader={isMobile && !!selectedGroup}>
    <div className={selectedGroup ? "h-[100dvh] bg-background flex flex-col overflow-hidden" : "min-h-screen bg-background flex flex-col"}>
      {!isMobile && <Navbar />}

      {/* Open group = full-screen, one-page chat experience (no outer scroll) */}
      {selectedGroup ? (
        <GroupDetailView
          group={selectedGroup}
          onBack={() => setSelectedGroup(null)}
          onEditGroup={handleEditGroup}
          onSendRequest={sendGroupRequest}
          sentRequestPropertyIds={sentRequestPropertyIds}
        />
      ) : (
        <>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 lg:px-12 py-6 md:py-12">
          {/* Editorial Header */}
          <div className="mb-8 md:mb-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px w-8 bg-foreground/40" />
              <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">{t("searchTogether.eyebrow")}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-[1.05]">
              {t("searchTogether.title")}
            </h1>
            <p className="mt-3 text-foreground/60 max-w-2xl">
              {t("searchTogether.subtitle")}
            </p>
          </div>

          {/* Hero Banner - only show when user has no groups */}
          {groups.length === 0 && !groupsLoading && (
            <FocusHeroBanner onCreateGroup={() => setShowCreateWizard(true)} />
          )}

          {/* Afventende gruppeinvitationer */}
          <PendingGroupInvitations
            invitations={pendingInvitations as any}
            onRespond={handleRespondToInvitation}
          />

          {/* Dine grupper - shown once the user actually has groups (or while
              loading). When empty, the hero banner above is the single CTA so
              we don't stack three "Opret gruppe" buttons. */}
          {(groupsLoading || groups.length > 0) && (
            <YourGroupsSection
              groups={groups}
              loading={groupsLoading}
              onSelectGroup={setSelectedGroup}
              onEditGroup={handleEditGroup}
              onCreateGroup={() => setShowCreateWizard(true)}
              unreadByGroup={unreadByGroup}
            />
          )}

          {/* Personer du har liket */}
          <LikedPeopleSection />

          {/* Boliger du har liket */}
          <LikedPropertiesSection />
        </main>

        <Footer />
        </>
      )}

      {/* Create group wizard */}
      <CreateGroupWizard
        open={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
        connectedRoomies={connectedRoomies}
        onCreate={async (data) => {
          const result = await createGroup(data);
          if (result) {
            toast.success(t("searchTogether.groupCreated"));
          } else {
            toast.error(t("searchTogether.groupCreateFailed"));
          }
          return result;
        }}
        onInvite={handleInviteMembers}
      />

      {/* Edit group modal */}
      <EditGroupModal
        open={!!editModalGroup}
        onOpenChange={(open) => !open && setEditModalGroup(null)}
        group={editModalGroup}
        onGroupUpdated={() => {
          setEditModalGroup(null);
          // Hent grupperne igen, så ændret navn/detaljer slår igennem i listen
          // og i den åbne gruppe (realtime lytter kun på medlemskab, ikke på gruppen).
          refetchGroups();
        }}
        connectedRoomies={connectedRoomies}
        onInvite={handleInviteMembers}
        onLeaveGroup={async (id) => {
          const ok = await leaveGroup(id);
          if (ok && selectedGroup?.id === id) setSelectedGroup(null);
          return ok;
        }}
        onDeleteGroup={async (id) => {
          const ok = await deleteGroup(id);
          if (ok && selectedGroup?.id === id) setSelectedGroup(null);
          return ok;
        }}
      />
    </div>
    </AppLayout>
  );
};

export default SearchTogether;
