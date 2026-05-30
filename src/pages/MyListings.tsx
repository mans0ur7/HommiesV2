import { useEffect, useState, useMemo, lazy, Suspense, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AppLayout from "@/components/navigation/AppLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, Eye, EyeOff, MapPin, Home, Check, ChevronLeft, ChevronRight, X, CreditCard, RefreshCw, Sparkles, Clock, Upload, Image as ImageIcon, AlertCircle, Gift, Loader2 } from "lucide-react";
import { danishCities, getMatchingCities, isValidCity, getProperCityName } from "@/data/danishCities";
import { useDawaAutocomplete } from "@/hooks/useDawaAutocomplete";
import { format, differenceInDays } from "date-fns";
import { da } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { addDays } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import GenderCompositionSelector from "@/components/listings/GenderCompositionSelector";
import { compressImage } from "@/lib/compressImage";
import { checkFields } from "@/lib/contentFilter";
import { isNativeApp } from "@/lib/native";
import { useListingDraft } from "@/hooks/useListingDraft";

const AddressMap = lazy(() => import("@/components/listings/AddressMap"));

interface Property {
  id: string;
  title: string;
  description: string | null;
  address: string;
  city: string;
  postal_code: string | null;
  monthly_rent: number;
  deposit: number | null;
  room_count: number | null;
  bathroom_count: number | null;
  has_kitchen: boolean | null;
  living_area_count: number | null;
  size_sqm: number | null;
  property_type: string | null;
  min_stay: string | null;
  bills_included: boolean | null;
  max_occupants: number | null;
  is_furnished: boolean | null;
  amenities: string[] | null;
  metro_lines: string[] | null;
  s_train_lines: string[] | null;
  bus_lines: string | null;
  available_from: string | null;
  is_published: boolean;
  images: string[];
  created_at: string;
}

interface FormData {
  title: string;
  description: string;
  address: string;
  city: string;
  postal_code: string;
  monthly_rent: string;
  deposit: string;
  aconto: string;
  room_count: string;
  bathroom_count: string;
  has_private_bathroom: boolean;
  has_kitchen: boolean;
  has_private_kitchen: boolean;
  living_area_count: string;
  size_sqm: string;
  property_type: string;
  min_stay: string;
  bills_included: boolean;
  is_furnished: boolean;
  amenities: string[];
  metro_lines: string[];
  s_train_lines: string[];
  bus_lines: string;
  available_from: string;
  gender_composition: string;
  male_count: number;
  female_count: number;
  is_multi_room: boolean;
  available_rooms: number;
}

const initialFormData: FormData = {
  title: "",
  description: "",
  address: "",
  city: "",
  postal_code: "",
  monthly_rent: "",
  deposit: "",
  aconto: "",
  room_count: "1",
  bathroom_count: "1",
  has_private_bathroom: false,
  has_kitchen: true,
  has_private_kitchen: false,
  living_area_count: "0",
  size_sqm: "",
  property_type: "apartment",
  min_stay: "6 months",
  bills_included: false,
  is_furnished: false,
  amenities: [],
  metro_lines: [],
  s_train_lines: [],
  bus_lines: "",
  available_from: "",
  gender_composition: "mixed",
  male_count: 0,
  female_count: 0,
  is_multi_room: false,
  available_rooms: 1,
};

const propertyTypes = [
  { value: "room", label: "Værelse" },
  { value: "shared", label: "Deleværelse" },
  { value: "apartment", label: "Lejlighed (delt)" },
  { value: "studio", label: "Studio" },
];

const minStayOptions = [
  { value: "1 month", label: "1 måned" },
  { value: "3 months", label: "3 måneder" },
  { value: "6 months", label: "6 måneder" },
  { value: "12 months", label: "12 måneder" },
  { value: "unlimited", label: "Ubegrænset" },
];

const amenityOptions = [
  "Parkering",
  "WiFi",
  "Opvaskemaskine",
  "Vaskemaskine",
  "Tørretumbler",
  "Elevator",
  "Altan",
  "Terrasse",
  "Have",
  "Kælder",
  "Aircondition",
  "Husdyr tilladt",
  "Rygning tilladt",
];

const metroOptions = ["M1", "M2", "M3", "M4"];
const sTrainOptions = ["A", "B", "Bx", "C", "E", "F", "H"];

const stepKeys = [
  { id: 1, titleKey: "step1Title", descKey: "step1Desc" },
  { id: 2, titleKey: "step2Title", descKey: "step2Desc" },
  { id: 3, titleKey: "step3Title", descKey: "step3Desc" },
  { id: 4, titleKey: "step4Title", descKey: "step4Desc" },
  { id: 5, titleKey: "step5Title", descKey: "step5Desc" },
  { id: 6, titleKey: "step6Title", descKey: "step6Desc" },
];

const listingPeriods = [
  { days: 7, price: 99, label: "7 dage" },
  { days: 14, price: 179, label: "14 dage", popular: true },
  { days: 30, price: 299, label: "30 dage", bestValue: true },
];

const boostOptions = [
  { days: 1, price: 49, label: "24 timer" },
  { days: 3, price: 99, label: "3 dage" },
  { days: 7, price: 199, label: "7 dage" },
];

// Launch offer configuration
const LAUNCH_OFFER_DISCOUNT = 0.5; // 50% discount
const LAUNCH_OFFER_END_DATE = new Date("2026-02-24"); // 30 days after launch
const isLaunchPeriodActive = () => new Date() < LAUNCH_OFFER_END_DATE;

const FREE_TRIAL_DAYS = 60;

const MyListings = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const native = isNativeApp();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const { clearDraft } = useListingDraft(formData, setFormData, !!editingProperty);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
  const [selectedListingPeriod, setSelectedListingPeriod] = useState<number>(14);
  const [renewDialog, setRenewDialog] = useState<Property | null>(null);
  const [boostDialog, setBoostDialog] = useState<Property | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(14);
  const [boostedProperties, setBoostedProperties] = useState<Record<string, Date>>({});
  const [boostPurchasing, setBoostPurchasing] = useState(false);
  const [renewPurchasing, setRenewPurchasing] = useState(false);
  const [selectedBoost, setSelectedBoost] = useState<number>(1);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [draftListingId, setDraftListingId] = useState<string | null>(null);
  const [loadingExistingImages, setLoadingExistingImages] = useState(false);
  const [floorPlanUrl, setFloorPlanUrl] = useState<string | null>(null);
  const [uploadingFloorPlan, setUploadingFloorPlan] = useState(false);
  const [hasExistingListings, setHasExistingListings] = useState<boolean | null>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const { results: dawaResults, loading: dawaLoading } = useDawaAutocomplete(addressQuery, showAddressSuggestions);

  // Check if launch offer is available for this landlord
  const isLaunchOfferEligible = useMemo(() => {
    // Launch offer only applies to the first listing creation (not editing)
    // and only during the launch period
    if (!isLaunchPeriodActive()) return false;
    if (editingProperty) return false; // Not available when editing
    if (hasExistingListings === null) return false; // Still loading
    return !hasExistingListings; // Only eligible if no existing listings
  }, [editingProperty, hasExistingListings]);

  const freeTrialInfo = useMemo(() => {
    if (!profile?.created_at) return { active: false, daysLeft: 0, daysUsed: 0 };
    const created = new Date(profile.created_at);
    const daysUsed = differenceInDays(new Date(), created);
    const daysLeft = Math.max(0, FREE_TRIAL_DAYS - daysUsed);
    return { active: daysLeft > 0, daysLeft, daysUsed };
  }, [profile?.created_at]);

  // Calculate discounted price for listing (always round down to be fair to customers)
  const getListingPrice = (originalPrice: number, applyDiscount: boolean) => {
    if (applyDiscount && isLaunchOfferEligible) {
      return Math.floor(originalPrice * (1 - LAUNCH_OFFER_DISCOUNT));
    }
    return originalPrice;
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && profile?.user_type !== "landlord") {
      navigate("/");
      toast({
        title: t("myListings.noAccess"),
        description: t("myListings.noAccessBody"),
        variant: "destructive",
      });
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
      // Track if user has existing listings for launch offer eligibility
      setHasExistingListings((data || []).length > 0);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast({
        title: t("myListings.error"),
        description: t("myListings.fetchFailed"),
        variant: "destructive",
      });
    } finally {
      setLoadingProperties(false);
    }
  };

  const openCreateForm = () => {
    setEditingProperty(null);
    setDraftListingId(crypto.randomUUID());
    setUploadedImages([]);
    setFloorPlanUrl(null);
    setFormData(initialFormData);
    setCurrentStep(1);
    setAddressQuery("");
    setSelectedCoords(null);
    setAddressConfirmed(false);
    setShowForm(true);
  };

  const openEditForm = async (property: Property) => {
    // First unpublish the property
    await supabase
      .from("properties")
      .update({ is_published: false })
      .eq("id", property.id);

    setEditingProperty(property);
    setDraftListingId(property.id);
    setFormData({
      title: property.title || "",
      description: property.description || "",
      address: property.address || "",
      city: property.city || "",
      postal_code: property.postal_code || "",
      monthly_rent: property.monthly_rent?.toString() || "",
      deposit: property.deposit?.toString() || "",
      aconto: (property as any).aconto?.toString() || "",
      room_count: property.room_count?.toString() || "1",
      bathroom_count: property.bathroom_count?.toString() || "1",
      has_private_bathroom: (property as any).has_private_bathroom ?? false,
      has_kitchen: property.has_kitchen ?? true,
      has_private_kitchen: (property as any).has_private_kitchen ?? false,
      living_area_count: property.living_area_count?.toString() || "0",
      size_sqm: property.size_sqm?.toString() || "",
      property_type: property.property_type || "apartment",
      min_stay: property.min_stay || "6 months",
      bills_included: property.bills_included ?? false,
      is_furnished: property.is_furnished ?? false,
      amenities: property.amenities || [],
      metro_lines: property.metro_lines || [],
      s_train_lines: property.s_train_lines || [],
      bus_lines: property.bus_lines || "",
      available_from: property.available_from || "",
      gender_composition: (property as any).gender_composition || "mixed",
      male_count: (property as any).male_count || 0,
      female_count: (property as any).female_count || 0,
      is_multi_room: (property as any).is_multi_room || false,
      available_rooms: (property as any).available_rooms || 1,
    });
    setUploadedImages(property.images || []);
    setFloorPlanUrl((property as any).floor_plan_url || null);
    setCurrentStep(1);
    setAddressQuery(property.address ? `${property.address}, ${property.city}` : "");
    const existingLat = (property as any).latitude;
    const existingLon = (property as any).longitude;
    setSelectedCoords(existingLat && existingLon ? { lat: existingLat, lon: existingLon } : null);
    setAddressConfirmed(true); // existing address counts as confirmed
    setShowForm(true);
    fetchProperties();

    toast({
      title: t("myListings.hiddenWhileEditing"),
      description: t("myListings.hiddenWhileEditingBody"),
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProperty(null);
    setFormData(initialFormData);
    setCurrentStep(1);
    setUploadedImages([]);
    setFloorPlanUrl(null);
    setDraftListingId(null);
    setAddressQuery("");
    setSelectedCoords(null);
    setAddressConfirmed(false);
  };

  const handleSubmit = async () => {
    try {
      const filterResult = checkFields({
        title: formData.title,
        description: formData.description,
        address: formData.address,
      });
      if (!filterResult.ok) {
        toast({
          variant: "destructive",
          title: t("contentFilter.title"),
          description: t(`contentFilter.${filterResult.reason}`),
        });
        return;
      }

      const propertyData = {
        user_id: user?.id,
        title: formData.title,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        monthly_rent: parseInt(formData.monthly_rent),
        deposit: formData.deposit ? parseInt(formData.deposit) : 0,
        aconto: formData.aconto ? parseInt(formData.aconto) : 0,
        room_count: parseInt(formData.room_count),
        bathroom_count: parseInt(formData.bathroom_count),
        has_private_bathroom: formData.has_private_bathroom,
        has_kitchen: formData.has_kitchen,
        has_private_kitchen: formData.has_private_kitchen,
        living_area_count: parseInt(formData.living_area_count),
        size_sqm: formData.size_sqm ? parseInt(formData.size_sqm) : null,
        property_type: formData.property_type,
        min_stay: formData.min_stay,
        bills_included: formData.bills_included,
        is_furnished: formData.is_furnished,
        amenities: formData.amenities,
        metro_lines: formData.metro_lines,
        s_train_lines: formData.s_train_lines,
        bus_lines: formData.bus_lines,
        available_from: formData.available_from || null,
        images: uploadedImages,
        gender_composition: formData.gender_composition,
        male_count: formData.male_count,
        female_count: formData.female_count,
        floor_plan_url: floorPlanUrl,
        is_multi_room: formData.is_multi_room,
        available_rooms: formData.available_rooms,
        latitude:  selectedCoords?.lat  ?? null,
        longitude: selectedCoords?.lon  ?? null,
      };

      if (editingProperty) {
        const { error } = await supabase
          .from("properties")
          .update(propertyData)
          .eq("id", editingProperty.id);

        if (error) throw error;

        toast({
          title: t("myListings.updated"),
          description: t("myListings.updatedBody"),
        });
      } else {
        const { error } = await supabase.from("properties").insert(propertyData);

        if (error) throw error;

        toast({
          title: t("myListings.created"),
          description: t("myListings.createdBody"),
        });
      }

      clearDraft();
      closeForm();
      fetchProperties();
    } catch (error) {
      console.error("Error saving property:", error);
      toast({
        title: t("myListings.error"),
        description: t("myListings.saveFailed"),
        variant: "destructive",
      });
    }
  };

  const togglePublish = async (propertyId: string, currentStatus: boolean) => {
    try {
      // Publishing (not hiding) outside the free trial requires a valid paid
      // period — otherwise route to payment instead of publishing for free.
      if (!currentStatus && !freeTrialInfo.active) {
        const property = properties.find((p) => p.id === propertyId);
        const expiresAt = (property as any)?.expires_at;
        const hasValidPeriod = expiresAt && new Date(expiresAt) > new Date();
        if (!hasValidPeriod) {
          if (property) setRenewDialog(property);
          return;
        }
      }

      const updateData: Record<string, any> = { is_published: !currentStatus };
      if (!currentStatus) {
        updateData.status = "active";
        if (freeTrialInfo.active) {
          updateData.expires_at = addDays(new Date(), 30).toISOString();
          updateData.listing_period = 30;
        }
      }

      const { error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", propertyId);

      if (error) throw error;

      toast({
        title: currentStatus ? t("myListings.hiddenToast") : t("myListings.publishedToast"),
        description: currentStatus
          ? t("myListings.hiddenBody")
          : freeTrialInfo.active
            ? t("myListings.publishedBodyTrial")
            : t("myListings.publishedBody"),
      });

      fetchProperties();
    } catch (error) {
      console.error("Error toggling publish:", error);
      toast({
        title: t("myListings.error"),
        description: t("myListings.statusFailed"),
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (propertyId: string) => {
    setPropertyToDelete(propertyId);
    setDeleteDialogOpen(true);
  };

  const deleteProperty = async () => {
    if (!propertyToDelete) return;

    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyToDelete);

      if (error) throw error;

      toast({
        title: t("myListings.deletedToast"),
        description: t("myListings.deletedBody"),
      });

      fetchProperties();
    } catch (error) {
      console.error("Error deleting property:", error);
      toast({
        title: t("myListings.error"),
        description: t("myListings.deleteFailed"),
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const toggleMetro = (line: string) => {
    setFormData(prev => ({
      ...prev,
      metro_lines: prev.metro_lines.includes(line)
        ? prev.metro_lines.filter(l => l !== line)
        : [...prev.metro_lines, line]
    }));
  };

  const toggleSTrain = (line: string) => {
    setFormData(prev => ({
      ...prev,
      s_train_lines: prev.s_train_lines.includes(line)
        ? prev.s_train_lines.filter(l => l !== line)
        : [...prev.s_train_lines, line]
    }));
  };

const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const persistImagesToProperty = async (images: string[]) => {
    if (!editingProperty) return;
    const { error } = await supabase
      .from("properties")
      .update({ images })
      .eq("id", editingProperty.id);

    if (error) {
      console.error("Error saving images to property:", error);
      toast({
        title: t("myListings.error"),
        description: t("myListings.savingImagesFailed"),
        variant: "destructive",
      });
    }
  };

  const loadImagesFromStorage = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("property-images")
      .list(path, { limit: 100, offset: 0, sortBy: { column: "created_at", order: "desc" } });

    if (error) throw error;

    const urls = (data || [])
      .filter((item) => item.name && !item.name.endsWith("/"))
      .map((item) => {
        const fullPath = `${path}/${item.name}`;
        const {
          data: { publicUrl },
        } = supabase.storage.from("property-images").getPublicUrl(fullPath);
        return publicUrl;
      });

    return urls;
  };

  const syncExistingImages = async () => {
    if (!user?.id) return;

    setLoadingExistingImages(true);
    try {
      // Preferred: userId/listingId
      if (draftListingId) {
        const scoped = await loadImagesFromStorage(`${user.id}/${draftListingId}`);
        if (scoped.length > 0) {
          setUploadedImages(scoped);
          await persistImagesToProperty(scoped);
          return;
        }
      }

      // Fallback (legacy uploads): userId root
      const legacy = await loadImagesFromStorage(user.id);
      if (legacy.length > 0) {
        setUploadedImages(legacy);
        await persistImagesToProperty(legacy);
      } else {
        toast({
          title: t("myListings.noImagesFound"),
          description: t("myListings.noImagesBody"),
        });
      }
    } catch (e) {
      console.error("Error syncing existing images:", e);
      toast({
        title: t("myListings.error"),
        description: t("myListings.loadUploadsFailed"),
        variant: "destructive",
      });
    } finally {
      setLoadingExistingImages(false);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!user?.id) {
      toast({
        title: t("myListings.error"),
        description: t("myListings.loginToUpload"),
        variant: "destructive",
      });
      return;
    }

    setUploadingImages(true);
    const newImageUrls: string[] = [];

    try {
      const listingFolder = draftListingId ?? "temp";

      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i]);
        const fileName = `${user.id}/${listingFolder}/${Date.now()}-${i}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(fileName, compressed, { contentType: "image/jpeg" });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("property-images").getPublicUrl(fileName);

        newImageUrls.push(publicUrl);
      }

      setUploadedImages((prev) => {
        const next = [...prev, ...newImageUrls];
        void persistImagesToProperty(next);
        return next;
      });

      toast({
        title: t("myListings.imagesUploaded"),
        description: files.length === 1 ? t("myListings.imagesAddedOne") : t("myListings.imagesAddedMany", { count: files.length }),
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: t("myListings.uploadFailed"),
        description: t("myListings.uploadFailedBody"),
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      void persistImagesToProperty(next);
      return next;
    });
  };

  const handleFloorPlanUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user?.id) {
      toast({
        title: t("myListings.error"),
        description: t("myListings.loginToUploadPlan"),
        variant: "destructive",
      });
      return;
    }

    setUploadingFloorPlan(true);

    try {
      const listingFolder = draftListingId ?? editingProperty?.id ?? "temp";
      const compressed = await compressImage(file, 2000, 2000, 0.85); // lidt større til plantegninger
      const fileName = `${user.id}/${listingFolder}/floor-plan-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(fileName, compressed, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("property-images").getPublicUrl(fileName);

      setFloorPlanUrl(publicUrl);

      // Persist to property if editing
      if (editingProperty) {
        await supabase
          .from("properties")
          .update({ floor_plan_url: publicUrl })
          .eq("id", editingProperty.id);
      }

      toast({
        title: t("myListings.floorPlanUploaded"),
        description: t("myListings.floorPlanAdded"),
      });
    } catch (error) {
      console.error("Error uploading floor plan:", error);
      toast({
        title: t("myListings.uploadFailed"),
        description: t("myListings.floorPlanUploadFailed"),
        variant: "destructive",
      });
    } finally {
      setUploadingFloorPlan(false);
    }
  };

  const removeFloorPlan = async () => {
    setFloorPlanUrl(null);
    if (editingProperty) {
      await supabase
        .from("properties")
        .update({ floor_plan_url: null })
        .eq("id", editingProperty.id);
    }
    toast({
      title: t("myListings.floorPlanRemoved"),
      description: t("myListings.floorPlanRemovedBody"),
    });
  };

  // Validation states for step 2
  const isValidPostalCode = /^\d{4}$/.test(formData.postal_code);
  const cityValid = isValidCity(formData.city);
  const citySuggestions = useMemo(() => getMatchingCities(formData.city), [formData.city]);
  const addressValid = formData.address.trim().length >= 3;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim() !== "";
      case 2:
        return addressConfirmed && addressValid && cityValid && isValidPostalCode;
      case 3:
        return formData.size_sqm.trim() !== "";
      case 4:
        return formData.monthly_rent !== "" && formData.deposit !== "" && formData.available_from !== "";
      case 5:
        return uploadedImages.length > 0;
      case 6:
        return selectedListingPeriod > 0;
      default:
        return true;
    }
  };

  const handleRenewListing = async () => {
    if (!renewDialog) return;
    if (native) {
      toast({ title: t("myListings.webOnly"), description: t("myListings.renewWebOnly") });
      return;
    }
    setRenewPurchasing(true);
    try {
      const productType = `listing_${selectedPeriod}day` as const;
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { product_type: productType, product_id: renewDialog.id },
      });
      if (error || !data?.url) throw new Error(error?.message ?? t("myListings.unknownError"));
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: t("myListings.error"), description: err.message ?? t("myListings.paymentStartFailed"), variant: "destructive" });
      setRenewPurchasing(false);
    }
  };

  const handleBoostListing = async () => {
    if (!boostDialog) return;
    if (native) {
      toast({ title: t("myListings.webOnly"), description: t("myListings.boostWebOnly") });
      return;
    }
    setBoostPurchasing(true);
    try {
      const productType = `boost_${selectedBoost}day` as const;
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { product_type: productType, product_id: boostDialog.id },
      });
      if (error || !data?.url) throw new Error(error?.message ?? t("myListings.unknownError"));
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: t("myListings.error"), description: err.message ?? t("myListings.paymentStartFailed"), variant: "destructive" });
      setBoostPurchasing(false);
    }
  };

  const isPropertyBoosted = (propertyId: string) => {
    // Check from database field first
    const property = properties.find(p => p.id === propertyId);
    if (property && (property as any).boost_expires_at) {
      return new Date() < new Date((property as any).boost_expires_at);
    }
    // Fallback to local state
    const boostExpiry = boostedProperties[propertyId];
    if (!boostExpiry) return false;
    return new Date() < boostExpiry;
  };

  const getBoostDaysLeft = (propertyId: string): string | null => {
    // Only return days if boost is still active
    if (!isPropertyBoosted(propertyId)) return null;
    
    const property = properties.find(p => p.id === propertyId);
    if (property && (property as any).boost_expires_at) {
      const daysLeft = differenceInDays(new Date((property as any).boost_expires_at), new Date());
      if (daysLeft <= 0) return t("myListings.lessThanDay");
      return daysLeft === 1 ? t("myListings.oneDay") : t("myListings.manyDays", { count: daysLeft });
    }
    const boostExpiry = boostedProperties[propertyId];
    if (!boostExpiry) return null;
    const daysLeft = differenceInDays(boostExpiry, new Date());
    if (daysLeft <= 0) return t("myListings.lessThanDay");
    return daysLeft === 1 ? t("myListings.oneDay") : t("myListings.manyDays", { count: daysLeft });
  };

  const getStatusBadge = (property: Property) => {
    const status = (property as any).status || "draft";
    const expiresAt = (property as any).expires_at;
    
    if (status === "active" && expiresAt) {
      const daysLeft = differenceInDays(new Date(expiresAt), new Date());
      if (daysLeft <= 0) {
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-destructive text-destructive-foreground shadow-md backdrop-blur-sm">{t("myListings.expired")}</span>;
      }
      if (daysLeft <= 3) {
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white shadow-md backdrop-blur-sm">{t("myListings.expiringSoon", { days: daysLeft })}</span>;
      }
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white shadow-md backdrop-blur-sm">{t("myListings.active", { days: daysLeft })}</span>;
    }

    switch (status) {
      case "draft":
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground shadow-md backdrop-blur-sm">{t("myListings.draft")}</span>;
      case "pending_payment":
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white shadow-md backdrop-blur-sm">{t("myListings.pendingPayment")}</span>;
      case "expired":
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-destructive text-destructive-foreground shadow-md backdrop-blur-sm">{t("myListings.expired")}</span>;
      default:
        return null;
    }
  };

  const handlePaymentAndSubmit = async () => {
    try {
      const isFreeTrialListing = freeTrialInfo.active && !editingProperty;

      const period = isFreeTrialListing
        ? { days: 30, price: 0, label: t("myListings.manyDays", { count: 30 }) }
        : listingPeriods.find(p => p.days === selectedListingPeriod);
      if (!period) return;

      const expiresAt = addDays(new Date(), period.days);

      const propertyData = {
        user_id: user?.id,
        title: formData.title,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        monthly_rent: parseInt(formData.monthly_rent),
        deposit: formData.deposit ? parseInt(formData.deposit) : 0,
        aconto: formData.aconto ? parseInt(formData.aconto) : 0,
        room_count: parseInt(formData.room_count),
        bathroom_count: parseInt(formData.bathroom_count),
        has_private_bathroom: formData.has_private_bathroom,
        has_kitchen: formData.has_kitchen,
        has_private_kitchen: formData.has_private_kitchen,
        living_area_count: parseInt(formData.living_area_count),
        size_sqm: formData.size_sqm ? parseInt(formData.size_sqm) : null,
        property_type: formData.property_type,
        min_stay: formData.min_stay,
        bills_included: formData.bills_included,
        is_furnished: formData.is_furnished,
        amenities: formData.amenities,
        metro_lines: formData.metro_lines,
        s_train_lines: formData.s_train_lines,
        bus_lines: formData.bus_lines,
        available_from: formData.available_from || null,
        images: uploadedImages,
        status: "active",
        is_published: true,
        expires_at: expiresAt.toISOString(),
        listing_period: selectedListingPeriod,
        gender_composition: formData.gender_composition,
        male_count: formData.male_count,
        female_count: formData.female_count,
        is_multi_room: formData.is_multi_room,
        available_rooms: formData.available_rooms,
        floor_plan_url: floorPlanUrl,
        latitude:  selectedCoords?.lat  ?? null,
        longitude: selectedCoords?.lon  ?? null,
      };

      if (editingProperty) {
        const { error } = await supabase
          .from("properties")
          .update(propertyData)
          .eq("id", editingProperty.id);

        if (error) throw error;

        toast({
          title: t("myListings.updatedAndActivated"),
          description: t("myListings.activeForDays", { days: selectedListingPeriod }),
        });
        closeForm();
        fetchProperties();
        return;
      }

      if (isFreeTrialListing) {
        const { error } = await supabase.from("properties").insert(propertyData);
        if (error) throw error;

        setHasExistingListings(true);
        toast({
          title: t("myListings.created"),
          description: t("myListings.createdFreeBody"),
        });
        closeForm();
        fetchProperties();
        return;
      }

      // Paid new listing — web only (Google Play requires its own billing for
      // digital goods, so Stripe purchases are disabled in the native app).
      if (native) {
        toast({ title: t("myListings.webOnly"), description: t("myListings.purchaseWebOnly") });
        return;
      }

      // Paid new listing — save as an unpublished draft, then send to Stripe.
      // verify-payment / stripe-webhook publishes it once payment succeeds.
      const { data: inserted, error: insertErr } = await supabase
        .from("properties")
        .insert({ ...propertyData, status: "pending_payment", is_published: false, expires_at: null })
        .select("id")
        .single();
      if (insertErr || !inserted) throw insertErr ?? new Error(t("myListings.createListingFailed"));

      const productType = `listing_${selectedListingPeriod}day`;
      const { data: checkout, error: checkoutErr } = await supabase.functions.invoke(
        "create-checkout-session",
        { body: { product_type: productType, product_id: inserted.id } }
      );
      if (checkoutErr || !checkout?.url) {
        throw new Error(checkoutErr?.message ?? t("myListings.paymentStartFailed"));
      }
      window.location.href = checkout.url;
    } catch (error) {
      console.error("Error saving property:", error);
      toast({
        title: t("myListings.error"),
        description: t("myListings.saveFailed"),
        variant: "destructive",
      });
    }
  };

  if (loading || loadingProperties) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <AppLayout>
    <div className="min-h-screen bg-background flex flex-col">
      {!isMobile && <Navbar />}
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-12 py-8 md:py-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 md:mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px w-8 bg-foreground/40" />
              <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">{t("myListings.eyebrow")}</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-[1.05]">
              {t("myListings.title")}
            </h1>
            <p className="mt-3 text-sm md:text-base text-foreground/60 max-w-xl">
              {t("myListings.subtitle")}
            </p>
          </div>
          {!showForm && (
            <Button
              onClick={openCreateForm}
              className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 px-5"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("myListings.create")}
            </Button>
          )}
        </div>

        {/* Launch Offer Banner - shown for first-time landlords on main page */}
        {!showForm && isLaunchOfferEligible && (
          <div className="mb-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{t("myListings.launchOfferTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {t("myListings.launchOfferBody")}
              </p>
            </div>
          </div>
        )}

        {/* Step-by-step Form */}
        {showForm && (
          <Card className="mb-8 border border-border/60 rounded-2xl overflow-hidden bg-background shadow-none">
            {/* Progress Header */}
            <div className="bg-background p-4 md:p-8 border-b border-border/60">
              <div className="flex items-center justify-between mb-5 md:mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-px w-6 bg-foreground/40" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/60">
                      {t("myListings.stepXofY", { current: currentStep, total: stepKeys.length })}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-3xl font-medium tracking-tight text-foreground">
                    {editingProperty ? t("myListings.editTitle") : t("myListings.createTitle")}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeForm}
                  className="h-9 w-9 md:h-10 md:w-10 rounded-full hover:bg-muted/60"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </div>

              {/* Step Indicators */}
              <div className="flex items-center justify-between w-full overflow-hidden">
                {stepKeys.map((step, index) => (
                  <div key={step.id} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs md:text-sm font-medium transition-colors border ${
                        currentStep > step.id
                          ? 'bg-foreground text-background border-foreground'
                          : currentStep === step.id
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-background text-foreground/50 border-border'
                      }`}>
                        {currentStep > step.id ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4" /> : step.id}
                      </div>
                      <span className={`text-[8px] md:text-xs mt-1.5 md:mt-2 font-medium truncate max-w-[45px] md:max-w-none text-center ${
                        currentStep >= step.id ? 'text-foreground' : 'text-foreground/50'
                      }`}>
                        {t(`myListings.${step.titleKey}`)}
                      </span>
                    </div>
                    {index < stepKeys.length - 1 && (
                      <div className={`flex-1 h-px mx-1 md:mx-2 min-w-[4px] mb-5 ${
                        currentStep > step.id ? 'bg-foreground' : 'bg-border'
                      }`} />
                    )}
                  </div>
                ))}

              </div>
            </div>

            <CardContent className="p-8">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Titel *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                      placeholder="f.eks. Lyst værelse i Vesterbro med fælles stue"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Værelsestype</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {propertyTypes.map(type => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({...formData, property_type: type.value})}
                          className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            formData.property_type === type.value
                              ? 'border-secondary bg-secondary text-secondary-foreground shadow-md'
                              : 'border-border text-foreground hover:bg-muted'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Beskrivelse</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                      placeholder="Beskriv værelset og fællesarealer detaljeret..."
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">

                  {/* Address search — always shown; confirmed address shows below */}
                  {!addressConfirmed ? (
                    <div className="relative">
                      <label className="block text-sm font-medium text-primary mb-2">
                        Søg og vælg adresse <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                          type="text"
                          value={addressQuery}
                          onChange={(e) => {
                            setAddressQuery(e.target.value);
                            setShowAddressSuggestions(true);
                            setAddressConfirmed(false);
                            setSelectedCoords(null);
                          }}
                          onFocus={() => setShowAddressSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 150)}
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                          placeholder="F.eks. Vestergade 12, 2. tv, København"
                          autoComplete="off"
                        />
                      </div>

                      {showAddressSuggestions && addressQuery.trim().length >= 2 && (
                        <div className="absolute z-20 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-72 overflow-y-auto">
                          {dawaLoading && (
                            <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" /> Søger…
                            </div>
                          )}
                          {!dawaLoading && dawaResults.length === 0 && (
                            <div className="px-4 py-3 text-sm text-muted-foreground">Ingen resultater — prøv en anden søgning</div>
                          )}
                          {!dawaLoading && dawaResults.map((r, idx) => (
                            <button
                              key={`${r.label}-${idx}`}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                const d = r.raw.data || {};
                                const street = [d.vejnavn, d.husnr, d.etage ? `${d.etage}.` : null, d.dør].filter(Boolean).join(" ");
                                const postnr = d.postnr || d.postnummer?.nr || "";
                                const city = r.city || d.postnrnavn || d.postnummer?.navn || "";
                                setFormData({
                                  ...formData,
                                  address: street || r.label,
                                  city: city || formData.city,
                                  postal_code: postnr || formData.postal_code,
                                });
                                setAddressQuery(r.label);
                                setShowAddressSuggestions(false);
                                setAddressConfirmed(true);
                                if (r.lat && r.lon) setSelectedCoords({ lat: r.lat, lon: r.lon });
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-muted flex items-start gap-2 border-b border-border last:border-b-0"
                            >
                              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm text-foreground truncate">{r.label}</div>
                                {r.sublabel && <div className="text-xs text-muted-foreground truncate">{r.sublabel}</div>}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Du skal vælge en adresse fra listen — dette sikrer at adressen er korrekt.
                      </p>
                    </div>
                  ) : (
                    /* Confirmed address display */
                    <div className="rounded-xl border border-green-500/40 bg-green-500/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{formData.address}</p>
                            <p className="text-sm text-muted-foreground">{formData.postal_code} {formData.city}</p>
                            <p className="text-xs text-green-600 mt-1">Verificeret dansk adresse</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAddressConfirmed(false);
                            setSelectedCoords(null);
                            setAddressQuery("");
                            setFormData({ ...formData, address: "", city: "", postal_code: "" });
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground underline flex-shrink-0"
                        >
                          Ændre
                        </button>
                      </div>

                      {/* Map */}
                      {selectedCoords && (
                        <div className="mt-4">
                          <Suspense fallback={<div className="h-[220px] rounded-xl bg-muted animate-pulse" />}>
                            <AddressMap lat={selectedCoords.lat} lon={selectedCoords.lon} />
                          </Suspense>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-4">
                    <label className="block text-sm font-medium text-primary mb-3">Offentlig transport i nærheden</label>
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm text-muted-foreground mb-2 block">Metro</span>
                        <div className="flex flex-wrap gap-2">
                          {metroOptions.map(line => (
                            <button
                              key={line}
                              type="button"
                              onClick={() => toggleMetro(line)}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                formData.metro_lines.includes(line)
                                  ? 'bg-secondary text-secondary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              {line}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground mb-2 block">S-tog</span>
                        <div className="flex flex-wrap gap-2">
                          {sTrainOptions.map(line => (
                            <button
                              key={line}
                              type="button"
                              onClick={() => toggleSTrain(line)}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                formData.s_train_lines.includes(line)
                                  ? 'bg-secondary text-secondary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              {line}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground mb-2 block">Buslinjer</span>
                        <input
                          type="text"
                          value={formData.bus_lines}
                          onChange={(e) => setFormData({...formData, bus_lines: e.target.value})}
                          className="w-full max-w-md px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                          placeholder="f.eks. 5A, 350S"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Details */}
              {currentStep === 3 && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Størrelse (m²) *</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.size_sqm}
                      onChange={(e) => setFormData({...formData, size_sqm: e.target.value})}
                      className="w-full max-w-xs px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                      placeholder="15"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Størrelse på det udlejede værelse</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-4">Fællesarealer i boligen</label>
                    <p className="text-sm text-muted-foreground mb-4">Angiv hvor mange fællesrum der er adgang til udover værelset</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-muted/50 rounded-xl p-4 text-center">
                        <span className="text-sm text-muted-foreground block mb-2">Badeværelser i alt</span>
                        <div className="flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, bathroom_count: Math.max(1, parseInt(formData.bathroom_count) - 1).toString()})}
                            className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted"
                          >
                            -
                          </button>
                          <span className="text-xl font-semibold text-primary w-8">{formData.bathroom_count}</span>
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, bathroom_count: (parseInt(formData.bathroom_count) + 1).toString()})}
                            className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-4 text-center">
                        <span className="text-sm text-muted-foreground block mb-2">Fælles stuer</span>
                        <div className="flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, living_area_count: Math.max(0, parseInt(formData.living_area_count) - 1).toString()})}
                            className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted"
                          >
                            -
                          </button>
                          <span className="text-xl font-semibold text-primary w-8">{formData.living_area_count}</span>
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, living_area_count: (parseInt(formData.living_area_count) + 1).toString()})}
                            className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Stue(r) der kan bruges men ikke hører til værelset</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-3">Eget eller delt?</label>
                    <p className="text-sm text-muted-foreground mb-4">Har lejeren sit eget bad/køkken eller deles det med andre?</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, has_private_bathroom: !formData.has_private_bathroom})}
                          className={`w-full px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            formData.has_private_bathroom
                              ? 'border-secondary bg-secondary text-secondary-foreground shadow-md'
                              : 'border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {formData.has_private_bathroom && <Check className="w-4 h-4" />}
                          Eget toilet/bad
                        </button>
                        <p className="text-xs text-muted-foreground text-center">
                          {formData.has_private_bathroom ? 'Lejeren har eget badeværelse' : 'Deles med andre beboere'}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, has_private_kitchen: !formData.has_private_kitchen})}
                          className={`w-full px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            formData.has_private_kitchen
                              ? 'border-secondary bg-secondary text-secondary-foreground shadow-md'
                              : 'border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {formData.has_private_kitchen && <Check className="w-4 h-4" />}
                          Eget køkken
                        </button>
                        <p className="text-xs text-muted-foreground text-center">
                          {formData.has_private_kitchen ? 'Lejeren har eget køkken' : 'Deles med andre beboere'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-3">Andet</label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, is_furnished: !formData.is_furnished})}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          formData.is_furnished
                            ? 'border-secondary bg-secondary text-secondary-foreground shadow-md'
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {formData.is_furnished && <Check className="w-4 h-4 inline mr-2" />}
                        Møbleret
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, bills_included: !formData.bills_included})}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          formData.bills_included
                            ? 'border-secondary bg-secondary text-secondary-foreground shadow-md'
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {formData.bills_included && <Check className="w-4 h-4 inline mr-2" />}
                        Forbrug inkl.
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-3">Faciliteter (valgfrit)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {amenityOptions.map(amenity => (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleAmenity(amenity)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm transition-colors ${
                            formData.amenities.includes(amenity)
                              ? 'border-secondary bg-secondary text-secondary-foreground shadow-md'
                              : 'border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {formData.amenities.includes(amenity) && <Check className="w-4 h-4" />}
                          {amenity}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gender Composition */}
                  <div className="pt-4 border-t border-border">
                    <GenderCompositionSelector
                      composition={formData.gender_composition}
                      maleCount={formData.male_count}
                      femaleCount={formData.female_count}
                      onCompositionChange={(composition) => setFormData({...formData, gender_composition: composition})}
                      onMaleCountChange={(count) => setFormData({...formData, male_count: count})}
                      onFemaleCountChange={(count) => setFormData({...formData, female_count: count})}
                    />
                  </div>

                  {/* Multi-room / Group-friendly */}
                  <div className="pt-4 border-t border-border">
                    <label className="block text-sm font-medium text-primary mb-3">
                      Flere ledige værelser?
                    </label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Har du flere værelser ledige i samme bolig? Dette gør din annonce synlig for grupper der søger sammen.
                    </p>
                    
                    <div className="flex flex-wrap gap-3 mb-4">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, is_multi_room: false, available_rooms: 1})}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          !formData.is_multi_room
                            ? 'border-secondary bg-secondary text-secondary-foreground shadow-md'
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {!formData.is_multi_room && <Check className="w-4 h-4 inline mr-2" />}
                        Nej, kun ét værelse
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, is_multi_room: true, available_rooms: 2})}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          formData.is_multi_room
                            ? 'border-secondary bg-secondary text-secondary-foreground shadow-md'
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {formData.is_multi_room && <Check className="w-4 h-4 inline mr-2" />}
                        Ja, flere værelser
                      </button>
                    </div>

                    {formData.is_multi_room && (
                      <div className="bg-muted/50 rounded-xl p-4 inline-block">
                        <span className="text-sm text-muted-foreground block mb-2">Antal ledige værelser</span>
                        <div className="flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, available_rooms: Math.max(2, formData.available_rooms - 1)})}
                            className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted"
                          >
                            -
                          </button>
                          <span className="text-xl font-semibold text-primary w-8 text-center">{formData.available_rooms}</span>
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, available_rooms: formData.available_rooms + 1})}
                            className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Pricing */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">Månedlig leje (kr) *</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.monthly_rent}
                        onChange={(e) => setFormData({...formData, monthly_rent: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                        placeholder="8000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">Depositum (kr) *</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.deposit}
                        onChange={(e) => setFormData({...formData, deposit: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                        placeholder="24000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Aconto for forbrug (kr/måned)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.aconto}
                      onChange={(e) => setFormData({...formData, aconto: e.target.value})}
                      className="w-full max-w-xs px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                      placeholder="500"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Fast månedlig acontobetaling for el, vand, varme mv. Udfyld 0 hvis forbrug er inkluderet.</p>
                  </div>

                  {/* Total monthly cost display */}
                  {formData.monthly_rent && (
                    <div className="bg-secondary/10 rounded-xl p-4 border border-secondary/30">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-primary">Samlet månedlig omkostning</span>
                        <span className="text-xl font-bold text-primary">
                          {((parseInt(formData.monthly_rent) || 0) + (parseInt(formData.aconto) || 0)).toLocaleString()} kr
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Husleje {parseInt(formData.monthly_rent) || 0} kr + Aconto {parseInt(formData.aconto) || 0} kr
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-primary mb-3">Minimum lejeperiode</label>
                    <div className="flex flex-wrap gap-2">
                      {minStayOptions.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({...formData, min_stay: option.value})}
                          className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                            formData.min_stay === option.value
                              ? 'border-secondary bg-secondary text-secondary-foreground shadow-md'
                              : 'border-border text-foreground hover:bg-muted'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Ledig fra</label>
                    <input
                      type="date"
                      value={formData.available_from}
                      onChange={(e) => setFormData({...formData, available_from: e.target.value})}
                      className="w-full max-w-xs px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Images */}
              {currentStep === 5 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="text-center mb-6">
                    <ImageIcon className="w-12 h-12 mx-auto text-secondary mb-4" />
                    <h3 className="text-xl font-semibold text-primary mb-2">Upload billeder</h3>
                    <p className="text-muted-foreground">
                      Tilføj billeder af boligen. Gode billeder øger chancen for at finde den rette roomie.
                    </p>
                  </div>

                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-secondary/50 transition-colors">
                    <input
                      type="file"
                      id="image-upload"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImages}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer block">
                      {uploadingImages ? (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4" />
                          <p className="text-muted-foreground">Uploader billeder...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                          <p className="font-medium text-primary mb-2">Klik for at uploade billeder</p>
                          <p className="text-sm text-muted-foreground">PNG, JPG eller WEBP — optimeres automatisk</p>
                        </div>
                      )}
                    </label>
                  </div>

                  {(editingProperty || draftListingId) && (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        Hvis billeder ikke vises her, kan du hente dine tidligere uploads.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={syncExistingImages}
                        disabled={loadingExistingImages}
                        className="md:self-end"
                      >
                        {loadingExistingImages ? "Henter..." : "Hent uploads"}
                      </Button>
                    </div>
                  )}

                  {/* Uploaded Images Preview */}
                  {uploadedImages.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-primary mb-3">
                        Uploadede billeder ({uploadedImages.length})
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {uploadedImages.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Billede ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            {index === 0 && (
                              <span className="absolute bottom-2 left-2 bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">
                                Forside
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Det første billede bruges som forsidebillede
                      </p>
                    </div>
                  )}

                  {uploadedImages.length === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800">
                        Du skal uploade mindst ét billede for at fortsætte
                      </p>
                    </div>
                  )}

                  {/* Floor Plan Section */}
                  <div className="border-t border-border pt-6 mt-6">
                    <h4 className="font-medium text-primary mb-4 flex items-center gap-2">
                      <Home className="w-5 h-5" />
                      Plantegning (valgfri)
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload en plantegning for at give lejere et bedre overblik over boligen. Boliger med plantegning får ofte flere henvendelser.
                    </p>
                    
                    <div className="flex gap-4 overflow-hidden">
                      {/* Upload area */}
                      <div className="flex-1 min-w-0">
                        {floorPlanUrl ? (
                          <div className="relative group">
                            <img
                              src={floorPlanUrl}
                              alt="Plantegning"
                              className="w-full h-48 object-contain rounded-xl border border-border bg-muted/50"
                            />
                            <button
                              type="button"
                              onClick={removeFloorPlan}
                              className="absolute top-2 right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <span className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                              Plantegning
                            </span>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-secondary/50 transition-colors">
                            <input
                              type="file"
                              id="floor-plan-upload"
                              accept="image/*"
                              onChange={handleFloorPlanUpload}
                              className="hidden"
                              disabled={uploadingFloorPlan}
                            />
                            <label htmlFor="floor-plan-upload" className="cursor-pointer block">
                              {uploadingFloorPlan ? (
                                <div className="flex flex-col items-center">
                                  <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-3" />
                                  <p className="text-sm text-muted-foreground">Uploader...</p>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                                  <p className="font-medium text-primary text-sm mb-1">Upload plantegning</p>
                                  <p className="text-xs text-muted-foreground">PNG, JPG eller PDF</p>
                                </div>
                              )}
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Example box */}
                      <div className="w-32 sm:w-40 flex-shrink-0">
                        <div className="border border-border rounded-xl p-3 bg-muted/30 h-full">
                          <p className="text-xs font-medium text-primary mb-2 text-center">Eksempel</p>
                          <div className="aspect-square bg-background rounded-lg border border-border flex items-center justify-center overflow-hidden">
                            <svg viewBox="0 0 100 100" className="w-full h-full p-2 text-muted-foreground">
                              {/* Simple floor plan illustration */}
                              <rect x="10" y="10" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="2"/>
                              <line x1="10" y1="50" x2="45" y2="50" stroke="currentColor" strokeWidth="1.5"/>
                              <line x1="55" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="1.5"/>
                              <line x1="50" y1="10" x2="50" y2="40" stroke="currentColor" strokeWidth="1.5"/>
                              <rect x="15" y="15" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2"/>
                              <rect x="70" y="55" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2"/>
                              <text x="50" y="95" textAnchor="middle" fontSize="6" fill="currentColor">Plantegning</text>
                            </svg>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            Vis boligens layout
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Payment */}
              {currentStep === 6 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="text-center mb-6">
                    <CreditCard className="w-12 h-12 mx-auto text-secondary mb-4" />
                    <h3 className="text-xl font-semibold text-primary mb-2">{t("myListings.choosePeriod")}</h3>
                    <p className="text-muted-foreground">
                      {freeTrialInfo.active && !editingProperty
                        ? t("myListings.freeTrialPublish")
                        : t("myListings.choosePeriodBody")}
                    </p>
                  </div>

                  {/* Free trial banner */}
                  {freeTrialInfo.active && !editingProperty ? (
                    <>
                      <div className="bg-green-500/10 border-2 border-green-500/40 rounded-xl p-5 flex items-start gap-4">
                        <div className="w-11 h-11 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <Gift className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{t("myListings.freeTrialBanner", { days: freeTrialInfo.daysLeft })}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {t("myListings.freeTrialBannerBody", { used: freeTrialInfo.daysUsed, total: FREE_TRIAL_DAYS })}
                          </p>
                          <div className="mt-3 w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-green-500 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, (freeTrialInfo.daysUsed / FREE_TRIAL_DAYS) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-6 rounded-xl border-2 border-green-500 bg-green-500/5">
                        <div>
                          <p className="font-semibold text-lg text-foreground">{t("myListings.manyDays", { count: 30 })}</p>
                          <p className="text-sm text-muted-foreground">{t("myListings.thirtyDaysVisible")}</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{t("myListings.free")}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Launch offer banner */}
                      {isLaunchOfferEligible && (
                        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{t("myListings.launchOfferShort")}</p>
                            <p className="text-sm text-muted-foreground">{t("myListings.launchOfferShortBody")}</p>
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4">
                        {listingPeriods.map((period) => {
                          const discountedPrice = getListingPrice(period.price, true);
                          const showDiscount = isLaunchOfferEligible && discountedPrice < period.price;

                          return (
                            <button
                              key={period.days}
                              type="button"
                              onClick={() => setSelectedListingPeriod(period.days)}
                              className={`relative flex items-center justify-between p-6 rounded-xl border-2 transition-all ${
                                selectedListingPeriod === period.days
                                  ? 'border-secondary bg-secondary/10 shadow-md'
                                  : 'border-border hover:border-secondary/50 hover:bg-muted/50'
                              }`}
                            >
                              {period.popular && (
                                <span className="absolute -top-2 left-4 px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground rounded-full">
                                  {t("myListings.mostPopular")}
                                </span>
                              )}
                              {period.bestValue && (
                                <span className="absolute -top-2 left-4 px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded-full">
                                  {t("myListings.bestValue")}
                                </span>
                              )}
                              <div className="text-left">
                                <p className="font-semibold text-lg text-foreground">{t("myListings.manyDays", { count: period.days })}</p>
                                <p className="text-sm text-muted-foreground">{t("myListings.thirtyDaysVisible")}</p>
                              </div>
                              <div className="text-right">
                                {showDiscount ? (
                                  <div className="flex flex-col items-end">
                                    <p className="text-sm text-muted-foreground line-through">{period.price} kr</p>
                                    <p className="text-2xl font-bold text-green-600">{discountedPrice} kr</p>
                                  </div>
                                ) : (
                                  <p className="text-2xl font-bold text-secondary">{period.price} kr</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Summary */}
                  <div className="bg-muted/50 rounded-xl p-6 mt-6">
                    <h4 className="font-medium text-primary mb-4">{t("myListings.summary")}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("myListings.summaryListing")}</span>
                        <span className="font-medium text-foreground">{formData.title || t("myListings.newListing")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("myListings.summaryLocation")}</span>
                        <span className="font-medium text-foreground">{formData.city || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("myListings.summaryRent")}</span>
                        <span className="font-medium text-foreground">{parseInt(formData.monthly_rent || "0").toLocaleString()} kr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("myListings.summaryImages")}</span>
                        <span className="font-medium text-foreground">{uploadedImages.length === 1 ? t("myListings.imagesOne") : t("myListings.imagesMany", { count: uploadedImages.length })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("myListings.summaryPeriod")}</span>
                        <span className="font-medium text-foreground">
                          {freeTrialInfo.active && !editingProperty ? t("myListings.manyDays", { count: 30 }) : t("myListings.manyDays", { count: selectedListingPeriod })}
                        </span>
                      </div>

                      {/* Show discount line if eligible (only when not free trial) */}
                      {isLaunchOfferEligible && !freeTrialInfo.active && (
                        <>
                          <div className="flex justify-between text-muted-foreground">
                            <span>{t("myListings.summaryNormalPrice")}</span>
                            <span className="line-through">{listingPeriods.find(p => p.days === selectedListingPeriod)?.price} kr</span>
                          </div>
                          <div className="flex justify-between text-green-600">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              {t("myListings.summaryDiscount")}
                            </span>
                            <span>-{Math.floor((listingPeriods.find(p => p.days === selectedListingPeriod)?.price || 0) * LAUNCH_OFFER_DISCOUNT)} kr</span>
                          </div>
                        </>
                      )}

                      <div className="border-t border-border pt-2 mt-2">
                        <div className="flex justify-between text-base">
                          <span className="font-medium text-primary">{t("myListings.summaryTotal")}</span>
                          <span className={`font-bold ${freeTrialInfo.active && !editingProperty ? 'text-green-600' : isLaunchOfferEligible ? 'text-green-600' : 'text-secondary'}`}>
                            {freeTrialInfo.active && !editingProperty
                              ? t("myListings.summaryFree")
                              : `${getListingPrice(listingPeriods.find(p => p.days === selectedListingPeriod)?.price || 0, true)} kr`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-8 mt-8 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`${currentStep === 1 ? 'invisible' : ''} w-full sm:w-auto order-2 sm:order-1`}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  {t("myListings.navBack")}
                </Button>

                {currentStep < 6 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full sm:w-auto order-1 sm:order-2"
                  >
                    {t("myListings.navNext")}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handlePaymentAndSubmit}
                    disabled={!canProceed() || (native && !freeTrialInfo.active && !editingProperty)}
                    className={`${freeTrialInfo.active && !editingProperty ? 'bg-green-600 hover:bg-green-700' : isLaunchOfferEligible && !editingProperty ? 'bg-green-600 hover:bg-green-700' : 'bg-secondary hover:bg-secondary/90'} text-secondary-foreground w-full sm:w-auto order-1 sm:order-2`}
                  >
                    {freeTrialInfo.active && !editingProperty
                      ? <Gift className="w-4 h-4 mr-2 flex-shrink-0" />
                      : <CreditCard className="w-4 h-4 mr-2 flex-shrink-0" />}
                    <span className="whitespace-nowrap">
                      {freeTrialInfo.active && !editingProperty
                        ? t("myListings.publishFree")
                        : editingProperty
                          ? t("myListings.saveAndPublish")
                          : native
                            ? t("myListings.buyOnWeb")
                            : t("myListings.payAndPublish", { price: getListingPrice(listingPeriods.find(p => p.days === selectedListingPeriod)?.price || 0, true) })
                      }
                    </span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Listings Grid */}
        {!showForm && (
          <>
            {properties.length === 0 ? (
              <Card className="border-dashed border-2 border-border">
                <CardContent className="p-12 text-center">
                  <Home className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-primary mb-2">{t("myListings.noneYet")}</h3>
                  <p className="text-muted-foreground mb-4">{t("myListings.noneYetBody")}</p>

                  {/* Launch offer promotion */}
                  {isLaunchPeriodActive() && (
                    <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4 mb-6 inline-flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <span className="font-medium text-foreground">{t("myListings.launchOfferShort")}</span>
                    </div>
                  )}

                  <Button
                    onClick={openCreateForm}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("myListings.createFirst")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {properties.map((property) => (
                  <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-[4/3] md:aspect-video bg-muted relative">
                      {property.images?.[0] ? (
                        <img 
                          src={property.images[0]} 
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-8 h-8 md:w-12 md:h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-1.5 right-1.5 md:top-3 md:right-3 flex flex-col md:flex-row items-end md:items-center gap-1 md:gap-2">
                        {isPropertyBoosted(property.id) && (
                          <span className="px-1.5 py-0.5 md:px-3 md:py-1 rounded-full text-[9px] md:text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white flex items-center gap-0.5 md:gap-1 shadow-md">
                            <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3" />
                            <span className="hidden md:inline">{t("myListings.boostedLabel")}</span>
                            {getBoostDaysLeft(property.id) && (
                              <span className="opacity-90">({getBoostDaysLeft(property.id)})</span>
                            )}
                          </span>
                        )}
                        {getStatusBadge(property)}
                      </div>
                    </div>
                    <CardContent className="p-2.5 md:p-4">
                      <h3 className="font-semibold text-primary text-xs md:text-lg mb-0.5 md:mb-1 line-clamp-1">{property.title}</h3>
                      <div className="flex items-center text-muted-foreground text-[10px] md:text-sm mb-1 md:mb-2">
                        <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1 flex-shrink-0" />
                        <span className="truncate">{property.city}</span>
                      </div>
                      
                      {/* Expiry info - hidden on mobile */}
                      {(property as any).expires_at && (
                        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground mb-3">
                          <Clock className="w-3 h-3" />
                          {t("myListings.expiresOn", { date: format(new Date((property as any).expires_at), "d. MMM yyyy", { locale: da }) })}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mb-2 md:mb-4">
                        <span className="text-sm md:text-xl font-bold text-secondary">{property.monthly_rent.toLocaleString()} kr</span>
                        <span className="text-[10px] md:text-sm text-muted-foreground">
                          {property.room_count} {t("myListings.rooms")}
                        </span>
                      </div>
                      
                      {/* Action buttons - paid upgrades, web only (Play Billing handled separately) */}
                      {!native && (
                      <div className="flex gap-1 md:gap-2 mb-1.5 md:mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPeriod(14);
                            setRenewDialog(property);
                          }}
                          className="flex-1 h-7 md:h-9 text-[10px] md:text-sm px-1.5 md:px-3"
                        >
                          <RefreshCw className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                          <span className="hidden md:inline">{(property as any).status === "active" ? t("myListings.extend") : t("myListings.renew")}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBoost(1);
                            setBoostDialog(property);
                          }}
                          className="flex-1 h-7 md:h-9 text-[10px] md:text-sm px-1.5 md:px-3"
                        >
                          <Sparkles className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                          <span className="hidden md:inline">{t("myListings.boost")}</span>
                        </Button>
                      </div>
                      )}
                      
                      <div className="flex gap-1 md:gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => togglePublish(property.id, property.is_published)}
                          className="flex-1 h-7 md:h-9 text-[10px] md:text-sm px-1 md:px-3"
                        >
                          {property.is_published ? (
                            <><EyeOff className="w-3 h-3 md:w-4 md:h-4 md:mr-1" /><span className="hidden md:inline">{t("myListings.hide")}</span></>
                          ) : (
                            <><Eye className="w-3 h-3 md:w-4 md:h-4 md:mr-1" /><span className="hidden md:inline">{t("myListings.publish")}</span></>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => openEditForm(property)}
                          className="h-7 w-7 md:h-9 md:w-9 p-0"
                        >
                          <Edit className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:bg-destructive/10 h-7 w-7 md:h-9 md:w-9 p-0"
                          onClick={() => confirmDelete(property.id)}
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("myListings.deleteSure")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("myListings.deleteSureBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("myListings.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteProperty}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("myListings.deleteListing")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Renew Dialog */}
      <Dialog open={!!renewDialog} onOpenChange={() => setRenewDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("myListings.renewTitle")}</DialogTitle>
            <DialogDescription>
              {t("myListings.renewBody")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="font-medium text-foreground">{renewDialog?.title}</p>
            <div className="grid gap-3">
              {listingPeriods.map((period) => (
                <button
                  key={period.days}
                  onClick={() => setSelectedPeriod(period.days)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    selectedPeriod === period.days
                      ? "border-secondary bg-secondary/10"
                      : "border-border hover:border-secondary/50"
                  }`}
                >
                  <span className="font-medium">{t("myListings.manyDays", { count: period.days })}</span>
                  <span className="font-bold text-secondary">{period.price} kr</span>
                </button>
              ))}
            </div>
            <Button
              onClick={handleRenewListing}
              disabled={renewPurchasing}
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {renewPurchasing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("myListings.payAndActivate", { price: listingPeriods.find(p => p.days === selectedPeriod)?.price })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Boost Dialog */}
      <Dialog open={!!boostDialog} onOpenChange={() => setBoostDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("myListings.boostTitle")}</DialogTitle>
            <DialogDescription>
              {t("myListings.boostBody")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="font-medium text-foreground">{boostDialog?.title}</p>
            <div className="grid gap-3">
              {boostOptions.map((boost) => (
                <button
                  key={boost.days}
                  onClick={() => setSelectedBoost(boost.days)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    selectedBoost === boost.days
                      ? "border-secondary bg-secondary/10"
                      : "border-border hover:border-secondary/50"
                  }`}
                >
                  <span className="font-medium">{boost.days === 1 ? "24h" : t("myListings.manyDays", { count: boost.days })}</span>
                  <span className="font-bold text-secondary">{boost.price} kr</span>
                </button>
              ))}
            </div>
            <Button
              onClick={handleBoostListing}
              disabled={boostPurchasing}
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {boostPurchasing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("myListings.payAndBoost", { price: boostOptions.find(b => b.days === selectedBoost)?.price })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </AppLayout>
  );
};

export default MyListings;
