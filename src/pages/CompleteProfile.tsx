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
import { useToast } from "@/hooks/use-toast";
import { Upload, User, LogOut } from "lucide-react";
import hommiesLogo from "@/assets/hommies-logo.png";
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

const workOptions = [
  { value: "student", labelKey: "profile.workStudent" },
  { value: "employed", labelKey: "profile.workEmployed" },
  { value: "self-employed", labelKey: "profile.workSelfEmployed" },
  { value: "unemployed", labelKey: "profile.workUnemployed" },
  { value: "other", labelKey: "profile.workOther" },
];

import { allNationalities } from "@/data/nationalities";

const genderOptions = [
  { value: "male", labelKey: "matches.male" },
  { value: "female", labelKey: "matches.female" },
  { value: "other", labelKey: "matches.other" },
];

const CompleteProfile = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [study, setStudy] = useState("");
  const [work, setWork] = useState("");
  const [workOther, setWorkOther] = useState("");
  const [nationality, setNationality] = useState("");
  const [nationalitySearch, setNationalitySearch] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const filteredNationalities = nationalitySearch
    ? allNationalities.filter(n => n.toLowerCase().includes(nationalitySearch.toLowerCase()))
    : allNationalities;

  // Calculate age from birthday
  const calculateAge = (birthDate: string): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else if (profile) {
      navigate("/");
    }
  }, [user, profile, navigate]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!firstName.trim()) {
      toast({
        variant: "destructive",
        title: t("profile.firstNameRequired"),
        description: t("profile.firstNameRequiredBody"),
      });
      return;
    }

    if (!lastName.trim()) {
      toast({
        variant: "destructive",
        title: t("profile.lastNameRequired"),
        description: t("profile.lastNameRequiredBody"),
      });
      return;
    }

    if (!birthday) {
      toast({
        variant: "destructive",
        title: t("profile.birthdayRequired"),
        description: t("profile.birthdayRequiredBody"),
      });
      return;
    }

    if (!gender) {
      toast({
        variant: "destructive",
        title: t("profile.genderRequired"),
        description: t("profile.genderRequiredBody"),
      });
      return;
    }

    // Check for incomplete optional fields
    const hasIncompleteOptionalFields = !work || !nationality || !bio.trim();

    if (hasIncompleteOptionalFields && !pendingSubmit) {
      setShowIncompleteDialog(true);
      return;
    }

    await saveProfile();
  };

  const saveProfile = async () => {
    if (!user) return;
    
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    setIsLoading(true);
    setPendingSubmit(false);

    try {
      let avatarUrl = null;

      // Upload avatar if provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile);

        if (uploadError) {
          console.error("Avatar upload error:", uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(fileName);
          avatarUrl = urlData.publicUrl;
        }
      }

      // Get userType from sessionStorage (set during registration). Keep it until
      // the insert succeeds so a failed attempt + retry doesn't silently turn a
      // landlord into a roomie (user_type is only ever set here).
      const userType = sessionStorage.getItem("selectedUserType") || "roomie";

      // Create profile
      const { error } = await supabase.from("profiles").insert({
        user_id: user.id,
        name: fullName,
        age: calculateAge(birthday),
        gender: gender || null,
        study: study.trim() || null,
        work: work || null,
        work_other: (work === "employed" || work === "self-employed" || work === "other") ? workOther.trim() : null,
        nationality: nationality || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
        user_type: userType,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: t("profile.error"),
          description: t("profile.errorCreate"),
        });
        console.error("Profile creation error:", error);
      } else {
        // Only clear the chosen user type once the profile actually saved.
        sessionStorage.removeItem("selectedUserType");
        await refreshProfile();
        toast({
          title: t("profile.created"),
          description: t("profile.welcome"),
        });
        navigate("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background pb-6 sm:pb-12 px-4"
      style={{ paddingTop: "calc(var(--safe-top) + 1.5rem)" }}
    >
      <div className="w-full max-w-lg mx-auto">
        {/* Top bar — centered logo + small log out (no back button — this is the only screen until profile is finished) */}
        <div className="flex items-center justify-center relative mb-6 sm:mb-8">
          <img src={hommiesLogo} alt="Hommies" className="h-8" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={async () => { await signOut(); navigate("/auth"); }}
            className="absolute right-0 text-foreground/60 hover:text-foreground"
            aria-label={t("menu.logout")}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <div className="mb-6 sm:mb-8">
          <span className="inline-flex items-center gap-2 mb-4">
            <span className="h-px w-8 bg-foreground/40" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/60">
              {t("profile.tellAboutYou")}
            </span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">{t("profile.completeTitle")}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <label
                htmlFor="avatar"
                className="absolute bottom-0 right-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center cursor-pointer hover:bg-secondary/90 transition-colors"
              >
                <Upload className="w-4 h-4 text-secondary-foreground" />
              </label>
              <input
                type="file"
                id="avatar"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground">{t("profile.uploadAvatar")}</p>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t("profile.firstName")} *</Label>
              <Input
                id="firstName"
                placeholder={t("profile.firstNamePlaceholder")}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t("profile.lastName")} *</Label>
              <Input
                id="lastName"
                placeholder={t("profile.lastNamePlaceholder")}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Birthday */}
          <div className="space-y-2">
            <Label htmlFor="birthday">{t("profile.birthday")} *</Label>
            <Input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              required
            />
            {birthday && (
              <p className="text-sm text-muted-foreground">
                Alder: {calculateAge(birthday)} år
              </p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">Køn *</Label>
            <Select value={gender} onValueChange={setGender} required>
              <SelectTrigger>
                <SelectValue placeholder={t("profile.selectGender")} />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Work/Occupation Type */}
          <div className="space-y-2">
            <Label htmlFor="work">{t("profile.occupation")}</Label>
            <Select value={work} onValueChange={(value) => {
              setWork(value);
              // Reset the detail fields when changing occupation type
              setStudy("");
              setWorkOther("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder={t("profile.selectOccupation")} />
              </SelectTrigger>
              <SelectContent>
                {workOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conditional detail field based on occupation type */}
          {work === "student" && (
            <div className="space-y-2">
              <Label htmlFor="study">{t("profile.studyWhat")}</Label>
              <Input
                id="study"
                placeholder={t("profile.studyPlaceholder")}
                value={study}
                onChange={(e) => setStudy(e.target.value)}
              />
            </div>
          )}

          {work === "employed" && (
            <div className="space-y-2">
              <Label htmlFor="workOther">{t("profile.workWhat")}</Label>
              <Input
                id="workOther"
                placeholder={t("profile.workPlaceholder")}
                value={workOther}
                onChange={(e) => setWorkOther(e.target.value)}
              />
            </div>
          )}

          {work === "self-employed" && (
            <div className="space-y-2">
              <Label htmlFor="workOther">{t("profile.businessWhat")}</Label>
              <Input
                id="workOther"
                placeholder={t("profile.businessPlaceholder")}
                value={workOther}
                onChange={(e) => setWorkOther(e.target.value)}
              />
            </div>
          )}

          {work === "other" && (
            <div className="space-y-2">
              <Label htmlFor="workOther">{t("profile.otherWhat")}</Label>
              <Input
                id="workOther"
                placeholder={t("profile.otherPlaceholder")}
                value={workOther}
                onChange={(e) => setWorkOther(e.target.value)}
              />
            </div>
          )}

          {/* Nationality with search */}
          <div className="space-y-2">
            <Label htmlFor="nationality">{t("profile.nationality")}</Label>
            <Select value={nationality} onValueChange={setNationality}>
              <SelectTrigger>
                <SelectValue placeholder={t("profile.selectNationality")} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <div className="p-2">
                  <Input
                    placeholder={t("profile.searchNationality")}
                    value={nationalitySearch}
                    onChange={(e) => setNationalitySearch(e.target.value)}
                    className="mb-2"
                  />
                </div>
                {filteredNationalities.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">{t("profile.aboutMe")}</Label>
            <Textarea
              id="bio"
              placeholder={t("profile.bioPlaceholder")}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            disabled={isLoading}
          >
            {isLoading ? t("profile.saving") : t("profile.saveProfile")}
          </Button>
        </form>

        <AlertDialog open={showIncompleteDialog} onOpenChange={setShowIncompleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("profile.fillAll")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("profile.fillAllBody")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowIncompleteDialog(false)}>
                {t("profile.fillAllCta")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowIncompleteDialog(false);
                  setPendingSubmit(true);
                  // Trigger form submit again
                  setTimeout(() => {
                    const form = document.querySelector('form');
                    if (form) {
                      form.requestSubmit();
                    }
                  }, 0);
                }}
              >
                {t("profile.continueAnyway")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default CompleteProfile;
