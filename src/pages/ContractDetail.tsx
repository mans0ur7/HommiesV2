import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  PenTool,
  Edit,
  Download,
  Loader2,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import { downloadContractPdf } from "@/lib/generateContractPdf";
import AppLayout from "@/components/navigation/AppLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Contract {
  id: string;
  status: string;
  landlord_id: string;
  tenant_id: string;
  property_id: string;
  landlord_name: string | null;
  landlord_address: string | null;
  landlord_email: string | null;
  landlord_phone: string | null;
  landlord_cvr: string | null;
  tenant_name: string | null;
  tenant_address: string | null;
  tenant_email: string | null;
  tenant_phone: string | null;
  property_address: string | null;
  property_postal_code: string | null;
  property_city: string | null;
  property_type: string | null;
  property_size_sqm: number | null;
  property_room_count: number | null;
  is_furnished: boolean;
  inventory_list: string | null;
  start_date: string | null;
  is_time_limited: boolean;
  end_date: string | null;
  notice_period_months: number;
  monthly_rent: number | null;
  aconto: number;
  deposit: number | null;
  prepaid_rent: number;
  payment_day: number;
  payment_account: string | null;
  pets_allowed: boolean;
  pets_description: string | null;
  smoking_allowed: boolean;
  subletting_allowed: boolean;
  maintenance_responsibility: string | null;
  house_rules: string | null;
  signed_document_url: string | null;
  penneo_signing_url_landlord: string | null;
  penneo_signing_url_tenant: string | null;
  created_at: string;
  updated_at: string;
  ready_at: string | null;
  tenant_confirmed_at: string | null;
  sent_to_penneo_at: string | null;
  signed_at: string | null;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  draft: { label: "Igangværende", icon: Clock, color: "bg-yellow-500" },
  ready: { label: "Klar til gennemlæsning", icon: FileText, color: "bg-blue-500" },
  tenant_confirmed: { label: "Godkendt af lejer", icon: CheckCircle, color: "bg-green-500" },
  sent_to_penneo: { label: "Sendt til signering", icon: Send, color: "bg-purple-500" },
  partially_signed: { label: "Delvist underskrevet", icon: PenTool, color: "bg-purple-500" },
  signed: { label: "Underskrevet", icon: CheckCircle, color: "bg-green-600" },
  signing_failed: { label: "Signering fejlet", icon: AlertCircle, color: "bg-red-500" },
};

const propertyTypeLabels: Record<string, string> = {
  apartment: "Lejlighed",
  room: "Værelse",
  house: "Hus",
  studio: "Studio",
};

export default function ContractDetail() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const isLandlord = contract?.landlord_id === user?.id;
  const isTenant = contract?.tenant_id === user?.id;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchContract();
    }
  }, [user, id]);

  const fetchContract = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Check access - tenant can't view drafts
      if (data.tenant_id === user?.id && data.status === "draft") {
        navigate("/documents");
        toast({ title: "Kontrakten er ikke klar endnu", variant: "destructive" });
        return;
      }

      setContract(data);
    } catch (error) {
      console.error("Error fetching contract:", error);
      toast({ title: "Kunne ikke hente kontrakt", variant: "destructive" });
      navigate("/documents");
    } finally {
      setLoading(false);
    }
  };

  const handleTenantConfirm = async () => {
    if (!contract) return;

    setConfirming(true);
    try {
      const { error } = await supabase
        .from("contracts")
        .update({ 
          status: "tenant_confirmed",
          tenant_confirmed_at: new Date().toISOString()
        })
        .eq("id", contract.id);

      if (error) throw error;

      toast({ title: "Kontrakt godkendt", description: "Kontrakten sendes nu til signering" });
      fetchContract();
    } catch (error: any) {
      console.error("Error confirming contract:", error);
      toast({ title: "Kunne ikke godkende kontrakt", description: error.message, variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  };

  const handleRevertToDraft = async () => {
    if (!contract) return;

    try {
      const { error } = await supabase
        .from("contracts")
        .update({ 
          status: "draft",
          ready_at: null
        })
        .eq("id", contract.id);

      if (error) throw error;

      toast({ title: "Kontrakt åbnet som udkast" });
      navigate(`/documents/edit/${contract.id}`);
    } catch (error: any) {
      console.error("Error reverting contract:", error);
      toast({ title: "Kunne ikke åbne kontrakt", description: error.message, variant: "destructive" });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!contract) return null;

  const statusInfo = statusConfig[contract.status] || statusConfig.draft;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/documents")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Lejekontrakt</h1>
              <p className="text-muted-foreground">
                {contract.property_address}, {contract.property_city}
              </p>
            </div>
          </div>
          <Badge className={`${statusInfo.color} text-white`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>

        {/* Actions and Quick Links */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Actions Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Handlinger</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {isLandlord && contract.status === "ready" && (
                <Button variant="outline" size="sm" onClick={handleRevertToDraft}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rediger udkast
                </Button>
              )}
              
              {isLandlord && contract.status === "draft" && (
                <Button size="sm" onClick={() => navigate(`/documents/edit/${contract.id}`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Fortsæt redigering
                </Button>
              )}

              {isTenant && contract.status === "ready" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" disabled={confirming}>
                      {confirming ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Bekræft indhold
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Bekræft kontraktens indhold</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ved at bekræfte accepterer du, at kontraktens indhold er korrekt og klar til signering. 
                        Kontrakten vil derefter blive sendt til Penneo til juridisk underskrift.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuller</AlertDialogCancel>
                      <AlertDialogAction onClick={handleTenantConfirm}>
                        Bekræft og send til signering
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {contract.status === "signed" && contract.signed_document_url && (
                <Button size="sm" asChild>
                  <a href={contract.signed_document_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download underskrevet
                  </a>
                </Button>
              )}

              {/* Download PDF button - always available */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  await downloadContractPdf({
                    landlord_name: contract.landlord_name || "",
                    landlord_address: contract.landlord_address || "",
                    landlord_email: contract.landlord_email || "",
                    landlord_phone: contract.landlord_phone || "",
                    landlord_cvr: contract.landlord_cvr || "",
                    tenant_name: contract.tenant_name || "",
                    tenant_address: contract.tenant_address || "",
                    tenant_email: contract.tenant_email || "",
                    tenant_phone: contract.tenant_phone || "",
                    property_address: contract.property_address || "",
                    property_postal_code: contract.property_postal_code || "",
                    property_city: contract.property_city || "",
                    property_type: contract.property_type || "",
                    property_size_sqm: contract.property_size_sqm,
                    property_room_count: contract.property_room_count,
                    is_furnished: contract.is_furnished,
                    inventory_list: contract.inventory_list || "",
                    start_date: contract.start_date ? new Date(contract.start_date) : null,
                    is_time_limited: contract.is_time_limited,
                    end_date: contract.end_date ? new Date(contract.end_date) : null,
                    notice_period_months: contract.notice_period_months,
                    monthly_rent: contract.monthly_rent,
                    aconto: contract.aconto,
                    deposit: contract.deposit,
                    prepaid_rent: contract.prepaid_rent,
                    payment_day: contract.payment_day,
                    payment_account: contract.payment_account || "",
                    pets_allowed: contract.pets_allowed,
                    pets_description: contract.pets_description || "",
                    smoking_allowed: contract.smoking_allowed,
                    subletting_allowed: contract.subletting_allowed,
                    maintenance_responsibility: contract.maintenance_responsibility || "",
                    house_rules: contract.house_rules || "",
                  }, `lejekontrakt-${contract.property_address?.replace(/\s/g, "-") || contract.id}.pdf`);
                  toast({ title: "PDF downloadet" });
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download som PDF
              </Button>
            </CardContent>
          </Card>

          {/* Penneo Signing Links Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Digital signering (Penneo)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contract.status === "sent_to_penneo" || contract.status === "partially_signed" ? (
                <>
                  {isLandlord && contract.penneo_signing_url_landlord && (
                    <Button size="sm" className="w-full" asChild>
                      <a href={contract.penneo_signing_url_landlord} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Underskriv som udlejer
                      </a>
                    </Button>
                  )}
                  {isTenant && contract.penneo_signing_url_tenant && (
                    <Button size="sm" className="w-full" asChild>
                      <a href={contract.penneo_signing_url_tenant} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Underskriv som lejer
                      </a>
                    </Button>
                  )}
                  {!contract.penneo_signing_url_landlord && !contract.penneo_signing_url_tenant && (
                    <p className="text-sm text-muted-foreground">
                      Signeringslinks vil blive vist her, når de er tilgængelige.
                    </p>
                  )}
                </>
              ) : contract.status === "signed" ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Kontrakten er underskrevet</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {contract.status === "tenant_confirmed" 
                    ? "Kontrakten afventer at blive sendt til Penneo..."
                    : "Signeringslinks vil blive vist her, når kontrakten er sendt til Penneo."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contract Content */}
        <Card>
          <CardHeader>
            <CardTitle>Parter</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Udlejer</h4>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>{contract.landlord_name || "—"}</p>
                <p>{contract.landlord_email || "—"}</p>
                <p>{contract.landlord_phone || "—"}</p>
                <p>{contract.landlord_address || "—"}</p>
                {contract.landlord_cvr && <p>CVR: {contract.landlord_cvr}</p>}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Lejer</h4>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>{contract.tenant_name || "—"}</p>
                <p>{contract.tenant_email || "—"}</p>
                <p>{contract.tenant_phone || "—"}</p>
                <p>{contract.tenant_address || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lejemålet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Adresse</p>
                <p className="font-medium">
                  {contract.property_address}, {contract.property_postal_code} {contract.property_city}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Boligtype</p>
                <p className="font-medium">
                  {propertyTypeLabels[contract.property_type || ""] || contract.property_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Størrelse</p>
                <p className="font-medium">{contract.property_size_sqm || "—"} m²</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Antal værelser</p>
                <p className="font-medium">{contract.property_room_count || "—"}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Møblering</p>
              <p className="font-medium">{contract.is_furnished ? "Møbleret" : "Umøbleret"}</p>
              {contract.is_furnished && contract.inventory_list && (
                <p className="text-sm text-muted-foreground mt-1">{contract.inventory_list}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lejeperiode</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Startdato</p>
              <p className="font-medium">
                {contract.start_date 
                  ? format(new Date(contract.start_date), "PPP", { locale: da })
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Varighed</p>
              <p className="font-medium">
                {contract.is_time_limited 
                  ? `Tidsbegrænset til ${contract.end_date ? format(new Date(contract.end_date), "PPP", { locale: da }) : "—"}`
                  : "Tidsubegrænset"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Opsigelsesvarsel</p>
              <p className="font-medium">{contract.notice_period_months} måneder</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Økonomi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Månedlig husleje</p>
                <p className="font-medium">{(contract.monthly_rent || 0).toLocaleString("da-DK")} kr</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aconto/forbrug</p>
                <p className="font-medium">{contract.aconto.toLocaleString("da-DK")} kr</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Depositum</p>
                <p className="font-medium">{(contract.deposit || 0).toLocaleString("da-DK")} kr</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Forudbetalt leje</p>
                <p className="font-medium">{contract.prepaid_rent.toLocaleString("da-DK")} kr</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Betalingsdag</p>
                <p className="font-medium">{contract.payment_day}. i måneden</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Konto</p>
                <p className="font-medium">{contract.payment_account || "—"}</p>
              </div>
            </div>

            <Separator />

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Samlet ved indflytning</h4>
              <p className="text-2xl font-bold">
                {((contract.monthly_rent || 0) + (contract.deposit || 0) + contract.prepaid_rent).toLocaleString("da-DK")} kr
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regler og vilkår</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Husdyr</p>
                <p className="font-medium">
                  {contract.pets_allowed ? "Tilladt" : "Ikke tilladt"}
                </p>
                {contract.pets_allowed && contract.pets_description && (
                  <p className="text-sm text-muted-foreground">{contract.pets_description}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rygning</p>
                <p className="font-medium">
                  {contract.smoking_allowed ? "Tilladt" : "Ikke tilladt"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fremleje</p>
                <p className="font-medium">
                  {contract.subletting_allowed ? "Tilladt" : "Ikke tilladt"}
                </p>
              </div>
            </div>

            {contract.maintenance_responsibility && (
              <div>
                <p className="text-sm text-muted-foreground">Vedligeholdelsesansvar</p>
                <p className="font-medium">{contract.maintenance_responsibility}</p>
              </div>
            )}

            {contract.house_rules && (
              <div>
                <p className="text-sm text-muted-foreground">Husorden / ekstra vilkår</p>
                <p className="font-medium whitespace-pre-wrap">{contract.house_rules}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Historik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Oprettet</span>
                <span>{format(new Date(contract.created_at), "PPp", { locale: da })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sidst opdateret</span>
                <span>{format(new Date(contract.updated_at), "PPp", { locale: da })}</span>
              </div>
              {contract.ready_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Markeret klar</span>
                  <span>{format(new Date(contract.ready_at), "PPp", { locale: da })}</span>
                </div>
              )}
              {contract.tenant_confirmed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bekræftet af lejer</span>
                  <span>{format(new Date(contract.tenant_confirmed_at), "PPp", { locale: da })}</span>
                </div>
              )}
              {contract.sent_to_penneo_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sendt til signering</span>
                  <span>{format(new Date(contract.sent_to_penneo_at), "PPp", { locale: da })}</span>
                </div>
              )}
              {contract.signed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Underskrevet</span>
                  <span>{format(new Date(contract.signed_at), "PPp", { locale: da })}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
