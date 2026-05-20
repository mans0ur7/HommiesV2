import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Tracks online users via a single shared Supabase Realtime presence channel.
 * Each logged-in client joins the "online-users" channel with their user_id;
 * the hook exposes a Set of currently-online user ids.
 *
 * Usage:
 *   const { isOnline } = usePresence();
 *   ...
 *   {isOnline(otherUserId) && <GreenDot />}
 */
export const usePresence = () => {
  const { user } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) {
      setOnlineUserIds(new Set());
      return;
    }

    const channel = supabase.channel("online-users", {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineUserIds(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    // Also clean up on tab close
    const handleBeforeUnload = () => {
      channel.untrack();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user?.id]);

  const isOnline = (userId: string | null | undefined) =>
    !!userId && onlineUserIds.has(userId);

  return { onlineUserIds, isOnline };
};
