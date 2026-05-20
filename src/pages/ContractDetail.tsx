import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  Edit,
  Download,
  Loader2,
  PenLine,
  Cigarette,
  Dog,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import { downloadContractPdf } from "@/lib/generateContractPdf";
import AppLayout from "@/components/navigation/AppLayout";
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
  // Parter
  landlord_name: string | null;
  landlord_email: string | null;
  landlord_phone: string | null;
  tenant_name: string | null;
  tenant_email: string | null;
  tenant_phone: string | null;
  // Bolig
  property_address: string | null;
  property_postal_code: string | null;
  property_city: string | null;
  effective_date: string | null;
  // Husorden
  quiet_hours: string | null;
  noise_policy: string | null;
  maintenance_responsibility: string | null;
  kitchen_rules: string | null;
  guest_policy: string | null;
  pets_allowed: boolean;
  pets_description: string | null;
  smoking_allowed: boolean;
  house_rules: string | null;
  // Signing — reuses existing columns
  ready_at: string | null;           // = creator signed at
  tenant_confirmed_at: string | null; // = tenant signed at
  // Meta
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  draft:   { label: "Kladde",              icon: Clock,        color: "bg-yellow-500" },
  ready:   { label: "Afventer underskrift", icon: FileText,     color: "bg-blue-500"   },
  signed:  { label: "Underskrevet",         icon: CheckCircle,  color: "bg-green-600"  },
};

export default function ContractDetail() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  const isCreator = contract?.landlord_id === user?.id;
  const isTenant  = contract?.tenant_id  === user?.id;

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) fetchContract();
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

      if (data.tenant_id === user?.id && data.status === "draft") {
        navigate("/documents");
        toast({ title: "Husordenen er ikke klar endnu", variant: "destructive" });
        return;
      }
      setContract(data);
    } catch {
      toast({ title: "Kunne ikke hente husorden", variant: "destructive" });
      navigate("/documents");
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!contract) return;
    setSigning(true);
    try {
      const { error } = await supabase
        .from("contracts")
        .update({
          status: "signed",
          tenant_confirmed_at: new Date().toISOString(),
        })
        .eq("id", contract.id);
      if (error) throw error;
      toast({ title: "Husorden underskrevet", description: "Begge parter har nu underskrevet" });
      fetchContract();
    } catch (err: any) {
      toast({ title: "Kunne ikke underskrive", description: err.message, variant: "destructive" });
    } finally {
      setSigning(false);
    }
  };

  const handleRevertToDraft = async () => {
    if (!contract) return;
    try {
      const { error } = await supabase
        .from("contracts")
        .update({ status: "draft", ready_at: null })
        .eq("id", contract.id);
      if (error) throw error;
      toast({ title: "Husorden åbnet som kladde" });
      navigate(`/documents/edit/${contract.id}`);
    } catch (err: any) {
      toast({ title: "Kunne ikke åbne kladde", description: err.message, variant: "destructive" });
    }
  };

  const handleDownload = async () => {
    if (!contract) return;
    await downloadContractPdf(
      {
        creator_name:  contract.landlord_name  || "",
        creator_email: contract.landlord_email || "",
        creator_phone: contract.landlord_phone || "",
        tenant_name:   contract.tenant_name    || "",
        tenant_email:  contract.tenant_email   || "",
        tenant_phone:  contract.tenant_phone   || "",
        property_address:     contract.property_address     || "",
        property_postal_code: contract.property_postal_code || "",
        property_city:        contract.property_city        || "",
        effective_date: contract.effective_date ? new Date(contract.effective_date) : null,
        quiet_hours:    contract.quiet_hours    || "",
        noise_policy:   contract.noise_policy   || "",
        maintenance_responsibility: contract.maintenance_responsibility || "",
        kitchen_rules:  contract.kitchen_rules  || "",
        guest_policy:   contract.guest_policy   || "",
        pets_allowed:   contract.pets_allowed,
        pets_description: contract.pets_description || "",
        smoking_allowed: contract.smoking_allowed,
        house_rules:    contract.house_rules    || "",
        creator_signed_at: contract.ready_at           ?? null,
        tenant_signed_at:  contract.tenant_confirmed_at ?? null,
      },
      `husorden-${contract.property_address?.replace(/\s+/g, "-") || contract.id}.pdf`
    );
    toast({ title: "PDF downloadet" });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
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
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/documents")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground leading-tight">
                  Husorden og Samboaftale
                </h1>
                <p className="text-sm text-muted-foreground">
                  {contract.property_address}, {contract.property_city}
                </p>
              </div>
            </div>
            <Badge className={`${statusInfo.color} text-white shrink-0`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {isCreator && contract.status === "draft" && (
              <Button size="sm" onClick={() => navigate(`/documents/edit/${contract.id}`)}>
                <Edit className="h-4 w-4 mr-2" />
                Fortsæt redigering
              </Button>
            )}

            {isCreator && contract.status === "ready" && (
              <Button variant="outline" size="sm" onClick={handleRevertToDraft}>
                <Edit className="h-4 w-4 mr-2" />
                Rediger kladde
              </Button>
            )}

            {isTenant && contract.status === "ready" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" disabled={signing} className="bg-green-600 hover:bg-green-700 text-white">
                    {signing
                      ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      : <PenLine className="h-4 w-4 mr-2" />}
                    Underskriv digitalt
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Underskriv husordenen</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ved at underskrive bekræfter du, at du har læst og accepteret husordenen og
                      samboaftalen. Din digitale underskrift er juridisk bindende under dansk
                      aftaleloven (§ 1).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuller</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleSign}
                    >
                      Underskriv
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {/* Signing status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Underskrifter</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Ophavsmand
                </p>
                <p className="font-medium text-sm">{contract.landlord_name || "—"}</p>
                {contract.ready_at ? (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {format(new Date(contract.ready_at), "d. MMM yyyy · HH:mm", { locale: da })}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Ikke underskrevet endnu</p>
                )}
              </div>
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Beboer
                </p>
                <p className="font-medium text-sm">{contract.tenant_name || "—"}</p>
                {contract.tenant_confirmed_at ? (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {format(new Date(contract.tenant_confirmed_at), "d. MMM yyyy · HH:mm", { locale: da })}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {contract.status === "ready" ? "Afventer underskrift" : "Ikke underskrevet endnu"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* § 1 Parter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">§ 1  Parter og bolig</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
                  Ophavsmand
                </p>
                <div className="text-sm space-y-0.5">
                  <p className="font-medium">{contract.landlord_name || "—"}</p>
                  <p className="text-muted-foreground">{contract.landlord_email || "—"}</p>
                  <p className="text-muted-foreground">{contract.landlord_phone || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
                  Beboer
                </p>
                <div className="text-sm space-y-0.5">
                  <p className="font-medium">{contract.tenant_name || "—"}</p>
                  <p className="text-muted-foreground">{contract.tenant_email || "—"}</p>
                  <p className="text-muted-foreground">{contract.tenant_phone || "—"}</p>
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Adresse</p>
                <p className="text-sm font-medium">
                  {contract.property_address}, {contract.property_postal_code} {contract.property_city}
                </p>
                {contract.effective_date && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Gyldig fra:{" "}
                    <span className="font-medium text-foreground">
                      {format(new Date(contract.effective_date), "d. MMMM yyyy", { locale: da })}
                    </span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* § 2 Stilletid & støj */}
          {(contract.quiet_hours || contract.noise_policy) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">§ 2  Stilletid og støj</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {contract.quiet_hours && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Stilletid</p>
                    <p className="whitespace-pre-wrap">{contract.quiet_hours}</p>
                  </div>
                )}
                {contract.noise_policy && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Støjregler</p>
                    <p className="whitespace-pre-wrap">{contract.noise_policy}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* § 3 Rengøring & køkken */}
          {(contract.maintenance_responsibility || contract.kitchen_rules) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">§ 3  Rengøring og køkken</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {contract.maintenance_responsibility && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Rengøringsansvar</p>
                    <p className="whitespace-pre-wrap">{contract.maintenance_responsibility}</p>
                  </div>
                )}
                {contract.kitchen_rules && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Køkkenregler</p>
                    <p className="whitespace-pre-wrap">{contract.kitchen_rules}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* § 4 Gæster, husdyr, rygning */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">§ 4  Gæster, husdyr og rygning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-3">
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                  contract.pets_allowed
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  <Dog className="h-3.5 w-3.5" />
                  Husdyr: {contract.pets_allowed ? "Tilladt" : "Ikke tilladt"}
                </div>
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                  contract.smoking_allowed
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  <Cigarette className="h-3.5 w-3.5" />
                  Rygning: {contract.smoking_allowed ? "Tilladt" : "Ikke tilladt"}
                </div>
              </div>
              {contract.pets_allowed && contract.pets_description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Husdyrbeskrivelse</p>
                  <p>{contract.pets_description}</p>
                </div>
              )}
              {contract.guest_policy && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Gæstepolitik
                  </p>
                  <p className="whitespace-pre-wrap">{contract.guest_policy}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* § 5 Yderligere regler */}
          {contract.house_rules?.trim() && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">§ 5  Yderligere regler</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{contract.house_rules}</p>
              </CardContent>
            </Card>
          )}

          {/* Legal note */}
          <p className="text-xs text-muted-foreground text-center pb-4">
            Denne husorden er juridisk bindende under dansk aftaleloven (§ 1). Digital accept med
            tidsstempel udgør gyldig underskrift.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
