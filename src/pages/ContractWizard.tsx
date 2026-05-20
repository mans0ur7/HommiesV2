import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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

const STEPS = [
  { id: 1, label: "Parter",     desc: "Hvem bor der?" },
  { id: 2, label: "Støj",       desc: "Stilletid og støj" },
  { id: 3, label: "Rengøring",  desc: "Køkken og rengøring" },
  { id: 4, label: "Gæster",     desc: "Gæster og husdyr" },
  { id: 5, label: "Ekstra",     desc: "Yderligere regler" },
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
      toast({ title: "Kun udlejere kan oprette husordener", variant: "destructive" });
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
        toast({ title: "Ingen adgang", variant: "destructive" });
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
      toast({ title: "Kunne ikke hente husorden", variant: "destructive" });
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
        tenant_name:    tenant?.name    || "",
        tenant_email:   tenant?.email   || "",
        property_address:     property?.address     || "",
        property_postal_code: property?.postal_code || "",
        property_city:        property?.city        || "",
      });
    } catch {
      toast({ title: "Kunne ikke oprette husorden", variant: "destructive" });
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
        property_id: data.property_id || data.landlord_id, // fallback
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
        title: ready ? "Husorden sendt til underskrift" : "Gemt som kladde",
        description: ready ? "Beboeren kan nu læse og underskrive" : "Dine ændringer er gemt",
      });

      if (ready) navigate("/documents");
    } catch (err: any) {
      toast({ title: "Kunne ikke gemme", description: err.message, variant: "destructive" });
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
              <ArrowLeft className="w-4 h-4" /> Dokumenter
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8 bg-foreground/40" />
              <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">Ny husorden</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">
              Husorden og Samboaftale
            </h1>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
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
                  <span className="text-[10px] mt-1 text-muted-foreground hidden sm:block">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
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
                    <h2 className="text-lg font-semibold mb-1">Parterne</h2>
                    <p className="text-sm text-muted-foreground">Hvem bor der, og hvad er adressen?</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Bolig</h3>
                    <div>
                      <Label>Adresse *</Label>
                      <Input className="mt-1" value={data.property_address}
                        onChange={e => set("property_address", e.target.value)}
                        placeholder="Vestergade 12, 2. tv" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Postnummer</Label>
                        <Input className="mt-1" value={data.property_postal_code}
                          onChange={e => set("property_postal_code", e.target.value)}
                          placeholder="2100" maxLength={4} />
                      </div>
                      <div>
                        <Label>By</Label>
                        <Input className="mt-1" value={data.property_city}
                          onChange={e => set("property_city", e.target.value)}
                          placeholder="København Ø" />
                      </div>
                    </div>
                    <div>
                      <Label>Gyldig fra</Label>
                      <Input type="date" className="mt-1" value={data.effective_date}
                        onChange={e => set("effective_date", e.target.value)} />
                    </div>
                  </div>

                  <div className="border-t border-border pt-5 space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Beboer (modtager husorden)</h3>
                    <div>
                      <Label>Navn *</Label>
                      <Input className="mt-1" value={data.tenant_name}
                        onChange={e => set("tenant_name", e.target.value)}
                        placeholder="Fulde navn" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>E-mail</Label>
                        <Input type="email" className="mt-1" value={data.tenant_email}
                          onChange={e => set("tenant_email", e.target.value)}
                          placeholder="navn@email.dk" />
                      </div>
                      <div>
                        <Label>Telefon</Label>
                        <Input type="tel" className="mt-1" value={data.tenant_phone}
                          onChange={e => set("tenant_phone", e.target.value)}
                          placeholder="+45 12 34 56 78" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-5 space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Ophavsmand (dig)</h3>
                    <div>
                      <Label>Navn</Label>
                      <Input className="mt-1" value={data.landlord_name}
                        onChange={e => set("landlord_name", e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>E-mail</Label>
                        <Input type="email" className="mt-1" value={data.landlord_email}
                          onChange={e => set("landlord_email", e.target.value)} />
                      </div>
                      <div>
                        <Label>Telefon</Label>
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
                    <h2 className="text-lg font-semibold mb-1">Stilletid og støj</h2>
                    <p className="text-sm text-muted-foreground">Hvornår skal der være ro, og hvad er reglerne for musik og støj?</p>
                  </div>
                  <div>
                    <Label>Stilletider</Label>
                    <Textarea className="mt-1" rows={3} value={data.quiet_hours}
                      onChange={e => set("quiet_hours", e.target.value)}
                      placeholder="F.eks. 22:00–08:00 på hverdage, 23:00–09:00 i weekender og helligdage." />
                  </div>
                  <div>
                    <Label>Støjregler (musik, fester, TV m.m.)</Label>
                    <Textarea className="mt-1" rows={4} value={data.noise_policy}
                      onChange={e => set("noise_policy", e.target.value)}
                      placeholder="F.eks. Musik og TV holdes på et niveau der ikke generer naboer. Fester aftales på forhånd med de øvrige beboere." />
                  </div>
                </div>
              )}

              {/* Step 3: Rengøring & Køkken */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Rengøring og køkken</h2>
                    <p className="text-sm text-muted-foreground">Fordeling af rengøringsansvar og regler for fælles køkken.</p>
                  </div>
                  <div>
                    <Label>Rengøringsansvar</Label>
                    <Textarea className="mt-1" rows={5} value={data.maintenance_responsibility}
                      onChange={e => set("maintenance_responsibility", e.target.value)}
                      placeholder="F.eks. Fælles arealer rengøres på skift hver uge. Eget værelse er den enkeltes ansvar. Badeværelse rengøres mindst én gang om ugen." />
                  </div>
                  <div>
                    <Label>Køkken- og badeværelsesregler</Label>
                    <Textarea className="mt-1" rows={4} value={data.kitchen_rules}
                      onChange={e => set("kitchen_rules", e.target.value)}
                      placeholder="F.eks. Opvask tages med det samme. Mad i køleskabet mærkes med navn og dato. Badeværelset efterlades rent." />
                  </div>
                </div>
              )}

              {/* Step 4: Gæster & Husdyr */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Gæster, husdyr og rygning</h2>
                    <p className="text-sm text-muted-foreground">Regler for overnatningsgæster, kæledyr og rygning.</p>
                  </div>
                  <div>
                    <Label>Gæstepolitik</Label>
                    <Textarea className="mt-1" rows={4} value={data.guest_policy}
                      onChange={e => set("guest_policy", e.target.value)}
                      placeholder="F.eks. Overnatningsgæster er velkomne i op til 7 nætter pr. måned. Længere ophold aftales med de øvrige beboere. Gæster følger husordenens regler." />
                  </div>
                  <div className="border-t border-border pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Husdyr tilladt</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Kæledyr i lejemålet</p>
                      </div>
                      <Switch checked={data.pets_allowed} onCheckedChange={v => set("pets_allowed", v)} />
                    </div>
                    {data.pets_allowed && (
                      <div>
                        <Label>Hvilke husdyr / betingelser</Label>
                        <Textarea className="mt-1" rows={2} value={data.pets_description}
                          onChange={e => set("pets_description", e.target.value)}
                          placeholder="F.eks. Mindre hunde og katte er tilladt. Aftales med øvrige beboere på forhånd." />
                      </div>
                    )}
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Rygning tilladt indendørs</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Inkl. e-cigaretter og vandpibe</p>
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
                    <h2 className="text-lg font-semibold mb-1">Yderligere regler</h2>
                    <p className="text-sm text-muted-foreground">Tilføj eventuelle andre aftaler eller regler der ikke er dækket ovenfor.</p>
                  </div>
                  <div>
                    <Textarea rows={8} value={data.house_rules}
                      onChange={e => set("house_rules", e.target.value)}
                      placeholder="F.eks. Cykling i opgangen er ikke tilladt. Affald sorteres og sættes ud onsdag aften. Beboere giver hinanden 1 måneds varsel ved fraflytning." />
                  </div>

                  {/* Summary */}
                  <div className="rounded-xl bg-muted/40 border border-border p-5 space-y-2 text-sm">
                    <p className="font-semibold text-foreground mb-3">Opsummering</p>
                    <div className="flex justify-between"><span className="text-muted-foreground">Adresse</span><span className="font-medium">{data.property_address || "–"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Beboer</span><span className="font-medium">{data.tenant_name || "–"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Gyldig fra</span><span className="font-medium">{data.effective_date ? format(new Date(data.effective_date), "d. MMM yyyy", { locale: da }) : "–"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Husdyr</span><span className="font-medium">{data.pets_allowed ? "Tilladt" : "Ikke tilladt"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Rygning</span><span className="font-medium">{data.smoking_allowed ? "Tilladt" : "Ikke tilladt"}</span></div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Når du klikker <strong>Send til underskrift</strong>, kan beboeren åbne dokumentet i appen og underskrive digitalt.
                    Aftalen er juridisk bindende under dansk aftaleloven.
                  </p>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 gap-3">
            <Button variant="outline" onClick={() => step > 1 ? setStep(s => s - 1) : navigate("/documents")}
              className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              {step > 1 ? "Tilbage" : "Annuller"}
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => save(false)} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="ml-1.5 hidden sm:inline">Gem kladde</span>
              </Button>

              {step < STEPS.length ? (
                <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="gap-2">
                  Næste <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={saving} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Send til underskrift
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
