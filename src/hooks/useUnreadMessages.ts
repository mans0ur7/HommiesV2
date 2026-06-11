import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [groupUnreadCount, setGroupUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      setGroupUnreadCount(0);
      return;
    }

    // Get all conversation IDs where user is a participant (+ my per-user read state)
    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);

    if (!participations?.length) {
      setUnreadCount(0);
      setGroupUnreadCount(0);
      return;
    }

    const conversationIds = participations.map((p) => p.conversation_id);
    const lastReadByConv = new Map(
      participations.map((p) => [p.conversation_id as string, p.last_read_at as string | null])
    );

    // Internal group chats live under Focus, not the Inbox — count them separately
    // so a group message doesn't get stuck on the Inbox icon.
    const { data: convs } = await supabase
      .from("conversations")
      .select("id, type")
      .in("id", conversationIds);
    const groupConvIds = new Set(
      (convs ?? []).filter((c) => c.type === "group").map((c) => c.id)
    );
    const directConvIds = conversationIds.filter((id) => !groupConvIds.has(id));

    // Blokerede brugeres beskeder skal IKKE tælle med i badgen — ellers kan badgen
    // aldrig nulstilles (Inbox skjuler samtalen, så den kan ikke åbnes/markeres læst).
    const { data: blocked } = await supabase
      .from("blocked_users")
      .select("blocked_user_id")
      .eq("user_id", user.id);
    const blockedIds = new Set((blocked ?? []).map((b) => b.blocked_user_id));

    // 1:1-chat: read_at er korrekt (kun 2 deltagere).
    let direct = 0;
    if (directConvIds.length) {
      const { data: directMsgs } = await supabase
        .from("messages")
        .select("sender_id")
        .in("conversation_id", directConvIds)
        .neq("sender_id", user.id)
        .is("read_at", null);
      for (const m of directMsgs ?? []) {
        if (!blockedIds.has(m.sender_id)) direct++;
      }
    }

    // Gruppe-chat: tæl beskeder nyere end MIN egen last_read_at (per-bruger), da read_at
    // er delt mellem alle medlemmer og derfor ikke kan bruges til min unread.
    let group = 0;
    const groupIdsArr = [...groupConvIds] as string[];
    if (groupIdsArr.length) {
      const { data: groupMsgs } = await supabase
        .from("messages")
        .select("conversation_id, sender_id, created_at")
        .in("conversation_id", groupIdsArr)
        .neq("sender_id", user.id);
      for (const m of groupMsgs ?? []) {
        if (blockedIds.has(m.sender_id)) continue;
        const lastRead = lastReadByConv.get(m.conversation_id as string);
        if (lastRead && new Date(m.created_at as string) <= new Date(lastRead)) continue;
        group++;
      }
    }

    setUnreadCount(direct);
    setGroupUnreadCount(group);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();

    // Subscribe to message changes for real-time updates
    const channel = supabase
      .channel(`unread-messages-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as { sender_id: string };
          if (newMsg.sender_id !== user.id) {
            // Refetch to ensure the message belongs to one of the user's conversations
            fetchUnreadCount();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        () => {
          // Refetch the actual count when any message is updated
          // This ensures accuracy when messages are marked as read
          fetchUnreadCount();
        }
      )
      .subscribe();

    const handleMessagesRead = () => fetchUnreadCount();
    window.addEventListener("messages-read", handleMessagesRead);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("messages-read", handleMessagesRead);
    };
  }, [user, fetchUnreadCount]);

  return { unreadCount, groupUnreadCount, refetch: fetchUnreadCount };
};
