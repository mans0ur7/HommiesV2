import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { initNativeApp, isNativeApp } from "./lib/native";
import { initSentry } from "./lib/sentry";

initSentry();
initNativeApp();

// Register the service worker early so the site is install-eligible (PWA).
// Inside the Capacitor wrapper we skip it — the native shell owns lifecycle.
if (
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  !isNativeApp() &&
  window.location.protocol !== "file:"
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.warn("[sw] register failed", err));
  });
}

createRoot(document.getElementById("root")!).render(<App />);
