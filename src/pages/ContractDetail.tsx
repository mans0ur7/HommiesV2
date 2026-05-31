import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

const statusConfig: Record<string, { labelKey: string; icon: React.ElementType; color: string }> = {
  draft:   { labelKey: "contract.statusDraft",  icon: Clock,       color: "bg-secondary text-secondary-foreground" },
  ready:   { labelKey: "contract.statusReady",  icon: FileText,    color: "bg-secondary text-secondary-foreground" },
  signed:  { labelKey: "contract.statusSigned", icon: CheckCircle, color: "bg-foreground text-background"          },
};

export default function ContractDetail() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

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
        toast({ title: t("contract.notReady"), variant: "destructive" });
        return;
      }
      setContract(data);
    } catch {
      toast({ title: t("contract.fetchFailed"), variant: "destructive" });
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
      toast({ title: t("contract.signedToast"), description: t("contract.signedToastBody") });
      fetchContract();
    } catch (err: any) {
      toast({ title: t("contract.signFailed"), description: err.message, variant: "destructive" });
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
      toast({ title: t("contract.openedDraft") });
      navigate(`/documents/edit/${contract.id}`);
    } catch (err: any) {
      toast({ title: t("contract.openDraftFailed"), description: err.message, variant: "destructive" });
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
    toast({ title: t("contract.pdfDownloaded") });
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
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-px w-8 bg-foreground/40" />
                  <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">
                    {t("contract.title")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {contract.property_address}, {contract.property_city}
                </p>
              </div>
            </div>
            <Badge className={`${statusInfo.color} shrink-0`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {t(statusInfo.labelKey)}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {isCreator && contract.status === "draft" && (
              <Button size="sm" onClick={() => navigate(`/documents/edit/${contract.id}`)}>
                <Edit className="h-4 w-4 mr-2" />
                {t("contract.continueEditing")}
              </Button>
            )}

            {isCreator && contract.status === "ready" && (
              <Button variant="outline" size="sm" onClick={handleRevertToDraft}>
                <Edit className="h-4 w-4 mr-2" />
                {t("contract.editDraft")}
              </Button>
            )}

            {isTenant && contract.status === "ready" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" disabled={signing} className="bg-foreground text-background hover:bg-foreground/90">
                    {signing
                      ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      : <PenLine className="h-4 w-4 mr-2" />}
                    {t("contract.signDigitally")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("contract.signTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("contract.signBody")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("contract.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-foreground text-background hover:bg-foreground/90"
                      onClick={handleSign}
                    >
                      {t("contract.sign")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              {t("contract.downloadPdf")}
            </Button>
          </div>

          {/* Signing status */}
          <Card className="rounded-2xl border border-border/60 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium tracking-tight">{t("contract.signatures")}</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/60 p-3 space-y-1">
                <p className="text-[11px] text-foreground/60 uppercase tracking-[0.18em]">
                  {t("contract.author")}
                </p>
                <p className="font-medium text-sm">{contract.landlord_name || "—"}</p>
                {contract.ready_at ? (
                  <p className="text-xs text-foreground/70 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {format(new Date(contract.ready_at), "d. MMM yyyy · HH:mm", { locale: da })}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("contract.notSignedYet")}</p>
                )}
              </div>
              <div className="rounded-2xl border border-border/60 p-3 space-y-1">
                <p className="text-[11px] text-foreground/60 uppercase tracking-[0.18em]">
                  {t("contract.tenant")}
                </p>
                <p className="font-medium text-sm">{contract.tenant_name || "—"}</p>
                {contract.tenant_confirmed_at ? (
                  <p className="text-xs text-foreground/70 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {format(new Date(contract.tenant_confirmed_at), "d. MMM yyyy · HH:mm", { locale: da })}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {contract.status === "ready" ? t("contract.awaitingSignature") : t("contract.notSignedYet")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* § 1 Parter */}
          <Card className="rounded-2xl border border-border/60 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium tracking-tight">{t("contract.section1")}</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-[11px] text-foreground/60 uppercase tracking-[0.18em] mb-2">
                  {t("contract.author")}
                </p>
                <div className="text-sm space-y-0.5">
                  <p className="font-medium">{contract.landlord_name || "—"}</p>
                  <p className="text-muted-foreground">{contract.landlord_email || "—"}</p>
                  <p className="text-muted-foreground">{contract.landlord_phone || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-foreground/60 uppercase tracking-[0.18em] mb-2">
                  {t("contract.tenant")}
                </p>
                <div className="text-sm space-y-0.5">
                  <p className="font-medium">{contract.tenant_name || "—"}</p>
                  <p className="text-muted-foreground">{contract.tenant_email || "—"}</p>
                  <p className="text-muted-foreground">{contract.tenant_phone || "—"}</p>
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground mb-1">{t("contract.address")}</p>
                <p className="text-sm font-medium">
                  {contract.property_address}, {contract.property_postal_code} {contract.property_city}
                </p>
                {contract.effective_date && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("contract.validFrom")}{" "}
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
            <Card className="rounded-2xl border border-border/60 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium tracking-tight">{t("contract.section2")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {contract.quiet_hours && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{t("contract.quietHours")}</p>
                    <p className="whitespace-pre-wrap">{contract.quiet_hours}</p>
                  </div>
                )}
                {contract.noise_policy && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{t("contract.noisePolicy")}</p>
                    <p className="whitespace-pre-wrap">{contract.noise_policy}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* § 3 Rengøring & køkken */}
          {(contract.maintenance_responsibility || contract.kitchen_rules) && (
            <Card className="rounded-2xl border border-border/60 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium tracking-tight">{t("contract.section3")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {contract.maintenance_responsibility && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{t("contract.cleaningResponsibility")}</p>
                    <p className="whitespace-pre-wrap">{contract.maintenance_responsibility}</p>
                  </div>
                )}
                {contract.kitchen_rules && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{t("contract.kitchenRules")}</p>
                    <p className="whitespace-pre-wrap">{contract.kitchen_rules}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* § 4 Gæster, husdyr, rygning */}
          <Card className="rounded-2xl border border-border/60 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium tracking-tight">{t("contract.section4")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-3">
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                  contract.pets_allowed
                    ? "bg-secondary/20 text-foreground/70 border border-border/60"
                    : "bg-muted text-muted-foreground border border-border/60"
                }`}>
                  <Dog className="h-3.5 w-3.5" />
                  {t("contract.petsLabel")} {contract.pets_allowed ? t("contract.allowed") : t("contract.notAllowed")}
                </div>
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                  contract.smoking_allowed
                    ? "bg-secondary/20 text-foreground/70 border border-border/60"
                    : "bg-muted text-muted-foreground border border-border/60"
                }`}>
                  <Cigarette className="h-3.5 w-3.5" />
                  {t("contract.smokingLabel")} {contract.smoking_allowed ? t("contract.allowed") : t("contract.notAllowed")}
                </div>
              </div>
              {contract.pets_allowed && contract.pets_description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{t("contract.petsDescription")}</p>
                  <p>{contract.pets_description}</p>
                </div>
              )}
              {contract.guest_policy && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {t("contract.guestPolicy")}
                  </p>
                  <p className="whitespace-pre-wrap">{contract.guest_policy}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* § 5 Yderligere regler */}
          {contract.house_rules?.trim() && (
            <Card className="rounded-2xl border border-border/60 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium tracking-tight">{t("contract.section5")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{contract.house_rules}</p>
              </CardContent>
            </Card>
          )}

          {/* Legal note */}
          <p className="text-xs text-muted-foreground text-center pb-4">
            {t("contract.legalNote")}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
