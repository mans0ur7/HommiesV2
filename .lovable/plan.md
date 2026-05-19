## Vision

Forsiden skal væk fra "2020-startup" rytmen (badge → titel → grid, samme padding, runde hjørner, gradients overalt). Ny følelse: **rolig, image-first og produkt-konfident** — Airbnb's billed-tæthed møder Notion/Stripe's bento-moduler. Mindre dekorations-svulst (svævende cirkler, blurs, animerede dots), mere indhold der bærer sig selv.

## Ny rytme på siden

```text
1. HERO              (asymmetrisk, søge-driven, image-bento bagved)
2. STATS-STRIBE      (NY — tal under hero, bygger tillid med det samme)
3. FEATURED ROOMS    (større kort, magasin-rytme, ikke 4 ens tiles)
4. EXPLORE BYER      (image-mosaik, ikke carousel m. dots)
5. SÅDAN VIRKER DET  (NY — 3 trin med produkt-screenshots i bento)
6. HOUSING / VÆRDIER (bento-grid, ikke split image+tekst)
7. CTA UDLEJER       (fuld-bredde, ren typografi, ingen roterende cirkler)
8. FAQ               (stor 2-kolonne, mindre badges)
9. FOOTER            (uændret)
```

## Sektion-for-sektion

### 1. Hero — search-driven, image-bento
- Tabs flyttes ind i en stor søgepanel-bar (à la Airbnb): Værelse / Roomie / Flytning / Tryghed som kompakte chips, dernæst by-input + filter-knap + "Søg".
- Venstre: stor headline + 1 linje subtitle + søgepanel. Højre: **bento af 3 ægte boligbilleder** (1 stor + 2 små) med små floating "Fra X kr" labels — viser produktet med det samme i stedet for én stor stockphoto.
- Væk: roterende slideshow med 4 emner, sparkles-cirkel, dot-pagination. Roomie/Flytning/Tryghed bliver små shortcuts under søgepanelet i stedet for fuld-skift.

### 2. Stats-stribe (NY)
- Tynd sektion direkte under hero. 4 tal i én række: aktive værelser, byer dækket, brugere matchet, gennemsnitlig svartid.
- Tal hentes fra databasen (count på properties hvor `is_published=true`, distinct cities, count profiles, etc.) — ingen hardcoded fake-tal.
- Ren typografi, navy på cream, ingen badges.

### 3. Featured rooms — magasin-rytme
- I stedet for 4 ens 3:4 tiles: **1 stor "udvalgt" 16:10 til venstre + 2 små stablede 4:3 til højre** (asymmetrisk bento). Plus en lille horisontal scroll-stribe nedenunder med "flere håndplukkede".
- Pris/info under billedet (ikke som overlay-badge på billedet) — mere produkt, mindre marketing-sticker.

### 4. Explore byer — mosaik
- Drop carousel + dot-pagination. I stedet en **ujævn 2-row mosaik**: København fylder 2 kolonner (stor), Aarhus + Odense som mellem, små for resten. Image-first, intet tekst-badge ovenfor.
- Property-count som diskret label nederst i hjørnet, ikke som hover-popup.

### 5. Sådan virker det (NY)
- **Bento i 3 felter** (Notion-stil): "1. Opret profil", "2. Match med roomies eller værelser", "3. Skriv & flyt ind". Hvert felt har en lille produkt-illustration (mock af inbox/match-card/profile) — ikke kun et ikon i en cirkel.
- Felterne er forskellige størrelser, ikke 3 identiske kort.

### 6. Housing-sektion → værdi-bento
- Nuværende split (4-image grid + tekst + 3 features) bliver til **bento-grid med 4-5 forskellige tiles**: én med stort foto, én med citat/testimonial-snippet, én med ikon+tekst (verificeret), én med kort-thumbnail (hele Danmark).
- Bryder den ensformige "stagger image grid" som ser meget 2021 ud.

### 7. CTA udlejer
- Fjern de roterende koncentriske cirkler + svævende dots (det er det mest "outdated" element på siden).
- Fuld-bredde mørk navy sektion, stor headline venstre, lille produktscreenshot af "opret annonce"-flow til højre. Én knap. Færdig.

### 8. FAQ
- Behold accordion-funktion, men **2 kolonner på desktop** (4-5 spørgsmål per kolonne i stedet for 1 lang liste). Fjern det nummererede "01" badge — ren typografi rækker.

## Globale design-greb (gælder hele siden)

- **Fjern dekorationer:** alle `animate-[spin]` koncentriske cirkler, blur-orbs, floating animated dots, sparkles-ikoner i badges. Disse er den primære kilde til "outdated" følelsen.
- **Færre badges:** drop "Udvalgte værelser / Lokationer / FAQ" pill-badges over hver titel. Sektionstitler står selv.
- **Strammere typografi-skala:** én konsistent display-størrelse til section-headlines (~clamp(28px, 4vw, 44px)), én til body. Mindre variation = mere ro.
- **Mere whitespace, mindre rounded:** sektionspadding op (py-16/20 desktop), border-radius ned fra 2xl/3xl til lg/xl på de fleste kort. De "marshmallow-runde" hjørner ser dateret ud.
- **Konsistent gutter:** brug max-w-7xl + px-6/lg:px-8 i stedet for blandet `px-4 sm:px-6 lg:px-24`.
- **Farve uændret:** navy #032A3B + rose #FFC2BB + cream — kun strukturen ændres.

## Teknisk

- Alle ændringer er rent frontend i `src/components/landing/*` + `src/pages/Index.tsx`. Ingen backend, ingen schema-ændringer.
- Stats-sektionen laver 3-4 lette `count`-queries mod Supabase (cached via React Query, staleTime 5min).
- Nye komponenter: `StatsBar.tsx`, `HowItWorksSection.tsx`. Eksisterende skrives om: `HeroSection`, `FeaturedRoomsSection`, `ExploreSection`, `HousingSection`, `CTASection`, `FAQSection`.
- `Index.tsx` opdateres til ny sektionsrækkefølge.
- Memory-rule [Hero polish] og [Landing page sections] opdateres efter for at matche nyt design.
- Mobil: alle nye layouts kollapser til single-column / horizontal scroll hvor det giver mening. Bento bliver stack på mobil.

## Hvad jeg IKKE rører
- Logget-ind dashboard (`LoggedInHome`) — kun den offentlige forside.
- Navbar og Footer (kan justeres senere hvis du vil).
- Funktionalitet — alle navigations-mål, links og data-hentning bevares.
