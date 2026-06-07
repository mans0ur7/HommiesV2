import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";

// Native push (FCM on Android, APNs on iOS). Web push is handled separately in
// src/lib/push.ts. Call initNativePush() after the user is signed in.

let listenersAdded = false;

async function storeToken(token: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("native_device_tokens").upsert(
    { user_id: user.id, token, platform: Capacitor.getPlatform() },
    { onConflict: "user_id,token" },
  );
}

export async function initNativePush() {
  if (!Capacitor.isNativePlatform()) return;

  if (!listenersAdded) {
    listenersAdded = true;

    PushNotifications.addListener("registration", (t) => {
      void storeToken(t.value);
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.error("Native push registration error:", err);
    });

    // Tapping a push opens the deep link carried in the data payload.
    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const url = (action.notification?.data as Record<string, string> | undefined)?.url;
      if (url) window.location.href = url;
    });
  }

  let receive = (await PushNotifications.checkPermissions()).receive;
  if (receive === "prompt" || receive === "prompt-with-rationale") {
    receive = (await PushNotifications.requestPermissions()).receive;
  }
  if (receive === "granted") {
    await PushNotifications.register();
  }
}
