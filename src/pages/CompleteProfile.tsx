import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, User, ArrowLeft } from "lucide-react";
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
  { value: "student", label: "Studerende" },
  { value: "employed", label: "Ansat" },
  { value: "self-employed", label: "Selvstændig" },
  { value: "unemployed", label: "Arbejdsløs" },
  { value: "other", label: "Andet" },
];

import { allNationalities } from "@/data/nationalities";

const genderOptions = [
  { value: "male", label: "Mand" },
  { value: "female", label: "Kvinde" },
  { value: "other", label: "Andet" },
];

const CompleteProfile = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
        title: "Fornavn påkrævet",
        description: "Indtast venligst dit fornavn",
      });
      return;
    }

    if (!lastName.trim()) {
      toast({
        variant: "destructive",
        title: "Efternavn påkrævet",
        description: "Indtast venligst dit efternavn",
      });
      return;
    }

    if (!birthday) {
      toast({
        variant: "destructive",
        title: "Fødselsdag påkrævet",
        description: "Indtast venligst din fødselsdag",
      });
      return;
    }

    if (!gender) {
      toast({
        variant: "destructive",
        title: "Køn påkrævet",
        description: "Vælg venligst dit køn",
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

      // Get userType from sessionStorage (set during registration)
      const userType = sessionStorage.getItem("selectedUserType") || "roomie";
      sessionStorage.removeItem("selectedUserType");

      // Create profile
      const { error } = await supabase.from("profiles").insert({
        user_id: user.id,
        name: fullName,
        age: calculateAge(birthday),
        gender: gender || null,
        study: study.trim() || null,
        work: work || null,
        work_other: work === "other" ? workOther.trim() : null,
        nationality: nationality || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
        user_type: userType,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Fejl",
          description: "Kunne ikke oprette profil. Prøv igen.",
        });
        console.error("Profile creation error:", error);
      } else {
        await refreshProfile();
        toast({
          title: "Profil oprettet!",
          description: "Velkommen til Hommies",
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
        <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={async () => { await signOut(); navigate("/auth"); }}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center flex-1 pr-10">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Færdiggør din profil</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Fortæl os lidt om dig selv
            </p>
          </div>
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
            <p className="text-sm text-muted-foreground">Upload profilbillede (valgfrit)</p>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Fornavn *</Label>
              <Input
                id="firstName"
                placeholder="Dit fornavn"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Efternavn *</Label>
              <Input
                id="lastName"
                placeholder="Dit efternavn"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Birthday */}
          <div className="space-y-2">
            <Label htmlFor="birthday">Fødselsdag *</Label>
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
                <SelectValue placeholder="Vælg køn" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Work/Occupation Type */}
          <div className="space-y-2">
            <Label htmlFor="work">Beskæftigelse</Label>
            <Select value={work} onValueChange={(value) => {
              setWork(value);
              // Reset the detail fields when changing occupation type
              setStudy("");
              setWorkOther("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg beskæftigelse" />
              </SelectTrigger>
              <SelectContent>
                {workOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conditional detail field based on occupation type */}
          {work === "student" && (
            <div className="space-y-2">
              <Label htmlFor="study">Hvad studerer du?</Label>
              <Input
                id="study"
                placeholder="F.eks. Økonomi på CBS"
                value={study}
                onChange={(e) => setStudy(e.target.value)}
              />
            </div>
          )}

          {work === "employed" && (
            <div className="space-y-2">
              <Label htmlFor="workOther">Hvad arbejder du med?</Label>
              <Input
                id="workOther"
                placeholder="F.eks. Marketing hos Novo Nordisk"
                value={workOther}
                onChange={(e) => setWorkOther(e.target.value)}
              />
            </div>
          )}

          {work === "self-employed" && (
            <div className="space-y-2">
              <Label htmlFor="workOther">Hvad er din virksomhed/branche?</Label>
              <Input
                id="workOther"
                placeholder="F.eks. Freelance webdesigner"
                value={workOther}
                onChange={(e) => setWorkOther(e.target.value)}
              />
            </div>
          )}

          {work === "other" && (
            <div className="space-y-2">
              <Label htmlFor="workOther">Beskriv din beskæftigelse</Label>
              <Input
                id="workOther"
                placeholder="Hvad laver du?"
                value={workOther}
                onChange={(e) => setWorkOther(e.target.value)}
              />
            </div>
          )}

          {/* Nationality with search */}
          <div className="space-y-2">
            <Label htmlFor="nationality">Nationalitet</Label>
            <Select value={nationality} onValueChange={setNationality}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg nationalitet" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <div className="p-2">
                  <Input
                    placeholder="Søg nationalitet..."
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
            <Label htmlFor="bio">Om mig</Label>
            <Textarea
              id="bio"
              placeholder="Fortæl lidt om dig selv, dine interesser, hvad du leder efter i et hjem..."
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
            {isLoading ? "Gemmer..." : "Gem profil"}
          </Button>
        </form>

        <AlertDialog open={showIncompleteDialog} onOpenChange={setShowIncompleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Udfyld alle felter?</AlertDialogTitle>
              <AlertDialogDescription>
                Du har ikke udfyldt alle felter. Når du udfylder beskæftigelse, nationalitet og "om mig", øger det chancen for at finde det perfekte match – både for udlejere og roomies!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowIncompleteDialog(false)}>
                Udfyld felter
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
                Fortsæt alligevel
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default CompleteProfile;
