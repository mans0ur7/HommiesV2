import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const PRODUCT_LABELS: Record<string, string> = {
  boost_1day:    "Boost — 24 timer",
  boost_3day:    "Boost — 3 dage",
  boost_7day:    "Boost — 7 dage",
  listing_7day:  "Annonce — 7 dage",
  listing_14day: "Annonce — 14 dage",
  listing_30day: "Annonce — 30 dage",
  search_agent:  "Ekstra søgeagent-plads",
};

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [productType, setProductType] = useState("");

  useEffect(() => {
    const sessionId = params.get("session_id");
    const type = params.get("type") ?? "";
    setProductType(type);

    if (!sessionId) {
      setStatus("error");
      return;
    }

    supabase.functions
      .invoke("verify-payment", { body: { session_id: sessionId } })
      .then(({ data, error }) => {
        if (error || !data?.success) {
          setStatus("error");
        } else {
          setStatus("success");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground">Bekræfter betaling...</h2>
            <p className="text-sm text-muted-foreground mt-2">Vent et øjeblik</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Betaling gennemført!</h2>
            {productType && (
              <p className="text-muted-foreground text-sm mb-1">
                {PRODUCT_LABELS[productType] ?? productType} er aktiveret.
              </p>
            )}
            <p className="text-muted-foreground text-sm mb-8">
              Du modtager en kvittering på din e-mail.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {productType === "search_agent" ? (
                <Button onClick={() => navigate("/search-agents")} variant="default">
                  Opret søgeagent nu
                </Button>
              ) : (
                <Button onClick={() => navigate("/my-listings")} variant="default">
                  Se mine annoncer
                </Button>
              )}
              <Button onClick={() => navigate("/")} variant="outline">
                Gå til forsiden
              </Button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Noget gik galt</h2>
            <p className="text-muted-foreground text-sm mb-8">
              Betalingen kunne ikke bekræftes. Kontakt support hvis du er trukket i penge.
            </p>
            <Button onClick={() => navigate("/payment")} variant="outline">
              Prøv igen
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
