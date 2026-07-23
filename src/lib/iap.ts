import { Capacitor } from "@capacitor/core";
import {
  Purchases,
  PRODUCT_CATEGORY,
  PURCHASES_ERROR_CODE,
} from "@revenuecat/purchases-capacitor";
import { supabase } from "@/integrations/supabase/client";

// Native in-app purchases (Apple App Store / Google Play) via RevenueCat.
// Web uses Stripe Checkout instead (create-checkout-session) — Apple/Google
// begge kræver deres egen billing for digitale køb i appen, så Stripe må ikke
// bruges her. Produkt-id'erne er identiske i App Store Connect, Google Play
// og Stripe-PRICES-mappet, så serverens fulfillment er fælles.
//
// Flow: purchaseIap() → butikkens betalingsark → verify-native-purchase
// (server verificerer købet hos RevenueCat og aktiverer produktet).
// revenuecat-webhook er backup-vejen hvis appen dør inden verify-kaldet;
// den læser property_id fra subscriber-attributten sat før købet.

export type IapProductType =
  | "boost_1day" | "boost_3day" | "boost_7day"
  | "listing_7day" | "listing_14day" | "listing_30day"
  | "search_agent";

export const IAP_PRODUCT_IDS: IapProductType[] = [
  "boost_1day", "boost_3day", "boost_7day",
  "listing_7day", "listing_14day", "listing_30day",
  "search_agent",
];

export type IapPurchaseResult =
  | { ok: true; pending?: boolean }
  | { ok: false; cancelled: boolean; message?: string };

function apiKey(): string | undefined {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") return import.meta.env.VITE_REVENUECAT_APPLE_KEY;
  if (platform === "android") return import.meta.env.VITE_REVENUECAT_GOOGLE_KEY;
  return undefined;
}

export function iapAvailable(): boolean {
  return Capacitor.isNativePlatform() && !!apiKey();
}

export function iapStoreName(): string {
  return Capacitor.getPlatform() === "ios" ? "App Store" : "Google Play";
}

let configuredFor: string | null = null;
let configuring: Promise<void> | null = null;

/** Configure RevenueCat for the signed-in user. Call after login; no-op on web. */
export async function initIap(userId: string) {
  const key = apiKey();
  if (!Capacitor.isNativePlatform() || !key || configuredFor === userId) return;
  // Reentrancy-guard: AuthContext og en side-mount kan kalde samtidig ved cold
  // start — kun ét configure-kald må løbe ad gangen.
  if (configuring) {
    await configuring;
    if (configuredFor === userId) return;
  }
  configuring = (async () => {
    try {
      if (configuredFor === null) {
        await Purchases.configure({ apiKey: key, appUserID: userId });
      } else {
        await Purchases.logIn({ appUserID: userId });
      }
      configuredFor = userId;
    } catch (e) {
      console.error("[iap] configure failed:", e);
    }
  })();
  await configuring;
  configuring = null;
}

/** Detach purchases from the user at logout. */
export async function clearIap() {
  if (!Capacitor.isNativePlatform() || configuredFor === null) return;
  try {
    await Purchases.logOut();
  } catch {
    // logOut kaster hvis brugeren allerede er anonym — ufarligt.
  }
  configuredFor = null;
}

async function ensureConfigured(): Promise<boolean> {
  if (configuredFor) return true;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  await initIap(user.id);
  return configuredFor !== null;
}

/** Localized store prices ("49,00 kr.") keyed by product id. Empty map on failure. */
export async function getIapPrices(): Promise<Partial<Record<IapProductType, string>>> {
  if (!iapAvailable() || !(await ensureConfigured())) return {};
  try {
    const { products } = await Purchases.getProducts({
      productIdentifiers: IAP_PRODUCT_IDS,
      type: PRODUCT_CATEGORY.NON_SUBSCRIPTION,
    });
    const map: Partial<Record<IapProductType, string>> = {};
    for (const p of products) map[p.identifier as IapProductType] = p.priceString;
    return map;
  } catch (e) {
    console.error("[iap] getProducts failed:", e);
    return {};
  }
}

function isCancelled(e: any): boolean {
  return (
    e?.userCancelled === true ||
    e?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ||
    String(e?.code) === String(PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR)
  );
}

/**
 * Buy a product through the store and activate it server-side.
 * `propertyId` is required for boost- and listing-products.
 */
export async function purchaseIap(
  productType: IapProductType,
  propertyId?: string,
): Promise<IapPurchaseResult> {
  if (!iapAvailable()) {
    return { ok: false, cancelled: false, message: "Køb er ikke tilgængelige i denne version af appen." };
  }
  if (!(await ensureConfigured())) {
    const { data: { user } } = await supabase.auth.getUser();
    return {
      ok: false,
      cancelled: false,
      message: user
        ? "Butikken kunne ikke kontaktes. Prøv igen om lidt."
        : "Du skal være logget ind for at købe.",
    };
  }

  try {
    // Sæt konteksten FØR købet, så webhook-backupvejen ved hvilken annonce
    // købet gælder, selv hvis appen lukkes inden verify-kaldet nedenfor.
    // Nøglen er PRODUKT-SPECIFIK ("pid_<produkt>"): en delt nøgle ville kunne
    // pege på en forkert bolig, hvis en kvittering synces forsinket efter et
    // nyere køb af et andet produkt.
    if (propertyId) {
      await Purchases.setAttributes({ [`pid_${productType}`]: propertyId });
    }

    const { products } = await Purchases.getProducts({
      productIdentifiers: [productType],
      type: PRODUCT_CATEGORY.NON_SUBSCRIPTION,
    });
    const product = products.find((p) => p.identifier === productType) ?? products[0];
    if (!product) {
      return { ok: false, cancelled: false, message: "Produktet blev ikke fundet i butikken. Prøv igen senere." };
    }

    const result = await Purchases.purchaseStoreProduct({ product });
    const transactionId = result?.transaction?.transactionIdentifier;

    // Betalingen ER gennemført i butikken her. Verify-kaldet aktiverer produktet
    // med det samme; fejler det (offline osv.), samler webhooken op kort efter.
    if (transactionId) {
      const { data, error } = await supabase.functions.invoke("verify-native-purchase", {
        body: { product_type: productType, product_id: propertyId, transaction_id: transactionId },
      });
      if (!error && data?.success) return { ok: true };
    }
    return { ok: true, pending: true };
  } catch (e: any) {
    if (isCancelled(e)) return { ok: false, cancelled: true };
    console.error("[iap] purchase failed:", e);
    return { ok: false, cancelled: false, message: e?.message ?? "Købet kunne ikke gennemføres." };
  }
}
