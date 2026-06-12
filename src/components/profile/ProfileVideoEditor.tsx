import { useRef, useState } from "react";
import { Video, Trash2, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ProfileVideo from "./ProfileVideo";
import { toast } from "sonner";

interface ProfileVideoEditorProps {
  value: string | null;
  onChange: (url: string | null) => void;
  userId: string;
  poster?: string | null;
}

const MAX_SECONDS = 20;
const MAX_BYTES = 40 * 1024 * 1024;

/** Optag/upload en kort video-intro (<=20s). Uploader straks ved valg. */
const ProfileVideoEditor = ({ value, onChange, userId, poster }: ProfileVideoEditorProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const probeDuration = (file: File) =>
    new Promise<number>((resolve) => {
      const el = document.createElement("video");
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        URL.revokeObjectURL(el.src);
        resolve(el.duration || 0);
      };
      el.onerror = () => resolve(0);
      el.src = URL.createObjectURL(file);
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
    if (duration > MAX_SECONDS + 1) {
      toast.error(`Videoen må højst være ${MAX_SECONDS} sekunder`);
      return;
    }

    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("profile-videos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("profile-videos").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Video uploadet 🎥");
    } catch (err) {
      console.error("[video] upload failed", err);
      toast.error("Kunne ikke uploade videoen. Prøv igen.");
    } finally {
      setUploading(false);
    }
  };

  if (value) {
    return (
      <div className="space-y-3">
        <ProfileVideo url={value} poster={poster} />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive hover:underline"
        >
          <Trash2 className="w-4 h-4" />
          Fjern video
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        capture="user"
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
            Uploader…
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
