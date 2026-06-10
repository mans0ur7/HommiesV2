# Hommies — iOS Handoff & Changelog

**Audience:** the engineer/model (Fable 5) bringing the iOS app up to parity.
**Date:** 2026-06-08 · **Author of changes:** prior Android/web work (Opus).
**Scope:** everything done since the iOS platform was added to the repo (commit `324adb2`, ~43 commits).

---

## 0) TL;DR — read this first

Hommies is a **Capacitor v8 app**. The entire UI + business logic is **React 18 + TypeScript + Vite** in `src/`, compiled to a web bundle (`dist/`) that is **shared by BOTH Android and iOS**. Supabase (Postgres + Auth + Edge Functions + Realtime) is the backend, shared by web + both apps.

**Consequence:** almost everything below is **already in iOS** the moment you build `ios/` from this repo — the React fixes and the Supabase/server-side fixes are platform-agnostic. The iOS-specific work is **native config + verification**, not re-implementing features.

- **App ID:** `dk.hommies.app`
- **Supabase project ref:** `nsqirjpcrgapbifvqzln`
- **Android status:** LIVE on Google Play (v1.0.1 / versionCode 2). A new build (v1.0.2 / versionCode 3) is pending to ship the app-code changes below.
- **iOS status:** platform exists in `ios/`, **never built** (awaited a Mac). Needs Xcode on macOS.
- **Web status:** auto-deploys from `main` via Vercel — already has everything.
- **Supabase status:** all migrations + edge functions are **applied live in production**.

---

## 1) iOS-SPECIFIC TODO (this is the actual work)

These are the things that are NOT automatically handled by the shared code:

### 1.1 Build & signing (on a Mac)
- `npm install && npm run build && npx cap sync ios`
- Open `ios/App/App.xcworkspace` in Xcode.
- Set the Team / signing, bundle id `dk.hommies.app`, version 1.0.2.
- Archive → upload to App Store Connect → TestFlight → review.

### 1.2 Push notifications (APNs) — biggest native gap
The push pipeline is built and works on Android via **FCM HTTP v1** (`supabase/functions/send-push`). iOS push also goes **through FCM** (FCM → APNs), so:
- In **Firebase console** → Cloud Messaging → upload the **APNs Auth Key (.p8)** for the iOS app.
- Add the iOS app to Firebase → download **`GoogleService-Info.plist`** → place in `ios/App/App/` (it's **gitignored**, like `android/app/google-services.json`).
- Xcode: enable **Push Notifications** + **Background Modes (remote notifications)** capabilities.
- `Info.plist` / entitlements for aps-environment.
- The client already registers tokens for both platforms via `src/lib/nativePush.ts` (`@capacitor/push-notifications`) → stores into `native_device_tokens` with `platform = 'ios'`. **Verify** the token is captured on a real device (push doesn't work in the simulator).
- `send-push/index.ts` sends an FCM message with `notification` + an `android` block. For iOS you may want to add an `apns` block (sound/badge) — currently it relies on FCM defaults. Verify delivery + the tap deep-link (`data.url`) opens the right route.

### 1.3 Info.plist usage strings (REQUIRED or iOS rejects/crashes on permission)
Add these (features that already exist in the app):
- `NSCameraUsageDescription` — avatar + listing photos (`@capacitor/camera`).
- `NSPhotoLibraryUsageDescription` / `NSPhotoLibraryAddUsageDescription` — picking/saving images.
- `NSFaceIDUsageDescription` — biometric quick-login (`@aparajita/capacitor-biometric-auth`, Face ID/Touch ID).
- `NSLocationWhenInUseUsageDescription` — "show nearby cities" (`@capacitor/geolocation`).

### 1.4 Safe-area (notch / Dynamic Island / home indicator)
The app uses CSS vars `--safe-top` / `--safe-bottom` = `env(safe-area-inset-*)`. There is an **Android-only** override `html.native-android { --safe-top: max(env, 28px) … }` in `src/index.css` because Android 15 edge-to-edge doesn't report insets. iOS reports `env()` correctly, so it *should* be fine — but **verify on a notch device + Dynamic Island**:
- Mobile header, bottom navigation, all bottom-sheets, chat input.
- The **new full-screen group chat** (`GroupDetailView` / `GroupChat`) which hides the app header and adds its own `pt-[calc(var(--safe-top)+0.5rem)]` — verify the back button isn't under the status bar and the input isn't under the home indicator.
- Onboarding slides (status-bar style is toggled via `@capacitor/status-bar` in `src/components/onboarding/Onboarding.tsx`).

### 1.5 Keyboard
iOS keyboard behavior differs. Verify the chat inputs (`ChatArea`, `GroupChat`) and forms aren't covered by the keyboard; may need `@capacitor/keyboard` config (resize mode) in `capacitor.config.ts`.

### 1.6 Splash
`capacitor.config.ts` SplashScreen is configured (peach `#FCC9BA`). iOS uses `ios/App/App/Assets.xcassets` / `Splash`. The Android splash was redesigned to **match the iOS lockup** (commit `44d41db`), so iOS is the reference — just verify it renders.

### 1.7 Deep links / Universal Links
Android has intent-filters for `hommies.dk/property/*` and `/user/*` (`AndroidManifest.xml`). iOS needs **Associated Domains** (`applinks:hommies.dk`) + an `apple-app-site-association` file hosted on the domain, if you want the same deep-linking. Push taps use in-app routing (`window.location.href`), which works regardless.

### 1.8 StatusBar
`Onboarding.tsx` calls `StatusBar.setStyle({ style: Dark/Light })`. Verify the status bar contrast across screens on iOS.

---

## 2) FULL CHANGELOG since iOS was added (by theme)

> All of these are in the **shared React code or Supabase**, so they apply to iOS automatically once built — UNLESS noted as platform-specific. Use this list to know what to **regression-test on iOS**.

### A. Push-notification system (server + native)
- **Native push** (`908b414`): `@capacitor/push-notifications` integration (`src/lib/nativePush.ts`), device-token storage (`native_device_tokens` table + RLS), and the FCM HTTP v1 sender in `supabase/functions/send-push` (RS256 JWT via service account, sends web-push VAPID **and** native FCM). → **iOS: needs APNs config, see 1.2.**
- **notify-dispatcher** (`3de1dc0`, plus later edits): single webhook endpoint that pushes for `messages`, `match_requests`, and `notifications`-table rows (new_property, group_request, group_invitation, contract_ready/signed, group/match status). Routes group/contract notifications to `/focus` / `/documents`.

### B. Server-side DB (live for everyone, platform-agnostic — migrations in `supabase/migrations/`)
- `notifications` **DELETE RLS policy** (`43f22a5`) — "Slet læste"/"Marker alle læst" were silently blocked.
- **Contracts**: state-machine + notifications trigger, RLS `WITH CHECK`, immutability after signed (`778ca59`).
- **Payments** INSERT policy lockdown (`778ca59`).
- **Search-agent** notification trigger — fire on matching published listings (`71fde9c`).
- **`is_group_member` includes the group creator** (`afd801d`) — creator could not open their own group chat.
- **Group-invitation** notification trigger (`a682f60`) — invitee was never notified.
- **match_request** bell-notification trigger (`a682f60`) — requests now appear in the bell, not just Inbox.
- **Group-message** bell-notification trigger (`dbd44aa`) — group messages now appear in the bell, deduped per group.
- **create-conversation** re-syncs participants so late-accepting members receive messages (`ecae964`).

### C. Features / UX (shared React)
- **Launch promo**: free listings during the launch window + banner (`de8c41d`) — `src/lib/listingPromo.ts` (single source of truth; `LAUNCH_WINDOW_START` controls it).
- **Oscar partner** discount banner on home (`fed4f25`).
- Removed misleading **/flytteservice** page (`f4e0427`) — we don't offer moving.
- **Home** rebuilt as a personalized daily briefing + rails (`cc612cf`, `2613dfd`); role-aware hero + time-based one-word greeting (`6f9e4eb`).
- **Editorial design system** sweep across the app (`bd8e3f3`).
- **Explore** redesigned cards (`93a580a`), removed quick city chips (`45ba134`).
- **Inbox** redesigned + full-bleed chat on mobile (`f1c237c`, `6e8f3e8`); per-tab unread badges (Udlejer/Roomies) (`15a04b2`).
- **Nationality** field now lists real **countries** in Danish, not adjectives (`6f9e4eb`) — `src/data/nationalities.ts`.
- **Search agents**: one location per agent (single-select area) + require a specific city (`a6b7574`, `6f9e4eb`).
- **Contracts = "husorden"** (house-rules / roomie agreement, NOT a lease): entry-point copy renamed from "lejekontrakt" → "husorden", signing copy softened (`778ca59`). PDF in `src/lib/generateContractPdf.ts`. Penneo/MitID is dead scaffolding (unused columns).
- **Group chat overhaul**: clearer invitation card with always-visible Accept/Reject (`7a93dc6`); per-group unread indicator (`fcfa1df`); redesigned chat UI with avatars + colour-coded sender names (`2203cbc`); **full-screen one-page group view** that hides app header/bottom-nav (`bdea13e`).
- **Biometric quick-login** that actually logs in (`edb5d5c`). → **iOS: needs `NSFaceIDUsageDescription`.**

### D. Mobile / native (some Android-specific)
- **Safe-area** sweep: chat input + all bottom-sheet footers (`48079a1`), Explore sticky-bar offset (`8635f82`), onboarding tour buttons not cut off (`72292cf`), remaining bottom sheets (`d699acc`). → **Verify on iOS (1.4).**
- **Android splash** redesign to match iOS lockup (`f9082a9`, `44d41db`). → iOS is the reference.

---

## 3) BUGS FIXED — verify the same behavior on iOS

Most are logic/RLS (shared), so iOS inherits the fix; listed so you can regression-test:

1. **"Slet læste" did nothing** — missing `notifications` DELETE RLS policy. Fixed.
2. **Landlord gender filter returned 0 results** — compared a canonical value to a translated label (`Matches.tsx`). Fixed.
3. **Landlord contract badge never appeared** — hook queried statuses the app never writes (`usePendingContracts.ts`). Fixed.
4. **Connecting never reached the recipient** — the Matches swipe only inserted a `connections` row (invisible); now it also creates a `match_request`. An orphan connection also blocked the Explore "Forbind" path. Fixed (`f4ec33e`).
5. **Group invitations: invitee never notified** — invite created a member row but no notification. Fixed with a trigger.
6. **Group creator couldn't see/open their own group chat** — `is_group_member` excluded the creator → 403 from `create-conversation` → empty chat. Fixed.
7. **Group messages didn't reach members** who accepted after the conversation was created (not participants). Fixed with participant re-sync.
8. **Group unread stuck on the Inbox icon** and never cleared — group messages counted on Inbox and `GroupChat` never marked them read. Now counted on **Focus** + marked read on view.
9. **Search agents never fired notifications.** Fixed with a Postgres trigger.
10. **Match requests / group requests not realtime in Inbox.** Added subscriptions; ordered newest-first.
11. **CompleteProfile data loss** — `work_other` dropped for employed/self-employed; `selectedUserType` cleared before the insert succeeded. Fixed.
12. **Password rules drift** — Settings allowed weaker passwords than signup. Unified in `src/lib/validation.ts`.
13. **Pagination errors swallowed** + auto-retry loop. Added error state + retry (`usePaginatedProperties/Roomies`).
14. **Onboarding logo was a blank white square** (`2b47dbf`).
15. **Inbox chat header overlapped the status bar** (`d4505b5`). → re-verify on iOS notch.
16. **GoTrue Auth 500 "Database error finding user"** — NULL token columns in `auth.users` (one-off DB data fix; not code).

### Things flagged but intentionally NOT changed (decide for iOS too)
- Contract PDF clips very long text in a single block (no in-block pagination in `generateContractPdf.ts`).
- Penneo/MitID columns + unused lease columns left in the schema (dead).
- Duplicate push webhooks on `messages` and `match_requests` → recipients get a **double push** (needs a DB cleanup; pending authorization).

---

## 4) ADDRESS SEARCH (DAWA) — verify on iOS
Address autocomplete in create-listing + Explore uses the free Danish **DAWA** API (`src/hooks/useDawaAutocomplete.ts`, `https://api.dataforsyningen.dk/autocomplete`, no key, CORS `*`). It works on Android. **Verify the `fetch` works from the iOS WKWebView** (it should; CORS is open). If it fails on iOS, switch the DAWA call to `CapacitorHttp` (native HTTP, bypasses WebView CORS) — this was identified as the fallback.

---

## 5) SECURITY TODOs (do before/with the iOS release)
- 🔒 **Rotate the Firebase service-account key** (it was shared in a chat). The new key goes ONLY into the Supabase secret `GOOGLE_SERVICE_ACCOUNT_JSON`, never committed.
- 🔒 **Rotate the Supabase `service_role` key** (also shared in chat).
- `GoogleService-Info.plist` (iOS) + `google-services.json` (Android) are **gitignored** — keep them out of git.

---

## 6) HOW THE BACKEND IS CHANGED (for reference)
DB/edge changes were applied to production directly with the standalone Supabase CLI:
`supabase db query --linked "<SQL>"` (runs SQL on the live DB via the Management API, no DB password) and `supabase functions deploy <name> --project-ref nsqirjpcrgapbifvqzln`. Migration files mirror every change in `supabase/migrations/`.

---

**Bottom line for iOS:** build it on a Mac, wire APNs + Info.plist permission strings + safe-area verification, and regression-test the flows in §3. The features and server fixes are already there.
