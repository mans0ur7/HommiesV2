// Native share + in-app browser helpers. Falls back gracefully on web.
import { Share } from "@capacitor/share";
import { Browser } from "@capacitor/browser";
import { isNativeApp } from "./native";

export interface ShareOptions {
  title: string;
  text?: string;
  url: string;
}

/**
 * Open the device's native share sheet (Android: WhatsApp, SMS, Gmail, etc.)
 * On the web, falls back to navigator.share if available, else copies the URL.
 */
export async function shareLink(opts: ShareOptions): Promise<"shared" | "copied" | "cancelled"> {
  try {
    if (isNativeApp()) {
      await Share.share({
        title: opts.title,
        text: opts.text,
        url: opts.url,
        dialogTitle: opts.title,
      });
      return "shared";
    }
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: unknown }).share) {
      await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
        title: opts.title,
        text: opts.text,
        url: opts.url,
      });
      return "shared";
    }
    // Last resort: copy URL
    await navigator.clipboard.writeText(opts.url);
    return "copied";
  } catch (err) {
    // User cancelled the share sheet is normal — swallow.
    const message = (err as Error)?.message ?? "";
    if (message.includes("cancel")) return "cancelled";
    // Fallback once more to clipboard
    try {
      await navigator.clipboard.writeText(opts.url);
      return "copied";
    } catch {
      return "cancelled";
    }
  }
}

/**
 * Open an external URL in the in-app browser (native) or a new tab (web).
 * Keeps users from leaving Hommies for things like the Resend support page
 * or our DAWA address autocomplete docs.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (isNativeApp()) {
    await Browser.open({ url });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
