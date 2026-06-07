// ───────────────────────────────────────────────────────────────────────────
// Single source of truth for the listing LAUNCH PROMO.
//
// During the launch window, ANY new listing is published FREE for 30 days
// (and — follow-up — gets one free 7-day extension when it expires).
// Outside the window, listings are paid as normal (a new landlord's first
// 7-day listing at half price is handled separately, server-side).
//
// HOW TO CONTROL IT:
//   • Set LAUNCH_WINDOW_START to your real launch date → starts the 60-day window.
//   • Set it to null → window OFF (all listings paid as normal).
// ───────────────────────────────────────────────────────────────────────────

// TODO: set this to your real launch date. Currently set to 2026-06-07 so the
// offer + banner are visible for review. Set to `null` to turn the free window off.
export const LAUNCH_WINDOW_START: Date | null = new Date("2026-06-07T00:00:00");
export const LAUNCH_WINDOW_DAYS = 60;
export const FREE_LISTING_DAYS = 30;
export const FREE_EXTENSION_DAYS = 7;

const MS_PER_DAY = 86_400_000;

/** Days elapsed/left in the launch window + whether it is currently active. */
export function getLaunchWindowInfo(now: Date = new Date()) {
  if (!LAUNCH_WINDOW_START) return { active: false, daysLeft: 0, daysUsed: 0 };
  const start = LAUNCH_WINDOW_START.getTime();
  const daysUsed = Math.max(0, Math.floor((now.getTime() - start) / MS_PER_DAY));
  const daysLeft = Math.max(0, LAUNCH_WINDOW_DAYS - daysUsed);
  const active = now.getTime() >= start && daysLeft > 0;
  return { active, daysLeft, daysUsed };
}

export function isLaunchWindowActive(now: Date = new Date()): boolean {
  return getLaunchWindowInfo(now).active;
}

/**
 * Whether a listing created at `createdAt` was created during the launch window.
 * Used to grant the one-time free 7-day extension (follow-up step).
 */
export function listingCreatedInWindow(createdAt: string | Date): boolean {
  if (!LAUNCH_WINDOW_START) return false;
  const created = new Date(createdAt).getTime();
  const start = LAUNCH_WINDOW_START.getTime();
  const end = start + LAUNCH_WINDOW_DAYS * MS_PER_DAY;
  return created >= start && created < end;
}
