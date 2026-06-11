import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { checkFields } from "@/lib/contentFilter";
import { Upload, User, ChevronLeft, ChevronRight, Pencil, X, Check, ArrowRight, ArrowLeft, Star, Heart, UserCircle, Settings, Sparkles, Plus, Trash2 } from "lucide-react";
import { pickImage } from "@/lib/camera";
import { personalityOptions, lifestyleOptions } from "@/lib/traits";

interface Property {
  id: string;
  title: string;
  monthly_rent: number;
  is_furnished: boolean;
  images: string[];
}
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AppLayout from "@/components/navigation/AppLayout";
import { useIsMobile } from "@/hooks/use-mobile";

const workOptions = [
  { value: "student", label: "Studerende" },
  { value: "employed", label: "Ansat" },
  { value: "self-employed", label: "Selvstændig" },
  { value: "unemployed", label: "Arbejdsløs" },
  { value: "other", label: "Andet" },
];

import { allNationalities } from "@/data/nationalities";
import { allLanguages } from "@/data/languages";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const genderOptions = [
  { value: "male", label: "Mand" },
  { value: "female", label: "Kvinde" },
  { value: "other", label: "Andet" },
];

const rentalPeriodOptions = [
  { value: "1-3", label: "Kort sigt (1-3 måneder)" },
  { value: "3-6", label: "Mellemlang (3-6 måneder)" },
  { value: "6-12", label: "Lang sigt (6-12 måneder)" },
  { value: "12+", label: "Udvidet (12+ måneder)" },
];

const Profile = () => {
  const { user, profile, refreshProfile, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tt = (label: string) => t(`tags.${label}`, { defaultValue: label });
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [landlordProperties, setLandlordProperties] = useState<Property[]>([]);
  const [editTab, setEditTab] = useState("basis");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Form state
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [study, setStudy] = useState("");
  const [work, setWork] = useState("");
  const [workOther, setWorkOther] = useState("");
  const [nationality, setNationality] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [personality, setPersonality] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [rentalPeriod, setRentalPeriod] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  // Account settings
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Only refresh profile if we don't have one yet (avoid unnecessary re-fetch on every navigation)
  useEffect(() => {
    if (!loading && user && !profile) {
      refreshProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, profile]);

  useEffect(() => {
    const fetchLandlordProperties = async () => {
      if (profile && profile.user_type === "landlord") {
        const { data } = await supabase
          .from("properties")
          .select("id, title, monthly_rent, is_furnished, images")
          .eq("user_id", profile.user_id)
          .eq("is_published", true)
          .order("created_at", { ascending: false });
        
        if (data) {
          setLandlordProperties(data);
        }
      }
    };

    fetchLandlordProperties();
  }, [profile]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setAge(profile.age?.toString() || "");
      setStudy(profile.study || "");
      setWork(profile.work || "");
      setWorkOther(profile.work_other || "");
      setNationality(profile.nationality || "");
      setBio(profile.bio || "");
      setGender(profile.gender || "");
      setPersonality(profile.personality || []);
      setLifestyle(profile.lifestyle || []);
      setLanguages(profile.languages || []);
      setMonthlyBudget(profile.monthly_budget?.toString() || "");
      setRentalPeriod(profile.rental_period || "");
      setAvatarPreview(profile.avatar_url || null);
      setProfileImages((profile as any).images || []);
    }
    if (user) {
      setNewEmail(user.email || "");
    }
  }, [profile, user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setNewImageFiles(prev => [...prev, ...newFiles]);
      
      // Create previews for new files
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    // profileImages = [...existing URLs, ...new previews] where the new previews
    // run parallel to newImageFiles. So the current count of existing images is
    // profileImages.length - newImageFiles.length — this stays correct even
    // after earlier removals (unlike the original DB images length, which is stale).
    const existingImagesCount = profileImages.length - newImageFiles.length;
    setProfileImages(prev => prev.filter((_, i) => i !== index));
    if (index >= existingImagesCount) {
      const newFileIndex = index - existingImagesCount;
      setNewImageFiles(prev => prev.filter((_, i) => i !== newFileIndex));
    }
  };

  const toggleArrayItem = (array: string[], setArray: (arr: string[]) => void, item: string, maxItems?: number) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      // Check max limit if specified
      if (maxItems && array.length >= maxItems) {
        toast({
          variant: "destructive",
          title: t("profile.maxReached"),
          description: t("profile.maxReachedBody", { max: maxItems }),
        });
        return;
      }
      setArray([...array, item]);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    // Block bios with slurs, scam markers, or obvious spam patterns
    const check = checkFields({ name, bio, study, workOther });
    if (!check.ok) {
      toast({
        variant: "destructive",
        title: t("contentFilter.title"),
        description: t(`contentFilter.${check.reason}`),
      });
      return;
    }

    setIsSaving(true);

    try {
      let avatarUrl = profile.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        // Storage-RLS kræver at filen ligger i en mappe navngivet efter brugerens uid
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile);

        if (uploadError) {
          console.error("Avatar upload error:", uploadError);
          toast({
            variant: "destructive",
            title: t("profile.error"),
            description: t("profile.avatarUploadError"),
          });
        } else {
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(fileName);
          avatarUrl = urlData.publicUrl;
        }
      }

      // Upload new profile images
      const existingImages = ((profile as any)?.images || []).filter((img: string) => 
        profileImages.includes(img)
      );
      const uploadedImageUrls: string[] = [...existingImages];

      let failedImageUploads = 0;
      for (const file of newImageFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/profile-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Profile image upload error:", uploadError);
          failedImageUploads++;
        } else {
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(fileName);
          uploadedImageUrls.push(urlData.publicUrl);
        }
      }
      if (failedImageUploads > 0) {
        toast({
          variant: "destructive",
          title: t("profile.error"),
          description: t("profile.imageUploadError"),
        });
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          age: age ? parseInt(age) : null,
          study: work === "student" ? study.trim() : null,
          work: work || null,
          work_other: (work === "employed" || work === "self-employed" || work === "other") ? workOther.trim() : null,
          nationality: nationality || null,
          bio: bio.trim() || null,
          gender: gender || null,
          personality,
          lifestyle,
          languages,
          monthly_budget: monthlyBudget ? parseInt(monthlyBudget) : null,
          rental_period: rentalPeriod || null,
          avatar_url: avatarUrl,
          images: uploadedImageUrls,
        })
        .eq("id", profile.id);

      if (error) {
        toast({
          variant: "destructive",
          title: t("profile.error"),
          description: t("profile.saveFailed"),
        });
      } else {
        await refreshProfile();
        setIsEditing(false);
        setAvatarFile(null);
        setNewImageFiles([]);
        toast({
          title: t("profile.updated"),
          description: t("profile.updatedBody"),
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast({
        variant: "destructive",
        title: t("profile.error"),
        description: t("profile.passwordFieldsRequired"),
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          variant: "destructive",
          title: t("profile.error"),
          description: error.message,
        });
      } else {
        toast({
          title: t("profile.passwordChanged"),
          description: t("profile.passwordChangedBody"),
        });
        setCurrentPassword("");
        setNewPassword("");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    if (profile) {
      setName(profile.name || "");
      setAge(profile.age?.toString() || "");
      setStudy(profile.study || "");
      setWork(profile.work || "");
      setWorkOther(profile.work_other || "");
      setNationality(profile.nationality || "");
      setBio(profile.bio || "");
      setGender(profile.gender || "");
      setPersonality(profile.personality || []);
      setLifestyle(profile.lifestyle || []);
      setLanguages(profile.languages || []);
      setMonthlyBudget(profile.monthly_budget?.toString() || "");
      setRentalPeriod(profile.rental_period || "");
      setAvatarPreview(profile.avatar_url || null);
      setAvatarFile(null);
    }
    setIsEditing(false);
  };

  const getPersonalityColor = (label: string) => {
    return personalityOptions.find(p => p.label === label)?.color || "bg-gray-500";
  };

  const getLifestyleColor = (label: string) => {
    return lifestyleOptions.find(l => l.label === label)?.color || "bg-gray-500";
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t("profile.loading")}</div>
      </div>
    );
  }

  const isRoomie = profile.user_type === "roomie";
  const workLabelRaw = workOptions.find(o => o.value === profile.work)?.label || profile.work;
  const workLabel = workLabelRaw ? tt(workLabelRaw) : workLabelRaw;
  const genderLabelRaw = genderOptions.find(g => g.value === profile.gender)?.label || profile.gender;
  const genderLabel = genderLabelRaw ? tt(genderLabelRaw) : genderLabelRaw;

  // Edit Mode with Tabs
  if (isEditing) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background">
          {!isMobile && <Navbar />}
          <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-12 py-6 md:py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 md:mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-foreground/40" />
                <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">{t("profile.eyebrow")}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-foreground leading-[1.05]">
                {t("profile.editTitle")}
              </h1>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={cancelEdit} variant="outline" size="sm" className="flex-1 sm:flex-none rounded-full h-10 px-5 border-border/60">
                <X className="w-4 h-4 mr-1.5" />
                <span className="text-sm">{t("profile.cancel")}</span>
              </Button>
              <Button onClick={handleSave} disabled={isSaving} size="sm" className="flex-1 sm:flex-none rounded-full bg-foreground text-background hover:bg-foreground/90 h-10 px-5">
                <Check className="w-4 h-4 mr-1.5" />
                <span className="text-sm">{isSaving ? t("profile.saving") : t("profile.save")}</span>
              </Button>
            </div>
          </div>

          <div className="border-t border-border/60 pt-8 md:pt-10">
          <Tabs value={editTab} onValueChange={setEditTab} className="w-full">
            <TabsList className="inline-flex h-auto bg-transparent p-0 mb-8 gap-1 border-b border-border/60 w-full justify-start rounded-none">
              <TabsTrigger value="basis" className="flex items-center gap-2 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 -mb-px text-foreground/60 data-[state=active]:text-foreground">
                <UserCircle className="w-4 h-4" />
                {t("profile.tabBasis")}
              </TabsTrigger>
              <TabsTrigger value="personligt" className="flex items-center gap-2 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 -mb-px text-foreground/60 data-[state=active]:text-foreground">
                <Sparkles className="w-4 h-4" />
                {t("profile.tabPersonal")}
              </TabsTrigger>
            </TabsList>

            {/* Basis Tab */}
            <TabsContent value="basis" className="space-y-10">
              {/* Profile Images */}
              <div className="space-y-3">
                <Label>{t("profile.profilePictures")}</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {/* Main Avatar */}
                  <div className="relative aspect-square">
                    <div className="w-full h-full rounded-xl bg-muted flex items-center justify-center overflow-hidden border-2 border-secondary">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const file = await pickImage("prompt");
                        if (file) {
                          setAvatarFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => setAvatarPreview(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute bottom-1 right-1 w-7 h-7 bg-secondary rounded-lg flex items-center justify-center cursor-pointer hover:bg-secondary/90"
                    >
                      <Upload className="w-3.5 h-3.5 text-secondary-foreground" />
                    </button>
                    <span className="absolute top-1 left-1 bg-secondary text-secondary-foreground text-[11px] font-medium px-1.5 py-0.5 rounded">
                      {t("profile.mainPhoto")}
                    </span>
                  </div>

                  {/* Additional Images */}
                  {profileImages.map((img, index) => (
                    <div key={index} className="relative aspect-square">
                      <div className="w-full h-full rounded-xl bg-muted overflow-hidden">
                        <img src={img} alt={`Profil ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center hover:bg-destructive/90"
                      >
                        <Trash2 className="w-3 h-3 text-destructive-foreground" />
                      </button>
                    </div>
                  ))}

                  {/* Add New Image Button */}
                  {profileImages.length < 5 && (
                    <button
                      type="button"
                      onClick={async () => {
                        const file = await pickImage("prompt");
                        if (file) {
                          setNewImageFiles(prev => [...prev, file]);
                          const reader = new FileReader();
                          reader.onloadend = () => setProfileImages(prev => [...prev, reader.result as string]);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-secondary hover:bg-muted/50 transition-colors"
                    >
                      <Plus className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">{t("profile.addPicture")}</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{t("profile.add5more")}</p>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("profile.nameLabel")}</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("profile.yourName")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("profile.ageLabel")}</Label>
                  <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder={t("profile.yourAge")} min="18" max="99" />
                </div>
                <div className="space-y-2">
                  <Label>{t("profile.genderLabel")}</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue placeholder={t("profile.selectGender")} /></SelectTrigger>
                    <SelectContent>
                      {genderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{tt(option.label)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("profile.occupation")}</Label>
                  <Select value={work} onValueChange={(value) => {
                    setWork(value);
                    // Reset detail fields when changing occupation type
                    setStudy("");
                    setWorkOther("");
                  }}>
                    <SelectTrigger><SelectValue placeholder={t("profile.selectOccupation")} /></SelectTrigger>
                    <SelectContent>
                      {workOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{tt(option.label)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conditional detail field based on occupation type */}
              {work === "student" && (
                <div className="space-y-2">
                  <Label>{t("profile.studyWhat")}</Label>
                  <Input value={study} onChange={(e) => setStudy(e.target.value)} placeholder={t("profile.studyPlaceholder")} />
                </div>
              )}

              {work === "employed" && (
                <div className="space-y-2">
                  <Label>{t("profile.workWhat")}</Label>
                  <Input value={workOther} onChange={(e) => setWorkOther(e.target.value)} placeholder={t("profile.workPlaceholder")} />
                </div>
              )}

              {work === "self-employed" && (
                <div className="space-y-2">
                  <Label>{t("profile.businessWhat")}</Label>
                  <Input value={workOther} onChange={(e) => setWorkOther(e.target.value)} placeholder={t("profile.businessPlaceholder")} />
                </div>
              )}

              {work === "other" && (
                <div className="space-y-2">
                  <Label>{t("profile.otherWhat")}</Label>
                  <Input value={workOther} onChange={(e) => setWorkOther(e.target.value)} placeholder={t("profile.otherPlaceholder")} />
                </div>
              )}
            </TabsContent>

            {/* Personligt Tab */}
            <TabsContent value="personligt" className="space-y-8">
              {/* Bio */}
              <div className="space-y-2">
                <Label>{t("profile.aboutMe")}</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t("profile.bioPlaceholderOwn")} rows={4} />
              </div>

              {/* Personality */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{t("profile.personality")}</Label>
                  <span className={`text-xs ${personality.length >= 6 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                    {t("profile.tagsSelected", { count: personality.length, max: 6 })}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {personalityOptions.map((option) => {
                    const isSelected = personality.includes(option.label);
                    const isDisabled = !isSelected && personality.length >= 6;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => toggleArrayItem(personality, setPersonality, option.label, 6)}
                        disabled={isDisabled}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2 ${
                          isSelected
                            ? "bg-card border-border shadow-sm"
                            : isDisabled
                              ? "bg-transparent border-border/30 opacity-30 cursor-not-allowed"
                              : "bg-transparent border-border/50 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${option.color}`}></span>
                        {tt(option.label)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lifestyle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{t("profile.lifestyle")}</Label>
                  <span className={`text-xs ${lifestyle.length >= 6 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                    {t("profile.tagsSelected", { count: lifestyle.length, max: 6 })}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lifestyleOptions.map((option) => {
                    const isSelected = lifestyle.includes(option.label);
                    const isDisabled = !isSelected && lifestyle.length >= 6;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => toggleArrayItem(lifestyle, setLifestyle, option.label, 6)}
                        disabled={isDisabled}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2 ${
                          isSelected
                            ? "bg-card border-border shadow-sm"
                            : isDisabled
                              ? "bg-transparent border-border/30 opacity-30 cursor-not-allowed"
                              : "bg-transparent border-border/50 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${option.color}`}></span>
                        {tt(option.label)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Languages - Searchable Dropdown */}
              <div className="space-y-3">
                <Label>{t("profile.languagesISpeak")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {languages.length > 0 ? t("profile.languagesSelected", { count: languages.length }) : t("profile.selectLanguages")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t("profile.searchLanguage")} />
                      <CommandList>
                        <CommandEmpty>{t("profile.noLanguagesFound")}</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-auto">
                          {allLanguages.map((lang) => (
                            <CommandItem
                              key={lang}
                              onSelect={() => toggleArrayItem(languages, setLanguages, lang)}
                              className="cursor-pointer"
                            >
                              <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${languages.includes(lang) ? 'bg-secondary border-secondary' : 'border-primary'}`}>
                                {languages.includes(lang) && <Check className="h-3 w-3 text-secondary-foreground" />}
                              </div>
                              {lang}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {languages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang) => (
                      <Badge key={lang} variant="secondary" className="flex items-center gap-1">
                        {lang}
                        <button
                          type="button"
                          onClick={() => toggleArrayItem(languages, setLanguages, lang)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Nationality - Searchable Dropdown */}
              <div className="space-y-3">
                <Label>{t("profile.nationality")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {nationality || t("profile.selectNationalityShort")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t("profile.searchNationalityLong")} />
                      <CommandList>
                        <CommandEmpty>{t("profile.noNationalityFound")}</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-auto">
                          {allNationalities.map((nat) => (
                            <CommandItem
                              key={nat}
                              onSelect={() => setNationality(nat)}
                              className="cursor-pointer"
                            >
                              <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-full border ${nationality === nat ? 'bg-secondary border-secondary' : 'border-primary'}`}>
                                {nationality === nat && <Check className="h-3 w-3 text-secondary-foreground" />}
                              </div>
                              {nat}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Rent Preferences */}
              {isRoomie && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("profile.monthlyBudgetKr")}</Label>
                    <Input type="number" value={monthlyBudget} onChange={(e) => setMonthlyBudget(e.target.value)} placeholder={t("profile.budgetExample")} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("profile.rentalPeriodLabel")}</Label>
                    <Select value={rentalPeriod} onValueChange={setRentalPeriod}>
                      <SelectTrigger><SelectValue placeholder={t("profile.selectPeriod")} /></SelectTrigger>
                      <SelectContent>
                        {rentalPeriodOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{tt(option.label)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </TabsContent>

          </Tabs>
          </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // View Mode - Matching the design
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {!isMobile && <Navbar />}
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 py-6 md:py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 md:mb-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground -ml-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("profile.backShort")}
          </button>
          <Button
            onClick={() => setIsEditing(true)}
            className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-10 px-5 gap-2"
          >
            <Pencil className="w-3.5 h-3.5" />
            {t("profile.editProfile")}
          </Button>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left Column - Image */}
          <div className="space-y-8">
            {(() => {
              const allImages = [
                avatarPreview,
                ...((profile as any)?.images || [])
              ].filter(Boolean) as string[];

              const currentImage = allImages[currentImageIndex] || avatarPreview;
              const hasMultipleImages = allImages.length > 1;

              return (
                <div className="relative">
                  <div className="aspect-[4/5] rounded-3xl bg-muted overflow-hidden">
                    {currentImage ? (
                      <img
                        src={currentImage}
                        alt={profile.name}
                        className="w-full h-full object-cover transition-opacity duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-24 h-24 text-foreground/30" />
                      </div>
                    )}
                  </div>

                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm border border-border/60 flex items-center justify-center hover:bg-background transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-foreground" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm border border-border/60 flex items-center justify-center hover:bg-background transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-foreground" />
                      </button>

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {allImages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`h-1.5 rounded-full transition-all ${
                              idx === currentImageIndex
                                ? 'bg-white w-6'
                                : 'bg-white/50 hover:bg-white/70 w-1.5'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Right Column - Info */}
          <div className="space-y-8">
            {/* Name and basic info */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-foreground/40" />
                <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                  {profile.user_type === "landlord" ? t("userProfile.landlord") : t("userProfile.roomie")}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-[1.05]">
                {profile.name}.
              </h1>
              <p className="text-foreground/60 text-base mt-3">
                {[profile.age && `${profile.age}`, genderLabel, workLabel].filter(Boolean).join(" • ")}
                {profile.nationality && ` • ${profile.nationality}`}
              </p>
            </div>

            <div className="border-t border-border/60" />

            {/* About me */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-foreground/40" />
                <h2 className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("userProfile.aboutMe")}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {profile.bio ? (
                  showFullBio || profile.bio.length <= 200
                    ? profile.bio
                    : `${profile.bio.substring(0, 200)}...`
                ) : (
                  t("userProfile.noDescription")
                )}
              </p>
              {profile.bio && profile.bio.length > 200 && (
                <button
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="mt-2 text-foreground font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  {showFullBio ? t("userProfile.showLess") : t("userProfile.readMore")}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Personality */}
            {personality.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-foreground/40" />
                  <h2 className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("userProfile.personality")}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {personality.map((item) => (
                    <span
                      key={item}
                      className="px-4 py-2 rounded-full text-sm font-medium bg-card border border-border flex items-center gap-2"
                    >
                      <span className={`w-2 h-2 rounded-full ${getPersonalityColor(item)}`}></span>
                      {tt(item)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Lifestyle */}
            {lifestyle.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-foreground/40" />
                  <h2 className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("userProfile.lifestyle")}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lifestyle.map((item) => (
                    <span
                      key={item}
                      className="px-4 py-2 rounded-full text-sm font-medium bg-card border border-border flex items-center gap-2"
                    >
                      <span className={`w-2 h-2 rounded-full ${getLifestyleColor(item)}`}></span>
                      {tt(item)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-foreground/40" />
                  <h2 className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("userProfile.languages")}</h2>
                </div>
                <p className="text-muted-foreground">{languages.join(", ")}</p>
              </div>
            )}

            {/* Nationality */}
            {profile.nationality && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-foreground/40" />
                  <h2 className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("userProfile.nationality")}</h2>
                </div>
                <p className="text-muted-foreground">{profile.nationality}</p>
              </div>
            )}

            {/* Rent Preferences */}
            {isRoomie && (profile.monthly_budget || profile.rental_period) && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-foreground/40" />
                  <h2 className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("userProfile.rentalPreferences")}</h2>
                </div>
                <div className="space-y-1">
                  {profile.monthly_budget && (
                    <p className="text-muted-foreground">
                      {t("userProfile.monthlyBudget")} <span className="font-semibold text-foreground">{profile.monthly_budget.toLocaleString()} kr.</span>
                    </p>
                  )}
                  {profile.rental_period && (
                    <p className="text-muted-foreground">
                      {t("userProfile.rentalPeriod")} <span className="font-semibold text-foreground">
                        {tt(rentalPeriodOptions.find(o => o.value === profile.rental_period)?.label || profile.rental_period)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Landlord Listings - Right column */}
            {!isRoomie && landlordProperties.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-foreground/40" />
                  <h2 className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">{t("userProfile.listings")}</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {landlordProperties.map((property) => (
                    <div 
                      key={property.id}
                      onClick={() => navigate(`/property/${property.id}`)}
                      className="cursor-pointer group"
                    >
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
                        {property.images && property.images.length > 0 ? (
                          <img 
                            src={property.images[0]} 
                            alt={property.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <span className="text-muted-foreground text-sm">{t("userProfile.noImage")}</span>
                          </div>
                        )}
                        <button 
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Heart className="w-4 h-4 text-foreground" />
                        </button>
                        {/* Owner avatar overlay */}
                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-muted overflow-hidden border-2 border-background">
                            {profile.avatar_url ? (
                              <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-3 h-3 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-white font-medium">{profile.name}</span>
                        </div>
                        {/* Image dots indicator */}
                        {property.images && property.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 flex gap-1">
                            {property.images.slice(0, 4).map((_, idx) => (
                              <div key={idx} className={`w-1 h-1 rounded-full ${idx === 0 ? 'bg-white' : 'bg-white/50'}`} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{property.title}</h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>{property.is_furnished ? t("userProfile.furnished") : t("userProfile.unfurnished")}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-foreground text-sm">{property.monthly_rent.toLocaleString()} kr</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {!isMobile && <Footer />}
      </div>
    </AppLayout>
  );
};

export default Profile;
