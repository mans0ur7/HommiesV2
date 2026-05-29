import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { App, URLOpenListenerEvent } from "@capacitor/app";
import { isNativeApp } from "@/lib/native";

/**
 * Wires Capacitor's appUrlOpen event to React Router. When the OS hands us
 * a hommies.dk URL (because the user clicked a shared link in WhatsApp,
 * Instagram, etc.) we strip the origin and navigate to the in-app route.
 *
 * Example: tap https://hommies.dk/property/abc on a phone with Hommies
 * installed → app opens directly on the property page instead of a browser tab.
 */
export function useDeepLinks() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNativeApp()) return;

    const sub = App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
      try {
        const url = new URL(event.url);
        const path = url.pathname + url.search + url.hash;
        if (path && path !== "/") navigate(path, { replace: false });
      } catch {
        // ignore malformed URLs
      }
    });

    return () => {
      sub.then((s) => s.remove()).catch(() => undefined);
    };
  }, [navigate]);
}
