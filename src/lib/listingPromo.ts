// ───────────────────────────────────────────────────────────────────────────
// Single source of truth for FREE LISTINGS.
//
// While LISTINGS_FREE is true, creating and publishing listings is completely
// free (any number of listings, 30 days per publish). Boost and search agents
// are paid as normal. To start charging for listings later: set LISTINGS_FREE
// to false and ship an app/web update — the paid flows (Stripe on web, App
// Store/Google Play in the apps) are already built and take over automatically.
// ───────────────────────────────────────────────────────────────────────────

export const LISTINGS_FREE = true;

export const FREE_LISTING_DAYS = 30;

// Kept for the banner/progress UI shape ({ active, daysLeft, daysUsed }).
// While LISTINGS_FREE, the window is simply "always active" with no countdown.
export const LAUNCH_WINDOW_DAYS = 60;

export function getLaunchWindowInfo(_now: Date = new Date()) {
  return { active: LISTINGS_FREE, daysLeft: 0, daysUsed: 0 };
}

export function isLaunchWindowActive(now: Date = new Date()): boolean {
  return getLaunchWindowInfo(now).active;
}
