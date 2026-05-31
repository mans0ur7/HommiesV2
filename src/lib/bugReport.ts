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

const RATING_LABELS: Record<string, string> = {
  appOplevelse: "App-oplevelse",
  boligSøgning: "Boligsøgning",
  matchOplevelse: "Match-oplevelse",
  chatOplevelse: "Chat-oplevelse",
  support: "Support",
};

/**
 * Sends an app/website experience rating (overall + per-area stars + optional
 * comment) to the support inbox via the `send-bug-report` edge function so the
 * team actually receives it (previously it was only kept in localStorage).
 */
export async function submitAppRating(params: {
  overallRating: number;
  detailedRatings: Record<string, number>;
  feedback?: string;
  userEmail?: string | null;
}) {
  const details = Object.entries(params.detailedRatings)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${RATING_LABELS[k] ?? k}: ${v}/5`)
    .join("\n");
  const description = [
    `Samlet vurdering: ${params.overallRating}/5`,
    details ? `\n${details}` : "",
    params.feedback?.trim() ? `\nKommentar:\n${params.feedback.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const { data, error } = await supabase.functions.invoke("send-bug-report", {
    body: {
      kind: "rating",
      description,
      userEmail: params.userEmail ?? null,
      page: window.location.pathname,
      platform: isNativeApp() ? `App (${Capacitor.getPlatform()})` : "Web",
      appVersion: APP_VERSION,
      userAgent: navigator.userAgent,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Sends a message from the public "Contact us" form to the support inbox via the
 * same `send-bug-report` edge function (kind "contact"). The sender's email is
 * set as reply-to so we can answer directly.
 */
export async function submitContactMessage(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const { data, error } = await supabase.functions.invoke("send-bug-report", {
    body: {
      kind: "contact",
      description: params.message,
      name: params.name,
      contactSubject: params.subject,
      userEmail: params.email,
      page: window.location.pathname,
      platform: isNativeApp() ? `App (${Capacitor.getPlatform()})` : "Web",
      appVersion: APP_VERSION,
      userAgent: navigator.userAgent,
    },
  });

  if (error) throw error;
  return data;
}
