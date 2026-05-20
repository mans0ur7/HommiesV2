import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Tracks online users via a single shared Supabase Realtime presence channel.
 *
 * The channel is a module-level singleton so that multiple components calling
 * usePresence() at the same time (e.g. ChatArea + InboxConversationList) share
 * ONE channel instead of each creating their own — subscribing twice to the same
 * topic is an anti-pattern that can throw.
 *
 * Usage:
 *   const { isOnline } = usePresence();
 *   {isOnline(otherUserId) && <GreenDot />}
 */

let channel: RealtimeChannel | null = null;
let channelUserId: string | null = null;
let refCount = 0;
const listeners = new Set<(ids: Set<string>) => void>();
let currentIds = new Set<string>();

function notify() {
  listeners.forEach((fn) => fn(currentIds));
}

function ensureChannel(userId: string) {
  // Re-create the channel if the logged-in user changed
  if (channel && channelUserId !== userId) {
    teardownChannel();
  }
  if (channel) return;

  channelUserId = userId;
  channel = supabase.channel("online-users", {
    config: { presence: { key: userId } },
  });

  channel
    .on("presence", { event: "sync" }, () => {
      const state = channel!.presenceState();
      currentIds = new Set(Object.keys(state));
      notify();
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        try {
          await channel!.track({ online_at: new Date().toISOString() });
        } catch {
          /* ignore track errors */
        }
      }
    });
}

function teardownChannel() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
    channelUserId = null;
    currentIds = new Set();
  }
}

export const usePresence = () => {
  const { user } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(currentIds);

  useEffect(() => {
    if (!user) {
      setOnlineUserIds(new Set());
      return;
    }

    const listener = (ids: Set<string>) => setOnlineUserIds(new Set(ids));
    listeners.add(listener);
    refCount++;

    ensureChannel(user.id);
    // Sync immediately with whatever state we already have
    listener(currentIds);

    return () => {
      listeners.delete(listener);
      refCount--;
      // Only tear the channel down when no component is using it anymore
      if (refCount <= 0) {
        refCount = 0;
        teardownChannel();
      }
    };
  }, [user?.id]);

  const isOnline = (userId: string | null | undefined) =>
    !!userId && onlineUserIds.has(userId);

  return { onlineUserIds, isOnline };
};
