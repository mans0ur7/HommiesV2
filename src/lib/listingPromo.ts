// ───────────────────────────────────────────────────────────────────────────
// Single source of truth for the listing LAUNCH PROMO.
//
// During the free period, ANY new listing (no matter how many you create) is
// published FREE for 30 days (and gets one free 7-day extension on expiry).
//
// HOW TO CONTROL IT:
//   • ALL_LISTINGS_FREE = true  → everything free, NO end date, no countdowns.
//     Payments return only when a future update sets this to false (Mahdis
//     beslutning 23/7-2026: nemmere at styre end et automatisk udløb).
//   • ALL_LISTINGS_FREE = false → the dated launch-window below applies
//     (LAUNCH_WINDOW_START = null turns that off too → all listings paid).
// ───────────────────────────────────────────────────────────────────────────

export const ALL_LISTINGS_FREE = true;

export const LAUNCH_WINDOW_START: Date | null = new Date("2026-06-07T00:00:00");
export const LAUNCH_WINDOW_DAYS = 60;
export const FREE_LISTING_DAYS = 30;
export const FREE_EXTENSION_DAYS = 7;

const MS_PER_DAY = 86_400_000;

/**
 * Days elapsed/left in the launch window + whether it is currently active.
 * `unlimited` betyder "gratis uden slutdato" — UI'et må ikke vise nedtælling.
 */
export function getLaunchWindowInfo(now: Date = new Date()) {
  if (ALL_LISTINGS_FREE) return { active: true, daysLeft: 0, daysUsed: 0, unlimited: true };
  if (!LAUNCH_WINDOW_START) return { active: false, daysLeft: 0, daysUsed: 0, unlimited: false };
  const start = LAUNCH_WINDOW_START.getTime();
  const daysUsed = Math.max(0, Math.floor((now.getTime() - start) / MS_PER_DAY));
  const daysLeft = Math.max(0, LAUNCH_WINDOW_DAYS - daysUsed);
  const active = now.getTime() >= start && daysLeft > 0;
  return { active, daysLeft, daysUsed, unlimited: false };
}

export function isLaunchWindowActive(now: Date = new Date()): boolean {
  return getLaunchWindowInfo(now).active;
}

/**
 * Whether a listing created at `createdAt` was created during the launch window.
 * Used to grant the one-time free 7-day extension (follow-up step).
 */
export function listingCreatedInWindow(createdAt: string | Date): boolean {
  if (ALL_LISTINGS_FREE) return true;
  if (!LAUNCH_WINDOW_START) return false;
  const created = new Date(createdAt).getTime();
  const start = LAUNCH_WINDOW_START.getTime();
  const end = start + LAUNCH_WINDOW_DAYS * MS_PER_DAY;
  return created >= start && created < end;
}
