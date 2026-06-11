import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Save, Check, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/navigation/AppLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "@/components/landing/Navbar";
import { downloadContractPdf } from "@/lib/generateContractPdf";

interface ContractData {
  id?: string;
  status: string;
  landlord_id: string;
  tenant_id: string;
  property_id: string;
  // Parter
  landlord_name: string;
  landlord_email: string;
  landlord_phone: string;
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string;
  // Bolig
  property_address: string;
  property_postal_code: string;
  property_city: string;
  effective_date: string; // ISO date string
  // Stilletid & støj
  quiet_hours: string;
  noise_policy: string;
  // Rengøring & køkken
  maintenance_responsibility: string;
  kitchen_rules: string;
  // Gæster & husdyr
  guest_policy: string;
  pets_allowed: boolean;
  pets_description: string;
  smoking_allowed: boolean;
  // Yderligere
  house_rules: string;
}

const empty: Omit<ContractData, "landlord_id" | "tenant_id" | "property_id"> = {
  status: "draft",
  landlord_name: "", landlord_email: "", landlord_phone: "",
  tenant_name: "",   tenant_email: "",   tenant_phone: "",
  property_address: "", property_postal_code: "", property_city: "",
  effective_date: new Date().toISOString().split("T")[0],
  quiet_hours: "22:00–08:00 på hverdage, 23:00–09:00 i weekender og helligdage.",
  noise_policy: "",
  maintenance_responsibility: "",
  kitchen_rules: "",
  guest_policy: "",
  pets_allowed: false, pets_description: "",
  smoking_allowed: false,
  house_rules: "",
};

const STEP_KEYS = [
  { id: 1, key: "contract.stepParties" },
  { id: 2, key: "contract.stepNoise" },
  { id: 3, key: "contract.stepCleaning" },
  { id: 4, key: "contract.stepGuests" },
  { id: 5, key: "contract.stepExtra" },
];

export default function ContractWizard() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const tenantId  = searchParams.get("tenant");
  const propertyId = searchParams.get("property");
  const isMobile = useIsMobile();

  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ContractData | null>(null);

  const isEditing = !!id;

  const set = <K extends keyof ContractData>(k: K, v: ContractData[K]) =>
    setData(d => d ? { ...d, [k]: v } : d);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    if (profile?.user_type !== "landlord") {
      navigate("/documents");
      toast({ title: t("contract.wizardOnlyLandlords"), variant: "destructive" });
      return;
    }
    if (isEditing)           fetchContract();
    else if (tenantId && user) initNew();
    else                     navigate("/documents");
  }, [authLoading, user, profile]);

  const fetchContract = async () => {
    try {
      const { data: row, error } = await supabase
        .from("contracts").select("*").eq("id", id).single();
      if (error) throw error;
      if (row.landlord_id !== user!.id) {
        navigate("/documents");
        toast({ title: t("contract.wizardNoAccess"), variant: "destructive" });
        return;
      }
      setData({
        ...row,
        effective_date: row.effective_date ?? new Date().toISOString().split("T")[0],
        quiet_hours:    row.quiet_hours    ?? empty.quiet_hours,
        noise_policy:   row.noise_policy   ?? "",
        kitchen_rules:  row.kitchen_rules  ?? "",
        guest_policy:   row.guest_policy   ?? "",
      });
    } catch {
      toast({ title: t("contract.fetchFailed"), variant: "destructive" });
      navigate("/documents");
    } finally { setLoading(false); }
  };

  const initNew = async () => {
    try {
      const [{ data: tenant }, { data: landlord }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", tenantId!).single(),
        supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
      ]);

      let property: any = null;
      if (propertyId) {
        const { data: p } = await supabase.from("properties").select("*").eq("id", propertyId).single();
        property = p;
      }

      setData({
        ...empty,
        landlord_id: user!.id,
        tenant_id:   tenantId!,
        property_id: propertyId || "",
        landlord_name:  landlord?.name  || "",
        landlord_email: user!.email     || "",
        landlord_phone: (landlord as any)?.phone || "",
        tenant_name:    tenant?.name    || "",
        tenant_email:   tenant?.email   || "",
        tenant_phone:   (tenant as any)?.phone   || "",
        property_address:     property?.address     || "",
        property_postal_code: property?.postal_code || "",
        property_city:        property?.city        || "",
      });
    } catch {
      toast({ title: t("contract.wizardCreateFailed"), variant: "destructive" });
      navigate("/documents");
    } finally { setLoading(false); }
  };

  const save = async (ready = false) => {
    if (!data || !user) return;
    setSaving(true);
    try {
      const row = {
        landlord_id: data.landlord_id,
        tenant_id:   data.tenant_id,
        property_id: data.property_id || null, // husorden uden bolig er gyldig (property_id er nu nullable)
        status: ready ? "ready" : "draft",
        ready_at: ready ? new Date().toISOString() : null,
        landlord_name:  data.landlord_name,
        landlord_email: data.landlord_email,
        landlord_phone: data.landlord_phone,
        tenant_name:    data.tenant_name,
        tenant_email:   data.tenant_email,
        tenant_phone:   data.tenant_phone,
        property_address:     data.property_address,
        property_postal_code: data.property_postal_code,
        property_city:        data.property_city,
        effective_date:  data.effective_date || null,
        quiet_hours:     data.quiet_hours,
        noise_policy:    data.noise_policy,
        maintenance_responsibility: data.maintenance_responsibility,
        kitchen_rules:   data.kitchen_rules,
        guest_policy:    data.guest_policy,
        pets_allowed:    data.pets_allowed,
        pets_description: data.pets_description,
        smoking_allowed: data.smoking_allowed,
        house_rules:     data.house_rules,
      };

      if (isEditing && data.id) {
        const { error } = await supabase.from("contracts").update(row).eq("id", data.id);
        if (error) throw error;
      } else {
        const { data: created, error } = await supabase.from("contracts").insert(row).select().single();
        if (error) throw error;
        setData(d => d ? { ...d, id: created.id } : d);
        navigate(`/documents/edit/${created.id}`, { replace: true });
      }

      toast({
        title: ready ? t("contract.wizardSentToSign") : t("contract.wizardSavedDraft"),
        description: ready ? t("contract.wizardSentBody") : t("contract.wizardSavedBody"),
      });

      if (ready) navigate("/documents");
    } catch (err: any) {
      toast({ title: t("contract.wizardSaveFailed"), description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleFinish = async () => { await save(true); };

  const canNext = () => {
    if (!data) return false;
    if (step === 1) return data.tenant_name.trim() !== "" && data.property_address.trim() !== "";
    return true;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {!isMobile && <Navbar />}
        <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">

          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/documents")}
              className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {t("contract.wizardDocuments")}
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8 bg-foreground/40" />
              <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">{t("contract.wizardEyebrowNew")}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">
              {t("contract.wizardTitle")}
            </h1>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
            {STEP_KEYS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                <div className={cn(
                  "flex flex-col items-center",
                  i > 0 && "ml-1"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors",
                    step > s.id  ? "bg-foreground border-foreground text-background" :
                    step === s.id ? "border-foreground text-foreground bg-background" :
                                   "border-border text-muted-foreground bg-background"
                  )}>
                    {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                  </div>
                  <span className="text-[11px] mt-1 text-muted-foreground hidden sm:block">{t(s.key)}</span>
                </div>
                {i < STEP_KEYS.length - 1 && (
                  <div className={cn("h-px w-6 md:w-10 flex-shrink-0", step > s.id ? "bg-foreground" : "bg-border")} />
                )}
              </div>
            ))}
          </div>

          <Card className="border-border/60">
            <CardContent className="p-6 md:p-8 space-y-6">

              {/* Step 1: Parter */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium tracking-tight mb-1">{t("contract.step1Heading")}</h2>
                    <p className="text-sm text-muted-foreground">{t("contract.step1Sub")}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-px w-8 bg-foreground/40" />
                      <h3 className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("contract.step1Home")}</h3>
                    </div>
                    <div>
                      <Label>{t("contract.step1AddressLabel")}</Label>
                      <Input className="mt-1" value={data.property_address}
                        onChange={e => set("property_address", e.target.value)}
                        placeholder={t("contract.step1AddressPh")} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>{t("contract.step1Postal")}</Label>
                        <Input className="mt-1" value={data.property_postal_code}
                          onChange={e => set("property_postal_code", e.target.value)}
                          placeholder="2100" maxLength={4} />
                      </div>
                      <div>
                        <Label>{t("contract.step1City")}</Label>
                        <Input className="mt-1" value={data.property_city}
                          onChange={e => set("property_city", e.target.value)}
                          placeholder={t("contract.step1CityPh")} />
                      </div>
                    </div>
                    <div>
                      <Label>{t("contract.step1Valid")}</Label>
                      <Input type="date" className="mt-1" value={data.effective_date}
                        onChange={e => set("effective_date", e.target.value)} />
                    </div>
                  </div>

                  <div className="border-t border-border pt-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-px w-8 bg-foreground/40" />
                      <h3 className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("contract.step1Tenant")}</h3>
                    </div>
                    <div>
                      <Label>{t("contract.step1NameStar")}</Label>
                      <Input className="mt-1" value={data.tenant_name}
                        onChange={e => set("tenant_name", e.target.value)}
                        placeholder={t("contract.step1FullName")} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>{t("contract.step1Email")}</Label>
                        <Input type="email" className="mt-1" value={data.tenant_email}
                          onChange={e => set("tenant_email", e.target.value)}
                          placeholder={t("contract.step1EmailPh")} />
                      </div>
                      <div>
                        <Label>{t("contract.step1Phone")}</Label>
                        <Input type="tel" className="mt-1" value={data.tenant_phone}
                          onChange={e => set("tenant_phone", e.target.value)}
                          placeholder={t("contract.step1PhonePh")} />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-px w-8 bg-foreground/40" />
                      <h3 className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("contract.step1Author")}</h3>
                    </div>
                    <div>
                      <Label>{t("contract.step1Name")}</Label>
                      <Input className="mt-1" value={data.landlord_name}
                        onChange={e => set("landlord_name", e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>{t("contract.step1Email")}</Label>
                        <Input type="email" className="mt-1" value={data.landlord_email}
                          onChange={e => set("landlord_email", e.target.value)} />
                      </div>
                      <div>
                        <Label>{t("contract.step1Phone")}</Label>
                        <Input type="tel" className="mt-1" value={data.landlord_phone}
                          onChange={e => set("landlord_phone", e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Stilletid & Støj */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium tracking-tight mb-1">{t("contract.step2Heading")}</h2>
                    <p className="text-sm text-muted-foreground">{t("contract.step2Sub")}</p>
                  </div>
                  <div>
                    <Label>{t("contract.step2QuietLabel")}</Label>
                    <Textarea className="mt-1" rows={3} value={data.quiet_hours}
                      onChange={e => set("quiet_hours", e.target.value)}
                      placeholder={t("contract.step2QuietPh")} />
                  </div>
                  <div>
                    <Label>{t("contract.step2NoiseLabel")}</Label>
                    <Textarea className="mt-1" rows={4} value={data.noise_policy}
                      onChange={e => set("noise_policy", e.target.value)}
                      placeholder={t("contract.step2NoisePh")} />
                  </div>
                </div>
              )}

              {/* Step 3: Rengøring & Køkken */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium tracking-tight mb-1">{t("contract.step3Heading")}</h2>
                    <p className="text-sm text-muted-foreground">{t("contract.step3Sub")}</p>
                  </div>
                  <div>
                    <Label>{t("contract.step3CleanLabel")}</Label>
                    <Textarea className="mt-1" rows={5} value={data.maintenance_responsibility}
                      onChange={e => set("maintenance_responsibility", e.target.value)}
                      placeholder={t("contract.step3CleanPh")} />
                  </div>
                  <div>
                    <Label>{t("contract.step3KitchenLabel")}</Label>
                    <Textarea className="mt-1" rows={4} value={data.kitchen_rules}
                      onChange={e => set("kitchen_rules", e.target.value)}
                      placeholder={t("contract.step3KitchenPh")} />
                  </div>
                </div>
              )}

              {/* Step 4: Gæster & Husdyr */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium tracking-tight mb-1">{t("contract.step4Heading")}</h2>
                    <p className="text-sm text-muted-foreground">{t("contract.step4Sub")}</p>
                  </div>
                  <div>
                    <Label>{t("contract.step4GuestLabel")}</Label>
                    <Textarea className="mt-1" rows={4} value={data.guest_policy}
                      onChange={e => set("guest_policy", e.target.value)}
                      placeholder={t("contract.step4GuestPh")} />
                  </div>
                  <div className="border-t border-border pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{t("contract.step4PetsTitle")}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("contract.step4PetsSub")}</p>
                      </div>
                      <Switch checked={data.pets_allowed} onCheckedChange={v => set("pets_allowed", v)} />
                    </div>
                    {data.pets_allowed && (
                      <div>
                        <Label>{t("contract.step4PetsLabel")}</Label>
                        <Textarea className="mt-1" rows={2} value={data.pets_description}
                          onChange={e => set("pets_description", e.target.value)}
                          placeholder={t("contract.step4PetsPh")} />
                      </div>
                    )}
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{t("contract.step4SmokeTitle")}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("contract.step4SmokeSub")}</p>
                      </div>
                      <Switch checked={data.smoking_allowed} onCheckedChange={v => set("smoking_allowed", v)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Yderligere regler */}
              {step === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium tracking-tight mb-1">{t("contract.step5Heading")}</h2>
                    <p className="text-sm text-muted-foreground">{t("contract.step5Sub")}</p>
                  </div>
                  <div>
                    <Textarea rows={8} value={data.house_rules}
                      onChange={e => set("house_rules", e.target.value)}
                      placeholder={t("contract.step5Ph")} />
                  </div>

                  {/* Summary */}
                  <div className="rounded-2xl bg-secondary/20 border border-border/60 p-5 space-y-2 text-sm">
                    <p className="font-medium tracking-tight text-foreground mb-3">{t("contract.summary")}</p>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("contract.summaryAddress")}</span><span className="font-medium">{data.property_address || "–"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("contract.summaryTenant")}</span><span className="font-medium">{data.tenant_name || "–"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("contract.summaryValidFrom")}</span><span className="font-medium">{data.effective_date ? format(new Date(data.effective_date), "d. MMM yyyy", { locale: da }) : "–"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("contract.summaryPets")}</span><span className="font-medium">{data.pets_allowed ? t("contract.allowed") : t("contract.notAllowed")}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("contract.summarySmoking")}</span><span className="font-medium">{data.smoking_allowed ? t("contract.allowed") : t("contract.notAllowed")}</span></div>
                  </div>

                  <p
                    className="text-xs text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: t("contract.legalShort") }}
                  />
                </div>
              )}

            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 gap-3">
            <Button variant="outline" onClick={() => step > 1 ? setStep(s => s - 1) : navigate("/documents")}
              className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              {step > 1 ? t("contract.navBack") : t("contract.navCancel")}
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => save(false)} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="ml-1.5 hidden sm:inline">{t("contract.saveDraft")}</span>
              </Button>

              {step < STEP_KEYS.length ? (
                <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="gap-2">
                  {t("contract.next")} <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={saving} className="gap-2 bg-foreground text-background hover:bg-foreground/90">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {t("contract.sendForSig")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
