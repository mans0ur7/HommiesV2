import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { calcProfileCompleteness } from "@/lib/profileCompleteness";
import { usePendingContracts } from "@/hooks/usePendingContracts";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useSearchAgentNotifications } from "@/hooks/useSearchAgentNotifications";
import { useHousingGroups } from "@/hooks/useHousingGroups";
import { useGroupRequests } from "@/hooks/useGroupRequests";
import { useReceivedConnectionRequests } from "@/hooks/useReceivedConnectionRequests";

export interface HomeAction {
  /** Stable identifier for the matched action. */
  key: string;
  title: string;
  description: string;
  cta: string;
  to: string;
}

export interface HomeChip {
  key: string;
  label: string;
  count: number;
  to: string;
}

/**
 * Pulls together every "since last visit" signal for the home briefing and
 * resolves a single priority "next best action" plus a set of stat chips.
 * Everything is derived from existing hooks so the home tab stays in sync with
 * the rest of the app.
 */
export const useHomeBriefing = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const isLandlord = profile?.user_type === "landlord";

  const { percent: profilePercent, missing: missingSteps } =
    calcProfileCompleteness(profile as any);
  const { pendingCount: pendingContracts } = usePendingContracts();
  const { unreadCount } = useUnreadMessages();
  const { unreadSearchAgentCount } = useSearchAgentNotifications();
  const { pendingInvitations } = useHousingGroups();
  const { receivedRequests } = useGroupRequests();
  const { requests: connectionRequests } = useReceivedConnectionRequests();

  const groupInvites = pendingInvitations?.length ?? 0;
  const pendingGroupApplications =
    receivedRequests?.filter((r) => r.status === "pending").length ?? 0;
  const inboundConnections = connectionRequests?.length ?? 0;

  const action = useMemo<HomeAction>(() => {
    // First match wins — order encodes priority.
    if (profilePercent < 60) {
      // Payoff-framed sub-copy: lead with the photo's outcome when it's the
      // missing step, otherwise a general matches payoff.
      const photoMissing = missingSteps.some((s) => s.key === "avatar");
      return {
        key: "profile",
        title: t("home.briefing.profileTitle"),
        description: photoMissing
          ? t("home.briefing.profilePhotoDescription")
          : t("home.briefing.profileDescription"),
        cta: t("home.briefing.profileCta"),
        to: "/profile",
      };
    }

    if (pendingContracts > 0) {
      return {
        key: "contract",
        title: t("home.briefing.contractTitle"),
        description: t("home.briefing.contractDescription"),
        cta: t("home.briefing.contractCta"),
        to: "/documents",
      };
    }

    if (!isLandlord && groupInvites > 0) {
      return {
        key: "group-invite",
        title: t("home.briefing.groupInviteTitle"),
        description: t("home.briefing.groupInviteDescription"),
        cta: t("home.briefing.groupInviteCta"),
        to: "/focus",
      };
    }

    if (isLandlord && pendingGroupApplications > 0) {
      return {
        key: "group-application",
        title: t("home.briefing.groupApplicationTitle"),
        description: t("home.briefing.groupApplicationDescription"),
        cta: t("home.briefing.groupApplicationCta"),
        to: "/focus",
      };
    }

    if (inboundConnections > 0) {
      return {
        key: "connections",
        title: t("home.briefing.connectionsTitle", {
          count: inboundConnections,
        }),
        description: t("home.briefing.connectionsDescription"),
        cta: t("home.briefing.connectionsCta"),
        to: "/inbox",
      };
    }

    if (unreadCount > 0) {
      return {
        key: "messages",
        title: t("home.briefing.messagesTitle"),
        description: t("home.briefing.messagesDescription"),
        cta: t("home.briefing.messagesCta"),
        to: "/inbox",
      };
    }

    if (!isLandlord && unreadSearchAgentCount > 0) {
      return {
        key: "search-agent",
        title: t("home.briefing.searchAgentTitle"),
        description: t("home.briefing.searchAgentDescription"),
        cta: t("home.briefing.searchAgentCta"),
        to: "/explore",
      };
    }

    // Friendly discovery fallback.
    return isLandlord
      ? {
          key: "discover-landlord",
          title: t("home.briefing.discoverLandlordTitle"),
          description: t("home.briefing.discoverLandlordDescription"),
          cta: t("home.briefing.discoverLandlordCta"),
          to: "/my-listings",
        }
      : {
          key: "discover-roomie",
          title: t("home.briefing.discoverRoomieTitle"),
          description: t("home.briefing.discoverRoomieDescription"),
          cta: t("home.briefing.discoverRoomieCta"),
          to: "/explore",
        };
  }, [
    t,
    profilePercent,
    missingSteps,
    pendingContracts,
    isLandlord,
    groupInvites,
    pendingGroupApplications,
    inboundConnections,
    unreadCount,
    unreadSearchAgentCount,
  ]);

  const chips = useMemo<HomeChip[]>(() => {
    const all: HomeChip[] = [
      {
        key: "messages",
        label: t("home.briefing.chipInbox"),
        count: unreadCount,
        to: "/inbox",
      },
      {
        key: "connections",
        label: t("home.briefing.chipRequests"),
        count: inboundConnections,
        to: "/inbox",
      },
      {
        key: "group-invite",
        label: t("home.briefing.chipGroup"),
        count: isLandlord ? pendingGroupApplications : groupInvites,
        to: "/focus",
      },
      {
        key: "contract",
        label: t("home.briefing.chipDocuments"),
        count: pendingContracts,
        to: "/documents",
      },
      {
        key: "search-agent",
        label: t("home.briefing.chipSearchAgents"),
        count: isLandlord ? 0 : unreadSearchAgentCount,
        to: "/search-agents",
      },
    ];
    return all.filter((c) => c.count > 0);
  }, [
    t,
    unreadCount,
    inboundConnections,
    isLandlord,
    pendingGroupApplications,
    groupInvites,
    pendingContracts,
    unreadSearchAgentCount,
  ]);

  return { action, chips, isLandlord };
};
