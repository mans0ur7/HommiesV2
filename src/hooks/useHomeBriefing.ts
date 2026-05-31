import { useMemo } from "react";
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
  const { profile } = useAuth();
  const isLandlord = profile?.user_type === "landlord";

  const { percent: profilePercent } = calcProfileCompleteness(profile as any);
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
      return {
        key: "profile",
        title: "Færdiggør din profil",
        description: "En komplet profil giver dig markant bedre matches.",
        cta: "Gør profilen færdig",
        to: "/profile",
      };
    }

    if (pendingContracts > 0) {
      return {
        key: "contract",
        title: "Du har en kontrakt klar til underskrift",
        description: "Gennemse og underskriv, så I begge er sikret.",
        cta: "Se kontrakt",
        to: "/documents",
      };
    }

    if (!isLandlord && groupInvites > 0) {
      return {
        key: "group-invite",
        title: "Du er inviteret til en gruppe",
        description: "Slå jer sammen og søg bolig sammen.",
        cta: "Se invitation",
        to: "/focus",
      };
    }

    if (isLandlord && pendingGroupApplications > 0) {
      return {
        key: "group-application",
        title: "Nogen vil søge din bolig",
        description: "En gruppe har sendt en ansøgning til din annonce.",
        cta: "Se ansøgning",
        to: "/focus",
      };
    }

    if (inboundConnections > 0) {
      return {
        key: "connections",
        title: `${inboundConnections} vil forbinde med dig`,
        description: "Sig ja og start en samtale.",
        cta: "Se anmodninger",
        to: "/inbox",
      };
    }

    if (unreadCount > 0) {
      return {
        key: "messages",
        title: "Du har ulæste beskeder",
        description: "Hold samtalen i gang — svar tilbage.",
        cta: "Åbn indbakke",
        to: "/inbox",
      };
    }

    if (!isLandlord && unreadSearchAgentCount > 0) {
      return {
        key: "search-agent",
        title: "Nye boliger matcher din søgning",
        description: "Din søgeagent har fundet noget nyt til dig.",
        cta: "Se boliger",
        to: "/explore",
      };
    }

    // Friendly discovery fallback.
    return isLandlord
      ? {
          key: "discover-landlord",
          title: "Alt er up to date",
          description: "Hold din annonce skarp, så de rette roomies finder dig.",
          cta: "Se din annonce",
          to: "/my-listings",
        }
      : {
          key: "discover-roomie",
          title: "Klar til at finde dit næste hjem?",
          description: "Udforsk nye boliger og roomies, der passer til dig.",
          cta: "Udforsk boliger",
          to: "/explore",
        };
  }, [
    profilePercent,
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
      { key: "messages", label: "Indbakke", count: unreadCount, to: "/inbox" },
      {
        key: "connections",
        label: "Anmodninger",
        count: inboundConnections,
        to: "/inbox",
      },
      {
        key: "group-invite",
        label: "Gruppe",
        count: isLandlord ? pendingGroupApplications : groupInvites,
        to: "/focus",
      },
      {
        key: "contract",
        label: "Dokumenter",
        count: pendingContracts,
        to: "/documents",
      },
      {
        key: "search-agent",
        label: "Søgeagenter",
        count: isLandlord ? 0 : unreadSearchAgentCount,
        to: "/search-agents",
      },
    ];
    return all.filter((c) => c.count > 0);
  }, [
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
