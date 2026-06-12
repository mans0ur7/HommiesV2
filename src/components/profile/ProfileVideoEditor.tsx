import { useRef, useState } from "react";
import { Video, Trash2, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ProfileVideo from "./ProfileVideo";
import { toast } from "sonner";
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

interface ProfileVideoEditorProps {
  value: string | null;
  onChange: (url: string | null) => void;
  userId: string;
  poster?: string | null;
}

const MAX_SECONDS = 20;
const MAX_BYTES = 40 * 1024 * 1024;

/** Udtrækker storage-stien fra en public URL (delen efter "/profile-videos/"). */
const pathFromUrl = (url: string): string | null => {
  const marker = "/profile-videos/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
};

/** Optag/upload en kort video-intro (<=20s). Uploader straks ved valg. */
const ProfileVideoEditor = ({ value, onChange, userId, poster }: ProfileVideoEditorProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  /** Måler varighed. Resolver null hvis den ikke kan bestemmes (fejl/timeout). */
  const probeDuration = (file: File) =>
    new Promise<number | null>((resolve) => {
      const el = document.createElement("video");
      const objectUrl = URL.createObjectURL(file);
      let settled = false;
      const finish = (duration: number | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        URL.revokeObjectURL(objectUrl);
        resolve(duration);
      };
      const timer = setTimeout(() => finish(null), 5000);
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        if (Number.isFinite(el.duration)) {
          finish(el.duration);
          return;
        }
        // Nogle optagelser (fx MediaRecorder-webm) rapporterer Infinity,
        // indtil der seekes forbi slutningen — standard-workaround:
        el.ondurationchange = () => {
          if (Number.isFinite(el.duration)) finish(el.duration);
        };
        el.ontimeupdate = () => {
          if (Number.isFinite(el.duration)) finish(el.duration);
        };
        el.currentTime = 1e101;
      };
      el.onerror = () => finish(null);
      el.src = objectUrl;
    });

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting same file
    if (!file) return;

    if (file.size > MAX_BYTES) {
      toast.error("Videoen er for stor (maks 40 MB)");
      return;
    }
    const duration = await probeDuration(file);
    // null = ukendt varighed → tillad (40 MB-grænsen gælder stadig)
    if (duration !== null && duration > MAX_SECONDS + 1) {
      toast.error(`Videoen må højst være ${MAX_SECONDS} sekunder`);
      return;
    }

    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-videos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        console.error("[video] upload failed", uploadError);
        if (/mime|type/i.test(uploadError.message || "")) {
          toast.error("Videoformatet understøttes ikke — brug MP4 eller MOV.");
        } else {
          toast.error("Kunne ikke uploade videoen. Prøv igen.");
        }
        return;
      }

      const { data } = supabase.storage.from("profile-videos").getPublicUrl(path);
      const { error: dbError } = await supabase
        .from("profiles")
        .update({ video_url: data.publicUrl } as any)
        .eq("user_id", userId);
      if (dbError) {
        console.error("[video] persist failed", dbError);
        // Ryd op: fjern den netop uploadede fil igen (best effort)
        try {
          await supabase.storage.from("profile-videos").remove([path]);
        } catch {
          /* best effort */
        }
        toast.error("Kunne ikke gemme videoen på din profil. Prøv igen.");
        return;
      }

      onChange(data.publicUrl);
      toast.success("Video-intro gemt på din profil 🎥");
    } catch (err) {
      console.error("[video] upload failed", err);
      toast.error("Kunne ikke uploade videoen. Prøv igen.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    setRemoving(true);
    try {
      // Slet filen i storage (best effort — bloker ikke hvis det fejler)
      const path = pathFromUrl(value);
      if (path) {
        try {
          await supabase.storage.from("profile-videos").remove([path]);
        } catch {
          /* best effort */
        }
      }
      const { error } = await supabase
        .from("profiles")
        .update({ video_url: null } as any)
        .eq("user_id", userId);
      if (error) throw error;
      onChange(null);
      toast.success("Video-intro fjernet");
    } catch (err) {
      console.error("[video] remove failed", err);
      toast.error("Kunne ikke fjerne videoen. Prøv igen.");
    } finally {
      setRemoving(false);
    }
  };

  if (value) {
    return (
      <div className="space-y-3">
        <ProfileVideo url={value} poster={poster} />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              disabled={removing}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive hover:underline disabled:opacity-60"
            >
              {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Fjern video
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Fjern video-intro?</AlertDialogTitle>
              <AlertDialogDescription>
                Videoen slettes fra din profil. Du kan altid uploade en ny.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuller</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemove}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Fjern
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
        onChange={handleSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 py-8 text-sm font-medium text-foreground/70 hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-60"
      >
        {uploading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Uploader video… det kan tage et øjeblik
          </>
        ) : (
          <>
            <span className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
              <Video className="w-6 h-6 text-secondary-foreground" />
            </span>
            <span className="flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Tilføj en kort video-intro
            </span>
            <span className="text-xs text-muted-foreground font-normal">Maks {MAX_SECONDS} sek · vis dig selv</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ProfileVideoEditor;
