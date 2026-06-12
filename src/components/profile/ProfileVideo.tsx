import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileVideoProps {
  url: string;
  poster?: string | null;
  className?: string;
}

/** Afspiller en kort video-intro. Tap for at afspille; viser et play-overlay indtil da. */
const ProfileVideo = ({ url, poster, className }: ProfileVideoProps) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <div className={cn("relative rounded-2xl overflow-hidden bg-black shadow-soft max-w-[280px]", className)}>
      <video
        ref={ref}
        src={url}
        poster={poster ?? undefined}
        playsInline
        controls={playing}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        className="w-full aspect-[9/16] max-h-[420px] object-cover"
      />
      {!playing && (
        <button
          onClick={toggle}
          aria-label="Afspil video"
          className="absolute inset-0 flex items-center justify-center bg-black/15 hover:bg-black/25 transition-colors"
        >
          <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 text-foreground ml-0.5 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
};

export default ProfileVideo;
