import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp } from "./native";

export const SUPPORT_EMAIL = "info@hommies.dk";
const APP_VERSION = "1.0.0";

type ReportKind = "bug" | "problem";

/**
 * Sends a bug/problem report straight to the support inbox via the
 * `send-bug-report` edge function. Nothing opens on the user's device — the
 * email is sent server-side. Works in the app and on the website, for both
 * logged-in and anonymous users.
 */
export async function submitReport(
  description: string,
  kind: ReportKind,
  userEmail?: string | null,
) {
  const { data, error } = await supabase.functions.invoke("send-bug-report", {
    body: {
      description,
      kind,
      userEmail: userEmail ?? null,
      page: window.location.pathname,
      platform: isNativeApp() ? `App (${Capacitor.getPlatform()})` : "Web",
      appVersion: APP_VERSION,
      userAgent: navigator.userAgent,
    },
  });

  if (error) throw error;
  return data;
}
