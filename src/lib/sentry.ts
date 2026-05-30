import * as Sentry from "@sentry/react";

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

/**
 * Initialize Sentry early so uncaught errors and unhandled rejections
 * during boot are still captured. No-op in dev / when the DSN env is
 * missing so local development stays quiet.
 */
export function initSentry() {
  if (!DSN) return;

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.browserTracingIntegration()],
    ignoreErrors: [
      // Browser noise — almost never actionable
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error promise rejection captured",
    ],
  });

  // Expose for the RouteErrorBoundary's lazy forwarding
  type WindowWithSentry = Window & { Sentry?: typeof Sentry };
  (window as unknown as WindowWithSentry).Sentry = Sentry;
}
