import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const PRODUCT_LABEL_KEYS: Record<string, string> = {
  boost_1day:    "paymentSuccess.boost1day",
  boost_3day:    "paymentSuccess.boost3day",
  boost_7day:    "paymentSuccess.boost7day",
  listing_7day:  "paymentSuccess.listing7day",
  listing_14day: "paymentSuccess.listing14day",
  listing_30day: "paymentSuccess.listing30day",
  search_agent:  "paymentSuccess.searchAgent",
};

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
            <h2 className="text-xl font-medium tracking-tight text-foreground">{t("paymentSuccess.confirming")}</h2>
            <p className="text-sm text-muted-foreground mt-2">{t("paymentSuccess.waitMoment")}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-secondary/20 border border-border/60 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-foreground" />
            </div>
            <h2 className="text-2xl font-display text-foreground mb-2">{t("paymentSuccess.completed")}</h2>
            {productType && (
              <p className="text-muted-foreground text-sm mb-1">
                {t("paymentSuccess.activated", { product: PRODUCT_LABEL_KEYS[productType] ? t(PRODUCT_LABEL_KEYS[productType]) : productType })}
              </p>
            )}
            <p className="text-muted-foreground text-sm mb-8">
              {t("paymentSuccess.receiptEmail")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {productType === "search_agent" ? (
                <Button onClick={() => navigate("/search-agents")} variant="default">
                  {t("paymentSuccess.createAgent")}
                </Button>
              ) : (
                <Button onClick={() => navigate("/my-listings")} variant="default">
                  {t("paymentSuccess.viewListings")}
                </Button>
              )}
              <Button onClick={() => navigate("/")} variant="outline">
                {t("paymentSuccess.goToHome")}
              </Button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/10 border border-border/60 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-display text-foreground mb-2">{t("paymentSuccess.errorTitle")}</h2>
            <p className="text-muted-foreground text-sm mb-8">
              {t("paymentSuccess.errorBody")}
            </p>
            <Button onClick={() => navigate("/payment")} variant="outline">
              {t("paymentSuccess.tryAgain")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
