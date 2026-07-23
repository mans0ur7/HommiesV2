// Fælles prisliste for alle betalingsveje (Stripe Checkout på web,
// verify-native-purchase for App Store/Google Play-køb).
// Produkt-id'erne er identiske i Stripe, App Store Connect og Google Play.
// Beløb i øre (DKK).

export const PRICES: Record<string, { amount: number; name: string }> = {
  boost_1day:    { amount: 4900,  name: "Boost — 24 timer" },
  boost_3day:    { amount: 9900,  name: "Boost — 3 dage" },
  boost_7day:    { amount: 19900, name: "Boost — 7 dage" },
  listing_7day:  { amount: 9900,  name: "Annonce — 7 dage" },
  listing_14day: { amount: 17900, name: "Annonce — 14 dage" },
  listing_30day: { amount: 29900, name: "Annonce — 30 dage" },
  search_agent:  { amount: 2900,  name: "Ekstra søgeagent-plads" },
};
