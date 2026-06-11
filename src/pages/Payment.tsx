import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import AppLayout from "@/components/navigation/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Sparkles, Clock, Search, Gift, CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { isNativeApp } from "@/lib/native";
import { getLaunchWindowInfo, LAUNCH_WINDOW_DAYS } from "@/lib/listingPromo";

type ProductType =
  | "boost_1day" | "boost_3day" | "boost_7day"
  | "listing_7day" | "listing_14day" | "listing_30day"
  | "search_agent";

const Payment = () => {
  const { user, loading, profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const native = isNativeApp();
  const isLandlord = profile?.user_type === "landlord";
  const isRoomie = profile?.user_type === "roomie";
  const [purchasing, setPurchasing] = useState<ProductType | null>(null);
  const [landlordProperties, setLandlordProperties] = useState<{ id: string; title: string }[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  // Gratis periode følger det globale launch-vindue (samme kilde som MyListings),
  // ikke den enkelte profils oprettelsesdato.
  const freeTrialInfo = useMemo(() => getLaunchWindowInfo(), []);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !isLandlord) return;
    supabase
      .from("properties")
      .select("id, title")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data?.length) {
          setLandlordProperties(data);
          setSelectedPropertyId(data[0].id);
        }
      });
  }, [user, isLandlord]);

  const handlePurchase = async (productType: ProductType) => {
    if (!user) return;
    // In-app digital purchases are web-only for now (Google Play requires Play
    // Billing for digital goods — handled separately, not via Stripe).
    if (native) return;
    setPurchasing(productType);

    try {
      const needsProperty = productType.startsWith("boost_") || productType.startsWith("listing_");
      const productId = needsProperty ? selectedPropertyId : undefined;

      if (needsProperty && !productId) {
        toast.error("Vælg en annonce først");
        setPurchasing(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { product_type: productType, product_id: productId },
      });

      if (error || !data?.url) throw new Error(error?.message ?? "Ukendt fejl");

      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message ?? "Kunne ikke starte betaling");
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Native app: digital purchases must go through the store's billing, so the
  // Stripe-based purchase UI is web-only. Show an informational notice instead.
  if (native) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background">
          {!isMobile && <Navbar />}
          <div className="max-w-xl mx-auto px-4 py-16 md:py-24">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground mb-8 -ml-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbage
            </button>
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-secondary/20 border border-border/60 flex items-center justify-center mx-auto mb-5">
                <ShieldCheck className="w-6 h-6 text-secondary" />
              </div>
              <h1 className="text-2xl font-display text-foreground mb-2">Premium-opgraderinger ikke tilgængelige</h1>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Du kan stadig oprette din første søgeagent og bruge gratis-perioden direkte i appen.
                Kontakt info@hommies.dk hvis du har spørgsmål.
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {!isMobile && <Navbar />}
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">

          {/* Header */}
          <div className="mb-8 md:mb-12">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground mb-6 -ml-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbage
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px w-8 bg-foreground/40" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">Konto</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display text-foreground leading-[1.05]">
              Betaling og priser.
            </h1>
            <p className="mt-3 text-sm md:text-base text-foreground/60 max-w-xl">
              Sikker betaling med kort eller MobilePay via Stripe.
            </p>
          </div>

          <div className="space-y-6">

            {/* Gratis prøveperiode banner — udlejere */}
            {isLandlord && (
              <Card className={`overflow-hidden ${freeTrialInfo.active ? "border border-border/60 bg-secondary/20" : "border border-border/60"}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${freeTrialInfo.active ? "bg-secondary/20 border border-border/60" : "bg-muted"}`}>
                      {freeTrialInfo.active
                        ? <Gift className="w-5 h-5 text-foreground/70" />
                        : <Clock className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1">
                      {freeTrialInfo.active ? (
                        <>
                          <h3 className="font-medium tracking-tight text-foreground">
                            Launch-tilbud — {freeTrialInfo.daysLeft} dage tilbage
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Under launch-perioden kan du offentliggøre annoncer gratis. Boost og søgeagenter koster stadig det normale.
                          </p>
                          <div className="mt-3 w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-foreground/70 h-2 rounded-full transition-all"
                              style={{ width: `${(freeTrialInfo.daysUsed / LAUNCH_WINDOW_DAYS) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {freeTrialInfo.daysUsed} af {LAUNCH_WINDOW_DAYS} dage brugt
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className="font-medium tracking-tight text-foreground">Gratis periode udløbet</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Køb en annonceperiode nedenfor for at fortsætte med at vise dine annoncer.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vælg annonce (hvis udlejer og har annoncer) */}
            {isLandlord && landlordProperties.length > 0 && (
              <Card className="border border-border/60">
                <CardHeader>
                  <CardTitle className="text-base font-medium tracking-tight">Vælg annonce</CardTitle>
                </CardHeader>
                <CardContent>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  >
                    {landlordProperties.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Boost og annonceperiode aktiveres på den valgte annonce.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Annonceperioder — udlejere */}
            {isLandlord && (
              <Card className="border border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-medium tracking-tight">
                    <Clock className="w-5 h-5 text-secondary" />
                    Annonceperioder
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {freeTrialInfo.active && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/20 border border-border/60 text-sm text-foreground/70">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      Du er i din gratis periode — annoncer er gratis at offentliggøre.
                    </div>
                  )}

                  {[
                    { type: "listing_7day" as ProductType,  label: "7 dage",  sub: "Kort periode",      price: "99 kr" },
                    { type: "listing_14day" as ProductType, label: "14 dage", sub: "Mest populær",      price: "179 kr", popular: true },
                    { type: "listing_30day" as ProductType, label: "30 dage", sub: "Bedste værdi",      price: "299 kr" },
                  ].map((item) => (
                    <div
                      key={item.type}
                      className={`flex items-center justify-between p-4 rounded-xl border ${item.popular ? "border-secondary bg-secondary/20" : "border-border/60 bg-muted/30"}`}
                    >
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.sub}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-medium tracking-tight">{item.price}</span>
                        <Button
                          size="sm"
                          variant={item.popular ? "default" : "outline"}
                          disabled={!!purchasing || freeTrialInfo.active}
                          onClick={() => handlePurchase(item.type)}
                          className="min-w-[80px]"
                        >
                          {purchasing === item.type ? <Loader2 className="w-4 h-4 animate-spin" /> : freeTrialInfo.active ? "Gratis" : "Køb"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Boost — udlejere */}
            {isLandlord && (
              <Card className="border border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-medium tracking-tight">
                    <Sparkles className="w-5 h-5 text-secondary" />
                    Boost din annonce
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Vis din annonce øverst i søgeresultater og i Match-sektionen.
                  </p>
                  {[
                    { type: "boost_1day" as ProductType, label: "24 timer", sub: "Hurtig synlighed",    price: "49 kr" },
                    { type: "boost_3day" as ProductType, label: "3 dage",   sub: "God rækkevidde",     price: "99 kr" },
                    { type: "boost_7day" as ProductType, label: "7 dage",   sub: "Maksimal eksponering", price: "199 kr", popular: true },
                  ].map((item) => (
                    <div
                      key={item.type}
                      className={`flex items-center justify-between p-4 rounded-xl border ${item.popular ? "border-secondary bg-secondary/20" : "border-border/60 bg-muted/30"}`}
                    >
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.sub}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-medium tracking-tight ${item.popular ? "text-foreground" : ""}`}>{item.price}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!!purchasing}
                          onClick={() => handlePurchase(item.type)}
                          className="min-w-[80px]"
                        >
                          {purchasing === item.type ? <Loader2 className="w-4 h-4 animate-spin" /> : "Køb"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Søgeagenter — roomies */}
            {isRoomie && (
              <Card className="border border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-medium tracking-tight">
                    <Search className="w-5 h-5 text-secondary" />
                    Søgeagenter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Søgeagenter holder øje med nye boliger og giver dig besked med det samme.
                  </p>

                  {/* Første gratis */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-secondary/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/20 border border-border/60 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-foreground/70" />
                      </div>
                      <div>
                        <p className="font-medium">Din første søgeagent</p>
                        <p className="text-sm text-muted-foreground">Altid gratis</p>
                      </div>
                    </div>
                    <span className="text-lg font-medium tracking-tight text-foreground/70">Gratis</span>
                  </div>

                  {/* Ekstra plads */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/20 border border-border/60 flex items-center justify-center">
                        <Search className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium">Ekstra søgeagent-plads</p>
                        <p className="text-sm text-muted-foreground">Engangsbetaling — beholder pladsen permanent</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-medium tracking-tight">29 kr</span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!!purchasing}
                        onClick={() => handlePurchase("search_agent")}
                        className="min-w-[80px]"
                      >
                        {purchasing === "search_agent" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Køb"}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground space-y-1.5">
                    <p className="font-medium text-foreground">Sådan virker det:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Din første søgeagent er altid gratis</li>
                      <li>Køb ekstra pladser for 29 kr (engangsbetaling)</li>
                      <li>Sletter du en agent frigives pladsen til en ny</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sikkerhed */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
              <ShieldCheck className="w-4 h-4" />
              <span>Sikker betaling via Stripe · Kort + MobilePay · PCI-certificeret</span>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Payment;
