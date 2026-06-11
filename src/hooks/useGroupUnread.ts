import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Unread message count per housing group (its internal group conversation),
 * so Focus can show which specific group has a new message.
 */
export const useGroupUnread = () => {
  const { user } = useAuth();
  const [unreadByGroup, setUnreadByGroup] = useState<Record<string, number>>({});

  const refetch = useCallback(async () => {
    if (!user) {
      setUnreadByGroup({});
      return;
    }

    const { data: parts } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);
    const ids = (parts ?? []).map((p) => p.conversation_id);
    if (!ids.length) {
      setUnreadByGroup({});
      return;
    }
    // Min egen læsestatus pr. samtale (per-bruger, ikke delt).
    const lastReadByConv = new Map(
      (parts ?? []).map((p) => [p.conversation_id as string, p.last_read_at as string | null])
    );

    const { data: convs } = await supabase
      .from("conversations")
      .select("id, group_id, type")
      .in("id", ids)
      .eq("type", "group");
    const groupConvs = (convs ?? []).filter((c) => c.group_id);
    if (!groupConvs.length) {
      setUnreadByGroup({});
      return;
    }

    const convToGroup = new Map(groupConvs.map((c) => [c.id as string, c.group_id as string]));
    const { data: msgs } = await supabase
      .from("messages")
      .select("conversation_id, created_at")
      .in("conversation_id", groupConvs.map((c) => c.id))
      .neq("sender_id", user.id);

    const map: Record<string, number> = {};
    for (const m of msgs ?? []) {
      const convId = m.conversation_id as string;
      const lastRead = lastReadByConv.get(convId);
      // Tæl kun beskeder nyere end MIN egen sidste læsning.
      if (lastRead && new Date(m.created_at as string) <= new Date(lastRead)) continue;
      const g = convToGroup.get(convId);
      if (g) map[g] = (map[g] || 0) + 1;
    }
    setUnreadByGroup(map);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadByGroup({});
      return;
    }
    refetch();

    const channel = supabase
      .channel(`group-unread-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => refetch())
      .subscribe();

    const onRead = () => refetch();
    window.addEventListener("messages-read", onRead);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("messages-read", onRead);
    };
  }, [user, refetch]);

  return { unreadByGroup, refetch };
};
