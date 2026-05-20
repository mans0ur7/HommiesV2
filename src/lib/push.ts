import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export const isPushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export const getNotificationPermission = (): NotificationPermission =>
  isPushSupported() ? Notification.permission : "denied";

const urlBase64ToUint8Array = (base64: string) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const sane = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(sane);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer | null) => {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str);
};

export async function subscribeToPush(userId: string): Promise<{ ok: boolean; message?: string }> {
  if (!isPushSupported()) return { ok: false, message: "Push understøttes ikke i denne browser" };
  if (!VAPID_PUBLIC_KEY) return { ok: false, message: "VAPID-nøgle mangler i frontend env" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, message: "Tilladelse afvist" };

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = sub.toJSON();
  const endpoint = json.endpoint ?? sub.endpoint;
  const p256dh   = json.keys?.p256dh ?? arrayBufferToBase64(sub.getKey?.("p256dh") ?? null);
  const auth     = json.keys?.auth   ?? arrayBufferToBase64(sub.getKey?.("auth")   ?? null);

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent,
      },
      { onConflict: "user_id,endpoint" }
    );

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function unsubscribeFromPush(userId: string): Promise<{ ok: boolean; message?: string }> {
  if (!isPushSupported()) return { ok: true };

  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    const endpoint = sub?.endpoint;

    await sub?.unsubscribe();

    if (endpoint) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("endpoint", endpoint);
    } else {
      // Fallback: clear all subs for this user
      await supabase.from("push_subscriptions").delete().eq("user_id", userId);
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

export async function hasActivePushSubscription(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}
