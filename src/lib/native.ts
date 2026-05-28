import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

export const isNativeApp = () => Capacitor.isNativePlatform();

export async function initNativeApp() {
  if (!Capacitor.isNativePlatform()) return;

  // Flag native platform(s) so CSS can apply status-bar-safe insets. Android 15+
  // forces edge-to-edge and env(safe-area-inset-top) doesn't cover the status
  // bar, so .native-android gets a minimum top inset (see index.css).
  document.documentElement.classList.add("native-app");
  if (Capacitor.getPlatform() === "android") {
    document.documentElement.classList.add("native-android");
  }

  try {
    // Dark icons to match the white app background.
    await StatusBar.setStyle({ style: Style.Light });
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#ffffff" });
    }
  } catch {
    // Plugin unavailable on this platform — ignore
  }
}
