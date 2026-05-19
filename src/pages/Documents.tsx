import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Clock, CheckCircle, AlertCircle, Send, PenTool, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AppLayout from "@/components/navigation/AppLayout";
import { useIsMobile } from "@/hooks/use-mobile";
interface Contract {
  id: string;
  status: string;
  property_address: string;
  property_city: string;
  monthly_rent: number | null;
  start_date: string | null;
  created_at: string;
  updated_at: string;
  landlord_id: string;
  tenant_id: string;
  property_id: string;
  landlord_name: string | null;
  tenant_name: string | null;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Igangværende", icon: Clock, variant: "secondary" },
  ready: { label: "Klar til gennemlæsning", icon: FileText, variant: "default" },
  tenant_confirmed: { label: "Godkendt af lejer", icon: CheckCircle, variant: "default" },
  sent_to_penneo: { label: "Sendt til signering", icon: Send, variant: "default" },
  partially_signed: { label: "Delvist underskrevet", icon: PenTool, variant: "default" },
  signed: { label: "Underskrevet", icon: CheckCircle, variant: "default" },
  signing_failed: { label: "Signering fejlet", icon: AlertCircle, variant: "destructive" },
};

export default function Documents() {
  const isMobile = useIsMobile();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
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
          Tilbage
        </Button>

        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-foreground/40" />
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">Værktøjer</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-[1.05]">
            Dokumenter.
          </h1>
          <p className="mt-3 text-sm md:text-base text-foreground/60 max-w-xl">
            {isLandlord
              ? "Administrer dine lejekontrakter."
              : "Se dine lejekontrakter."}
          </p>
        </div>

        {contracts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Ingen dokumenter endnu
              </h3>
              <p className="text-muted-foreground text-center max-w-sm">
                {isLandlord 
                  ? "Du har ikke oprettet nogen lejekontrakter endnu. Start en kontrakt fra en accepteret anmodning." 
                  : "Der er ingen lejekontrakter tilgængelige for dig endnu."}
              </p>
            </CardContent>
          </Card>
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
                            {contract.property_address || "Adresse ikke udfyldt"}
                            {contract.property_city && `, ${contract.property_city}`}
                          </CardTitle>
                          <CardDescription>
                            Udlejer er ved at udfylde kontrakten
                          </CardDescription>
                        </div>
                        <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Du vil kunne læse kontrakten, når udlejeren har færdiggjort den.
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
                          {contract.property_address || "Adresse ikke udfyldt"}
                          {contract.property_city && `, ${contract.property_city}`}
                        </CardTitle>
                        <CardDescription>
                          {isUserLandlord 
                            ? `Lejer: ${contract.tenant_name || "Ikke udfyldt"}`
                            : `Udlejer: ${contract.landlord_name || "Ikke udfyldt"}`}
                        </CardDescription>
                      </div>
                      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      {contract.monthly_rent && (
                        <span>{contract.monthly_rent.toLocaleString("da-DK")} kr/md</span>
                      )}
                      {contract.start_date && (
                        <span>Fra: {new Date(contract.start_date).toLocaleDateString("da-DK")}</span>
                      )}
                      <span>
                        Opdateret: {new Date(contract.updated_at).toLocaleDateString("da-DK")}
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
