import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

export const isNativeApp = () => Capacitor.isNativePlatform();

export async function initNativeApp() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Keep the web content below the system status bar instead of drawing under it
    await StatusBar.setOverlaysWebView({ overlay: false });
    // Light status bar (dark icons) to match the white app background
    await StatusBar.setStyle({ style: Style.Light });
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#ffffff" });
    }
  } catch {
    // Plugin unavailable on this platform — ignore
  }
}
