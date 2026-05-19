import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // Get all conversation IDs where user is a participant
    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!participations?.length) {
      setUnreadCount(0);
      return;
    }

    const conversationIds = participations.map((p) => p.conversation_id);

    // Fetch unread message rows and count them client-side to avoid false totals
    // when the backend count metadata becomes inconsistent.
    const { data, error } = await supabase
      .from("messages")
      .select("id, conversation_id")
      .in("conversation_id", conversationIds)
      .neq("sender_id", user.id)
      .is("read_at", null);

    if (error) {
      setUnreadCount(0);
      return;
    }

    setUnreadCount(data?.length || 0);
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

  return { unreadCount, refetch: fetchUnreadCount };
};
