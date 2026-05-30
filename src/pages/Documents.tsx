import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Clock, CheckCircle, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AppLayout from "@/components/navigation/AppLayout";
import { useIsMobile } from "@/hooks/use-mobile";
interface Contract {
  id: string;
  status: string;
  property_address: string;
  property_city: string;
  updated_at: string;
  landlord_id: string;
  tenant_id: string;
  landlord_name: string | null;
  tenant_name: string | null;
}

const statusConfig: Record<string, { labelKey: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft:  { labelKey: "documents.statusDraft",  icon: Clock,       variant: "secondary" },
  ready:  { labelKey: "documents.statusReady",  icon: FileText,     variant: "default"   },
  signed: { labelKey: "documents.statusSigned", icon: CheckCircle, variant: "default"   },
};

export default function Documents() {
  const isMobile = useIsMobile();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchContracts();
    }
  }, [user]);

  const fetchContracts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  const isLandlord = profile?.user_type === "landlord";

  const canViewContract = (contract: Contract) => {
    // Landlord can always view their contracts
    if (contract.landlord_id === user?.id) return true;
    // Tenant can only view if status is not 'draft'
    if (contract.tenant_id === user?.id && contract.status !== "draft") return true;
    return false;
  };

  const getStatusInfo = (status: string) => {
    return statusConfig[status] || statusConfig.draft;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <AppLayout>
    <div className="min-h-screen bg-background flex flex-col">
      {!isMobile && <Navbar />}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-12 py-8 md:py-12 space-y-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-1.5 text-foreground/60 hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("documents.back")}
        </Button>

        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-foreground/40" />
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">{t("documents.eyebrow")}</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-[1.05]">
            {t("documents.title")}
          </h1>
          <p className="mt-3 text-sm md:text-base text-foreground/60 max-w-xl">
            {isLandlord ? t("documents.subtitleLandlord") : t("documents.subtitleTenant")}
          </p>
        </div>

        {contracts.length === 0 ? (
          <EmptyState
            icon={FileText}
            tone="secondary"
            variant="card"
            title={t("documents.noneYet")}
            description={isLandlord ? t("documents.noneLandlord") : t("documents.noneTenant")}
          />
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => {
              const statusInfo = getStatusInfo(contract.status);
              const StatusIcon = statusInfo.icon;
              const canView = canViewContract(contract);
              const isUserLandlord = contract.landlord_id === user?.id;

              // For tenants, show that draft exists but can't be opened
              if (!canView && contract.status === "draft") {
                return (
                  <Card key={contract.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {contract.property_address || t("documents.noAddress")}
                            {contract.property_city && `, ${contract.property_city}`}
                          </CardTitle>
                          <CardDescription>
                            {t("documents.authorWorking")}
                          </CardDescription>
                        </div>
                        <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {t(statusInfo.labelKey)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {t("documents.willBeReadable")}
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              if (!canView) return null;

              return (
                <Card
                  key={contract.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => navigate(`/documents/${contract.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {contract.property_address || t("documents.noAddress")}
                          {contract.property_city && `, ${contract.property_city}`}
                        </CardTitle>
                        <CardDescription>
                          {isUserLandlord
                            ? `${t("documents.tenantPrefix")} ${contract.tenant_name || t("documents.notFilled")}`
                            : `${t("documents.authorPrefix")} ${contract.landlord_name || t("documents.notFilled")}`}
                        </CardDescription>
                      </div>
                      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {t(statusInfo.labelKey)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>
                        {t("documents.updated", { date: new Date(contract.updated_at).toLocaleDateString("da-DK") })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      {!isMobile && <Footer />}
    </div>
    </AppLayout>
  );
}
