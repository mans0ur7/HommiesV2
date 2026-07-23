# Hommies — Opsætning af køb i appen (Apple + Google via RevenueCat)

Koden er på plads: appen køber gennem App Store/Google Play (RevenueCat), og
serveren aktiverer produktet (`verify-native-purchase` + `revenuecat-webhook`).
Web bruger stadig Stripe — intet er ændret dér.

**Produkterne** (samme id'er i App Store Connect, Google Play og RevenueCat —
skal oprettes med PRÆCIS disse id'er):

| Produkt-id      | Navn                       | Pris (DKK) | Type        |
|-----------------|----------------------------|-----------:|-------------|
| `listing_7day`  | Annonce — 7 dage           |      99 kr | Consumable  |
| `listing_14day` | Annonce — 14 dage          |     179 kr | Consumable  |
| `listing_30day` | Annonce — 30 dage          |     299 kr | Consumable  |
| `boost_1day`    | Boost — 24 timer           |      49 kr | Consumable  |
| `boost_3day`    | Boost — 3 dage             |      99 kr | Consumable  |
| `boost_7day`    | Boost — 7 dage             |     199 kr | Consumable  |
| `search_agent`  | Ekstra søgeagent-plads     |      29 kr | Consumable  |

**Gratis-reglen lige nu: ALLE annoncer er gratis** (også flere pr. medlem, 30
dage pr. udgivelse) — kun **boost** og **ekstra søgeagenter** koster. Styres af
kontakten `ALL_LISTINGS_FREE` i `src/lib/listingPromo.ts`: sæt den til `false` og
udgiv en opdatering, når annoncer skal koste penge — betalingsflowet (Stripe på
web, App Store/Google Play i apperne) er allerede bygget og tager over af sig
selv. Opret derfor ALLE 7 produkter i butikkerne nu, så prisopdateringen senere
ikke kræver nyt butiks-arbejde.

---

## 1) App Store Connect (Apple)

1. **Aftaler først:** Business → underskriv **Paid Applications**-aftalen og
   udfyld bank- + skatteoplysninger. (IAP virker ikke — heller ikke i sandbox —
   før den er aktiv. Bankverificering kan tage nogle dage: start her!)
2. **Small Business Program** (15 % i stedet for 30 %): ansøg under
   Business → App Store Small Business Program.
3. Din app → **Monetization → In-App Purchases** → opret de 7 produkter som
   **Consumable** med produkt-id'erne ovenfor. Udfyld dansk display-navn,
   beskrivelse og pris (vælg prispunktet nærmest DKK-prisen).
4. Ved første app-indsendelse: vedhæft alle 7 IAP'er til versionen
   (sektionen "In-App Purchases" på versions-siden) — ellers afvises købene.

## 2) Google Play Console

1. **Monetization setup** → udfyld betalingsprofil (hvis ikke gjort).
2. **Products → In-app products** → opret de 7 produkter med samme id'er og
   priser. (Kræver at en build med RevenueCat-pluginet — v1.0.4 — er uploadet
   til en test-track først, ellers kan produkter ikke oprettes.)

## 3) RevenueCat (revenuecat.com — gratis konto)

1. Opret projekt **Hommies** → tilføj to apps:
   - **App Store**-app: bundle id `dk.hommies.app`. Upload en
     **In-App Purchase Key** (.p8) fra App Store Connect → Users and Access →
     Integrations → In-App Purchase.
   - **Play Store**-app: package `dk.hommies.app`. Forbind med en Google Cloud
     service-account JSON (guide i RevenueCat-dashboardet).
2. **Product catalog → Products**: tilføj de 7 produkt-id'er for begge stores.
   Markér dem som **consumable**, så RevenueCat consumer Google-køb automatisk.
3. **API keys**: kopiér de to *public* SDK-nøgler →
   skriv dem i `.env` (og i Vercel env for web-builds er de unødvendige —
   kun native bruger dem):
   ```
   VITE_REVENUECAT_APPLE_KEY=appl_xxx
   VITE_REVENUECAT_GOOGLE_KEY=goog_xxx
   ```
   Kopiér også en *secret* API-nøgle (sk_xxx) til trin 4.
4. **Integrations → Webhooks** → tilføj webhook:
   - URL: `https://nsqirjpcrgapbifvqzln.supabase.co/functions/v1/revenuecat-webhook`
   - Authorization header: find på et langt tilfældigt kodeord (fx `openssl rand -hex 24`)
     — samme værdi som secret'en `REVENUECAT_WEBHOOK_SECRET` i trin 4 nedenfor.

## 4) Supabase (secrets + deploy)

I Supabase-dashboardet → Project Settings → Edge Functions → Secrets (eller CLI):

```
REVENUECAT_SECRET_KEY=sk_xxx          # secret API key fra RevenueCat
REVENUECAT_WEBHOOK_SECRET=<det lange kodeord fra webhook-opsætningen>
ALLOW_SANDBOX_PURCHASES=true          # KUN under test! Slet den før launch.
```

`ALLOW_SANDBOX_PURCHASES`: test-køb (TestFlight/sandbox koster 0 kr) aktiverer
kun produkter, mens denne er sat. **Slet secret'en igen inden launch** — ellers
kan TestFlight-testere få gratis boost/søgeagenter i produktion.

Refusioner: får en bruger pengene tilbage via Apple/Google, markerer webhooken
betalingen som `status='refunded'` i `payments`-tabellen — selve produktet
tilbagekaldes ikke automatisk, så hold øje med den kolonne.

Deploy derefter funktionerne (nye + ændrede):

```
supabase functions deploy verify-native-purchase --project-ref nsqirjpcrgapbifvqzln
supabase functions deploy revenuecat-webhook --project-ref nsqirjpcrgapbifvqzln --no-verify-jwt
supabase functions deploy create-checkout-session --project-ref nsqirjpcrgapbifvqzln
supabase functions deploy verify-payment --project-ref nsqirjpcrgapbifvqzln
supabase functions deploy stripe-webhook --project-ref nsqirjpcrgapbifvqzln --no-verify-jwt
supabase functions deploy send-push --project-ref nsqirjpcrgapbifvqzln
```

(`--no-verify-jwt` på webhooks — de kaldes af Stripe/RevenueCat uden Supabase-JWT.)

## 5) Byg og udgiv

- **iOS:** `npm run build && npx cap sync ios` → Xcode → Archive → upload.
  (RevenueCat-nøglerne SKAL stå i `.env` FØR `npm run build`, ellers er køb slået
  fra i appen med beskeden "Opdater appen".)
- **Android:** `npm run build && npx cap sync android` → byg v1.0.4 AAB
  (versionCode 6) på Windows-maskinen → upload til Play.

## 6) Test

- **iOS sandbox:** App Store Connect → Users and Access → Sandbox Testers →
  opret en testkonto. På TestFlight-builds betales med sandbox automatisk.
- **Android:** tilføj din Google-konto som licenstester i Play Console →
  køb i intern test-track er gratis.
- Testflow: opret annonce #2 (den første er gratis) → betal → tjek at annoncen
  bliver aktiv, og at der ligger en række i `payments`-tabellen med
  `stripe_session_id = rc_...`.
