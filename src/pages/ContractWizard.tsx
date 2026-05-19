import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, Save, Check, Loader2, FileDown } from "lucide-react";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AppLayout from "@/components/navigation/AppLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { downloadContractPdf } from "@/lib/generateContractPdf";

interface ContractData {
  id?: string;
  status: string;
  landlord_id: string;
  tenant_id: string;
  property_id: string;
  // Landlord info
  landlord_name: string;
  landlord_address: string;
  landlord_email: string;
  landlord_phone: string;
  landlord_cvr: string;
  // Tenant info
  tenant_name: string;
  tenant_address: string;
  tenant_email: string;
  tenant_phone: string;
  // Property
  property_address: string;
  property_postal_code: string;
  property_city: string;
  property_type: string;
  property_size_sqm: number | null;
  property_room_count: number | null;
  is_furnished: boolean;
  inventory_list: string;
  // Period
  start_date: Date | null;
  is_time_limited: boolean;
  end_date: Date | null;
  notice_period_months: number;
  // Economy
  monthly_rent: number | null;
  aconto: number;
  deposit: number | null;
  prepaid_rent: number;
  payment_day: number;
  payment_account: string;
  // Rules
  pets_allowed: boolean;
  pets_description: string;
  smoking_allowed: boolean;
  subletting_allowed: boolean;
  maintenance_responsibility: string;
  house_rules: string;
}

const initialContractData: Omit<ContractData, "landlord_id" | "tenant_id" | "property_id"> = {
  status: "draft",
  landlord_name: "",
  landlord_address: "",
  landlord_email: "",
  landlord_phone: "",
  landlord_cvr: "",
  tenant_name: "",
  tenant_address: "",
  tenant_email: "",
  tenant_phone: "",
  property_address: "",
  property_postal_code: "",
  property_city: "",
  property_type: "apartment",
  property_size_sqm: null,
  property_room_count: null,
  is_furnished: false,
  inventory_list: "",
  start_date: null,
  is_time_limited: false,
  end_date: null,
  notice_period_months: 3,
  monthly_rent: null,
  aconto: 0,
  deposit: null,
  prepaid_rent: 0,
  payment_day: 1,
  payment_account: "",
  pets_allowed: false,
  pets_description: "",
  smoking_allowed: false,
  subletting_allowed: false,
  maintenance_responsibility: "",
  house_rules: "",
};

const steps = [
  { id: 1, title: "Parter", description: "Udlejer og lejer information" },
  { id: 2, title: "Lejemål", description: "Boligens detaljer" },
  { id: 3, title: "Periode", description: "Lejeperiode og opsigelse" },
  { id: 4, title: "Økonomi", description: "Leje, depositum og betaling" },
  { id: 5, title: "Regler", description: "Husorden og vilkår" },
];

export default function ContractWizard() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get("tenant");
  const propertyId = searchParams.get("property");
  const isMobile = useIsMobile();
  
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contractData, setContractData] = useState<ContractData | null>(null);

  const isEditing = !!id;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!authLoading && profile?.user_type !== "landlord") {
      navigate("/documents");
      toast({ title: "Kun udlejere kan oprette kontrakter", variant: "destructive" });
      return;
    }

    if (isEditing) {
      fetchContract();
    } else if (tenantId && user) {
      // propertyId is optional - if not provided, user can select one
      initializeNewContract();
    } else {
      navigate("/documents");
    }
  }, [authLoading, user, profile, id, tenantId, propertyId]);

  const fetchContract = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data.landlord_id !== user?.id) {
        navigate("/documents");
        toast({ title: "Du har ikke adgang til denne kontrakt", variant: "destructive" });
        return;
      }

      setContractData({
        ...data,
        start_date: data.start_date ? new Date(data.start_date) : null,
        end_date: data.end_date ? new Date(data.end_date) : null,
      });
    } catch (error) {
      console.error("Error fetching contract:", error);
      toast({ title: "Kunne ikke hente kontrakt", variant: "destructive" });
      navigate("/documents");
    } finally {
      setLoading(false);
    }
  };

  const initializeNewContract = async () => {
    if (!user || !tenantId) return;

    try {
      // Fetch tenant profile
      const { data: tenantProfile, error: tenantError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", tenantId)
        .single();

      if (tenantError) throw tenantError;

      // Get landlord profile
      const { data: landlordProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // If propertyId is provided, fetch property details
      let property = null;
      if (propertyId) {
        const { data: propertyData, error: propertyError } = await supabase
          .from("properties")
          .select("*")
          .eq("id", propertyId)
          .single();

        if (!propertyError) {
          property = propertyData;
        }
      }

      setContractData({
        ...initialContractData,
        landlord_id: user.id,
        tenant_id: tenantId,
        property_id: propertyId || "", // Will be selected later if empty
        // Pre-fill from profiles
        landlord_name: landlordProfile?.name || "",
        landlord_email: user.email || "",
        tenant_name: tenantProfile?.name || "",
        // Pre-fill from property if available
        property_address: property?.address || "",
        property_postal_code: property?.postal_code || "",
        property_city: property?.city || "",
        property_type: property?.property_type || "apartment",
        property_size_sqm: property?.size_sqm || null,
        property_room_count: property?.room_count || null,
        is_furnished: property?.is_furnished || false,
        monthly_rent: property?.monthly_rent || null,
        deposit: property?.deposit || null,
        aconto: property?.aconto || 0,
      });
    } catch (error) {
      console.error("Error initializing contract:", error);
      toast({ title: "Kunne ikke oprette kontrakt", variant: "destructive" });
      navigate("/documents");
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof ContractData>(field: K, value: ContractData[K]) => {
    if (!contractData) return;
    setContractData({ ...contractData, [field]: value });
  };

  const saveContract = async (markAsReady = false) => {
    if (!contractData || !user) return;

    // Validate property_id before saving
    if (!contractData.property_id) {
      toast({ title: "Vælg venligst en bolig først", variant: "destructive" });
      setCurrentStep(2);
      return;
    }

    setSaving(true);
    try {
      const statusValue = markAsReady ? "ready" : "draft";
      const dataToSave = {
        landlord_id: contractData.landlord_id,
        tenant_id: contractData.tenant_id,
        property_id: contractData.property_id,
        status: statusValue as "draft" | "ready",
        ready_at: markAsReady ? new Date().toISOString() : null,
        start_date: contractData.start_date?.toISOString().split("T")[0] || null,
        end_date: contractData.end_date?.toISOString().split("T")[0] || null,
        landlord_name: contractData.landlord_name,
        landlord_address: contractData.landlord_address,
        landlord_email: contractData.landlord_email,
        landlord_phone: contractData.landlord_phone,
        landlord_cvr: contractData.landlord_cvr,
        tenant_name: contractData.tenant_name,
        tenant_address: contractData.tenant_address,
        tenant_email: contractData.tenant_email,
        tenant_phone: contractData.tenant_phone,
        property_address: contractData.property_address,
        property_postal_code: contractData.property_postal_code,
        property_city: contractData.property_city,
        property_type: contractData.property_type,
        property_size_sqm: contractData.property_size_sqm,
        property_room_count: contractData.property_room_count,
        is_furnished: contractData.is_furnished,
        inventory_list: contractData.inventory_list,
        is_time_limited: contractData.is_time_limited,
        notice_period_months: contractData.notice_period_months,
        monthly_rent: contractData.monthly_rent,
        aconto: contractData.aconto,
        deposit: contractData.deposit,
        prepaid_rent: contractData.prepaid_rent,
        payment_day: contractData.payment_day,
        payment_account: contractData.payment_account,
        pets_allowed: contractData.pets_allowed,
        pets_description: contractData.pets_description,
        smoking_allowed: contractData.smoking_allowed,
        subletting_allowed: contractData.subletting_allowed,
        maintenance_responsibility: contractData.maintenance_responsibility,
        house_rules: contractData.house_rules,
      };

      if (isEditing && contractData.id) {
        const { error } = await supabase
          .from("contracts")
          .update(dataToSave)
          .eq("id", contractData.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("contracts")
          .insert(dataToSave)
          .select()
          .single();

        if (error) throw error;
        
        setContractData({ ...contractData, id: data.id });
        // Update URL to editing mode
        navigate(`/documents/edit/${data.id}`, { replace: true });
      }

      toast({ 
        title: markAsReady ? "Kontrakt markeret som klar" : "Kontrakt gemt", 
        description: markAsReady ? "Lejeren kan nu læse kontrakten" : "Dine ændringer er gemt" 
      });

      if (markAsReady) {
        navigate("/documents");
      }
    } catch (error: any) {
      console.error("Error saving contract:", error);
      toast({ title: "Kunne ikke gemme kontrakt", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleFinishContract = async () => {
    if (!contractData) return;
    
    // Save as ready first
    await saveContract(true);
    
    // Generate and download PDF
    await downloadContractPdf(contractData);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!contractData) return null;

  return (
    <AppLayout>
    <div className="min-h-screen bg-background flex flex-col">
      {!isMobile && <Navbar />}
      <div className="flex-1 max-w-3xl mx-auto w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/documents")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditing ? "Rediger lejekontrakt" : "Opret lejekontrakt"}
            </h1>
            <p className="text-muted-foreground">
              Udfyld alle nødvendige oplysninger
            </p>
          </div>
        </div>

        {/* Progress Steps - Mobile optimized */}
        <div className="flex items-center justify-between w-full overflow-hidden">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "flex flex-col items-center flex-shrink-0",
                  currentStep === step.id ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-medium mb-0.5 md:mb-1",
                  currentStep === step.id 
                    ? "bg-primary text-primary-foreground" 
                    : currentStep > step.id 
                      ? "bg-primary/20 text-primary" 
                      : "bg-muted text-muted-foreground"
                )}>
                  {currentStep > step.id ? <Check className="h-3.5 w-3.5 md:h-4 md:w-4" /> : step.id}
                </div>
                <span className="text-[9px] md:text-xs truncate max-w-[50px] md:max-w-none text-center">{step.title}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={cn(
                  "h-0.5 flex-1 mx-1 md:mx-2 min-w-[8px]",
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <PartiesStep contractData={contractData} updateField={updateField} />
            )}
            {currentStep === 2 && (
              <PropertyStep contractData={contractData} updateField={updateField} userId={user!.id} />
            )}
            {currentStep === 3 && (
              <PeriodStep contractData={contractData} updateField={updateField} />
            )}
            {currentStep === 4 && (
              <EconomyStep contractData={contractData} updateField={updateField} />
            )}
            {currentStep === 5 && (
              <RulesStep contractData={contractData} updateField={updateField} />
            )}
          </CardContent>
        </Card>

        {/* Navigation - Mobile optimized */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbage
          </Button>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
            <Button
              variant="outline"
              onClick={() => saveContract(false)}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Gem udkast
            </Button>

            {currentStep < 5 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)} className="w-full sm:w-auto">
                Næste
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleFinishContract} disabled={saving} className="w-full sm:w-auto">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                Færdiggør
              </Button>
            )}
          </div>
        </div>
      </div>
      {!isMobile && <Footer />}
    </div>
    </AppLayout>
  );
}

// Step Components
function PartiesStep({ contractData, updateField }: { 
  contractData: ContractData; 
  updateField: <K extends keyof ContractData>(field: K, value: ContractData[K]) => void;
}) {
  return (
    <div className="grid gap-6">
      <div>
        <h3 className="font-medium mb-4">Udlejer</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="landlord_name">Navn *</Label>
            <Input
              id="landlord_name"
              value={contractData.landlord_name}
              onChange={(e) => updateField("landlord_name", e.target.value)}
              placeholder="Fulde navn"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="landlord_email">E-mail *</Label>
            <Input
              id="landlord_email"
              type="email"
              value={contractData.landlord_email}
              onChange={(e) => updateField("landlord_email", e.target.value)}
              placeholder="email@eksempel.dk"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="landlord_phone">Telefon</Label>
            <Input
              id="landlord_phone"
              value={contractData.landlord_phone}
              onChange={(e) => updateField("landlord_phone", e.target.value)}
              placeholder="+45 12 34 56 78"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="landlord_cvr">CVR (hvis virksomhed)</Label>
            <Input
              id="landlord_cvr"
              value={contractData.landlord_cvr}
              onChange={(e) => updateField("landlord_cvr", e.target.value)}
              placeholder="12345678"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="landlord_address">Adresse</Label>
            <Input
              id="landlord_address"
              value={contractData.landlord_address}
              onChange={(e) => updateField("landlord_address", e.target.value)}
              placeholder="Vej, nummer, postnr, by"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-medium mb-4">Lejer</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tenant_name">Navn *</Label>
            <Input
              id="tenant_name"
              value={contractData.tenant_name}
              onChange={(e) => updateField("tenant_name", e.target.value)}
              placeholder="Fulde navn"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant_email">E-mail *</Label>
            <Input
              id="tenant_email"
              type="email"
              value={contractData.tenant_email}
              onChange={(e) => updateField("tenant_email", e.target.value)}
              placeholder="email@eksempel.dk"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant_phone">Telefon</Label>
            <Input
              id="tenant_phone"
              value={contractData.tenant_phone}
              onChange={(e) => updateField("tenant_phone", e.target.value)}
              placeholder="+45 12 34 56 78"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant_address">Nuværende adresse</Label>
            <Input
              id="tenant_address"
              value={contractData.tenant_address}
              onChange={(e) => updateField("tenant_address", e.target.value)}
              placeholder="Vej, nummer, postnr, by"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertyStep({ contractData, updateField, userId }: { 
  contractData: ContractData; 
  updateField: <K extends keyof ContractData>(field: K, value: ContractData[K]) => void;
  userId: string;
}) {
  const [properties, setProperties] = useState<Array<{id: string; title: string; address: string; city: string; postal_code: string | null; property_type: string | null; size_sqm: number | null; room_count: number | null; is_furnished: boolean | null; monthly_rent: number; deposit: number | null; aconto: number | null}>>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, address, city, postal_code, property_type, size_sqm, room_count, is_furnished, monthly_rent, deposit, aconto")
        .eq("user_id", userId);
      
      if (!error && data) {
        setProperties(data);
      }
      setLoadingProperties(false);
    };
    fetchProperties();
  }, [userId]);

  const handlePropertySelect = (propertyId: string) => {
    const selectedProperty = properties.find(p => p.id === propertyId);
    if (selectedProperty) {
      updateField("property_id", propertyId);
      updateField("property_address", selectedProperty.address);
      updateField("property_postal_code", selectedProperty.postal_code || "");
      updateField("property_city", selectedProperty.city);
      updateField("property_type", selectedProperty.property_type || "apartment");
      updateField("property_size_sqm", selectedProperty.size_sqm);
      updateField("property_room_count", selectedProperty.room_count);
      updateField("is_furnished", selectedProperty.is_furnished || false);
      updateField("monthly_rent", selectedProperty.monthly_rent);
      updateField("deposit", selectedProperty.deposit);
      updateField("aconto", selectedProperty.aconto || 0);
    }
  };

  return (
    <div className="grid gap-4">
      {/* Property selector if no property is selected */}
      {!contractData.property_id && (
        <div className="space-y-2 p-4 bg-muted rounded-lg border-2 border-dashed">
          <Label>Vælg bolig *</Label>
          {loadingProperties ? (
            <Skeleton className="h-10 w-full" />
          ) : properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">Du har ingen boliger oprettet endnu.</p>
          ) : (
            <Select onValueChange={handlePropertySelect}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg en af dine boliger" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title} - {property.address}, {property.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {contractData.property_id && (
        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
          <span className="text-sm text-muted-foreground">
            Valgt bolig: {contractData.property_address}, {contractData.property_city}
          </span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => updateField("property_id", "")}
          >
            Skift bolig
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="property_address">Adresse *</Label>
          <Input
            id="property_address"
            value={contractData.property_address}
            onChange={(e) => updateField("property_address", e.target.value)}
            placeholder="Vejnavn og nummer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="property_postal_code">Postnummer</Label>
          <Input
            id="property_postal_code"
            value={contractData.property_postal_code}
            onChange={(e) => updateField("property_postal_code", e.target.value)}
            placeholder="2100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="property_city">By *</Label>
          <Input
            id="property_city"
            value={contractData.property_city}
            onChange={(e) => updateField("property_city", e.target.value)}
            placeholder="København"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="property_type">Boligtype</Label>
          <Select
            value={contractData.property_type}
            onValueChange={(value) => updateField("property_type", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apartment">Lejlighed</SelectItem>
              <SelectItem value="room">Værelse</SelectItem>
              <SelectItem value="house">Hus</SelectItem>
              <SelectItem value="studio">Studio</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="property_size_sqm">Størrelse (m²)</Label>
          <Input
            id="property_size_sqm"
            type="number"
            value={contractData.property_size_sqm || ""}
            onChange={(e) => updateField("property_size_sqm", e.target.value ? parseInt(e.target.value) : null)}
            placeholder="50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="property_room_count">Antal værelser</Label>
          <Input
            id="property_room_count"
            type="number"
            value={contractData.property_room_count || ""}
            onChange={(e) => updateField("property_room_count", e.target.value ? parseInt(e.target.value) : null)}
            placeholder="2"
          />
        </div>
      </div>

      <div className="flex items-center justify-between py-2">
        <Label htmlFor="is_furnished">Møbleret</Label>
        <Switch
          id="is_furnished"
          checked={contractData.is_furnished}
          onCheckedChange={(checked) => updateField("is_furnished", checked)}
        />
      </div>

      {contractData.is_furnished && (
        <div className="space-y-2">
          <Label htmlFor="inventory_list">Inventarliste</Label>
          <Textarea
            id="inventory_list"
            value={contractData.inventory_list}
            onChange={(e) => updateField("inventory_list", e.target.value)}
            placeholder="Liste over medfølgende møbler og inventar..."
            rows={4}
          />
        </div>
      )}
    </div>
  );
}

function PeriodStep({ contractData, updateField }: { 
  contractData: ContractData; 
  updateField: <K extends keyof ContractData>(field: K, value: ContractData[K]) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label>Startdato *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !contractData.start_date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {contractData.start_date 
                ? format(contractData.start_date, "PPP", { locale: da }) 
                : "Vælg startdato"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={contractData.start_date || undefined}
              onSelect={(date) => updateField("start_date", date || null)}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center justify-between py-2">
        <Label htmlFor="is_time_limited">Tidsbegrænset lejeperiode</Label>
        <Switch
          id="is_time_limited"
          checked={contractData.is_time_limited}
          onCheckedChange={(checked) => updateField("is_time_limited", checked)}
        />
      </div>

      {contractData.is_time_limited && (
        <div className="space-y-2">
          <Label>Slutdato</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !contractData.end_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {contractData.end_date 
                  ? format(contractData.end_date, "PPP", { locale: da }) 
                  : "Vælg slutdato"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={contractData.end_date || undefined}
                onSelect={(date) => updateField("end_date", date || null)}
                disabled={(date) => contractData.start_date ? date < contractData.start_date : false}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notice_period_months">Opsigelsesvarsel (måneder)</Label>
        <Select
          value={contractData.notice_period_months.toString()}
          onValueChange={(value) => updateField("notice_period_months", parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 måned</SelectItem>
            <SelectItem value="2">2 måneder</SelectItem>
            <SelectItem value="3">3 måneder</SelectItem>
            <SelectItem value="6">6 måneder</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function EconomyStep({ contractData, updateField }: { 
  contractData: ContractData; 
  updateField: <K extends keyof ContractData>(field: K, value: ContractData[K]) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="monthly_rent">Månedlig husleje (kr) *</Label>
          <Input
            id="monthly_rent"
            type="number"
            value={contractData.monthly_rent || ""}
            onChange={(e) => updateField("monthly_rent", e.target.value ? parseInt(e.target.value) : null)}
            placeholder="8000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="aconto">Aconto/forbrug (kr)</Label>
          <Input
            id="aconto"
            type="number"
            value={contractData.aconto || ""}
            onChange={(e) => updateField("aconto", parseInt(e.target.value) || 0)}
            placeholder="500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deposit">Depositum (kr) *</Label>
          <Input
            id="deposit"
            type="number"
            value={contractData.deposit || ""}
            onChange={(e) => updateField("deposit", e.target.value ? parseInt(e.target.value) : null)}
            placeholder="24000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prepaid_rent">Forudbetalt leje (kr)</Label>
          <Input
            id="prepaid_rent"
            type="number"
            value={contractData.prepaid_rent || ""}
            onChange={(e) => updateField("prepaid_rent", parseInt(e.target.value) || 0)}
            placeholder="8000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment_day">Betalingsdag</Label>
          <Select
            value={contractData.payment_day.toString()}
            onValueChange={(value) => updateField("payment_day", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1. i måneden</SelectItem>
              <SelectItem value="15">15. i måneden</SelectItem>
              <SelectItem value="28">28. i måneden</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment_account">Kontonummer</Label>
          <Input
            id="payment_account"
            value={contractData.payment_account}
            onChange={(e) => updateField("payment_account", e.target.value)}
            placeholder="Reg.nr + kontonummer"
          />
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 mt-4">
        <h4 className="font-medium mb-2">Samlet ved indflytning</h4>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Første måneds husleje</span>
            <span>{(contractData.monthly_rent || 0).toLocaleString("da-DK")} kr</span>
          </div>
          <div className="flex justify-between">
            <span>Depositum</span>
            <span>{(contractData.deposit || 0).toLocaleString("da-DK")} kr</span>
          </div>
          <div className="flex justify-between">
            <span>Forudbetalt leje</span>
            <span>{contractData.prepaid_rent.toLocaleString("da-DK")} kr</span>
          </div>
          <div className="flex justify-between font-medium pt-2 border-t">
            <span>Total</span>
            <span>
              {((contractData.monthly_rent || 0) + (contractData.deposit || 0) + contractData.prepaid_rent).toLocaleString("da-DK")} kr
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RulesStep({ contractData, updateField }: { 
  contractData: ContractData; 
  updateField: <K extends keyof ContractData>(field: K, value: ContractData[K]) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between py-2">
        <Label htmlFor="pets_allowed">Husdyr tilladt</Label>
        <Switch
          id="pets_allowed"
          checked={contractData.pets_allowed}
          onCheckedChange={(checked) => updateField("pets_allowed", checked)}
        />
      </div>

      {contractData.pets_allowed && (
        <div className="space-y-2">
          <Label htmlFor="pets_description">Beskrivelse af tilladte husdyr</Label>
          <Input
            id="pets_description"
            value={contractData.pets_description}
            onChange={(e) => updateField("pets_description", e.target.value)}
            placeholder="Fx: Kat tilladt, hund op til 10 kg"
          />
        </div>
      )}

      <div className="flex items-center justify-between py-2">
        <Label htmlFor="smoking_allowed">Rygning tilladt</Label>
        <Switch
          id="smoking_allowed"
          checked={contractData.smoking_allowed}
          onCheckedChange={(checked) => updateField("smoking_allowed", checked)}
        />
      </div>

      <div className="flex items-center justify-between py-2">
        <Label htmlFor="subletting_allowed">Fremleje tilladt</Label>
        <Switch
          id="subletting_allowed"
          checked={contractData.subletting_allowed}
          onCheckedChange={(checked) => updateField("subletting_allowed", checked)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="maintenance_responsibility">Vedligeholdelsesansvar</Label>
        <Textarea
          id="maintenance_responsibility"
          value={contractData.maintenance_responsibility}
          onChange={(e) => updateField("maintenance_responsibility", e.target.value)}
          placeholder="Beskriv hvem der er ansvarlig for vedligeholdelse..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="house_rules">Husorden / ekstra vilkår</Label>
        <Textarea
          id="house_rules"
          value={contractData.house_rules}
          onChange={(e) => updateField("house_rules", e.target.value)}
          placeholder="Generelle regler for lejemålet..."
          rows={4}
        />
      </div>
    </div>
  );
}
