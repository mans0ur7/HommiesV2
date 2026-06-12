import { useRef, useState } from "react";
import { Play, Loader2, VideoOff } from "lucide-react";
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
  const [buffering, setBuffering] = useState(false);
  const [failed, setFailed] = useState(false);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play()
        .then(() => setPlaying(true))
        .catch(() => {
          setPlaying(false);
        });
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  if (failed) {
    return (
      <div className={cn("rounded-2xl overflow-hidden bg-muted shadow-soft max-w-[280px]", className)}>
        <div className="w-full aspect-[9/16] max-h-[420px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <VideoOff className="w-8 h-8" />
          <span className="text-sm">Videoen kunne ikke afspilles</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary/70 shadow-soft max-w-[280px]", className)}>
      <video
        ref={ref}
        src={url}
        poster={poster ?? undefined}
        playsInline
        controls={playing}
        onPlay={() => setPlaying(true)}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
        onError={() => setFailed(true)}
        className="w-full aspect-[9/16] max-h-[420px] object-cover"
      />
      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-8 h-8 text-white animate-spin drop-shadow" />
        </div>
      )}
      {!playing && (
        <button
          onClick={toggle}
          aria-label="Afspil video"
          className="absolute inset-0 flex items-center justify-center bg-black/15 hover:bg-black/25 transition-colors"
        >
          <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95">
            <Play className="w-6 h-6 text-foreground ml-0.5 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
};

export default ProfileVideo;
