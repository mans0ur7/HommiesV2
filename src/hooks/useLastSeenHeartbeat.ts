import { useEffect, useRef } from "react";
import { App } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isNativeApp } from "@/lib/native";

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000;

/**
 * Bumps profiles.last_seen_at while the app is foregrounded so we can show
 * "Active now / 5m ago / 2h ago" on roomie cards and chat lists.
 *
 * Mount once at the app root. Calls the SECURITY DEFINER RPC `touch_last_seen_at`
 * so the client doesn't need broad UPDATE rights on the profiles table.
 */
export function useLastSeenHeartbeat() {
  const { user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;

    const touch = () => {
      supabase.rpc("touch_last_seen_at").then(({ error }) => {
        if (error) console.warn("[heartbeat] touch failed", error.message);
      });
    };

    touch();
    timerRef.current = setInterval(touch, HEARTBEAT_INTERVAL_MS);

    // Bump again when the app/tab comes back to the foreground.
    const onVisibility = () => {
      if (document.visibilityState === "visible") touch();
    };
    document.addEventListener("visibilitychange", onVisibility);

    let nativeListener: { remove: () => void } | undefined;
    if (isNativeApp()) {
      App.addListener("appStateChange", (s) => {
        if (s.isActive) touch();
      }).then((l) => {
        nativeListener = l;
      });
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
      nativeListener?.remove();
    };
  }, [user?.id]);
}
