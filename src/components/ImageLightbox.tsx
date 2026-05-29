import { useEffect, useState, TouchEvent } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  startIndex?: number;
  open: boolean;
  onClose: () => void;
}

const ImageLightbox = ({ images, startIndex = 0, open, onClose }: ImageLightboxProps) => {
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [touches, setTouches] = useState<number | null>(null);

  useEffect(() => {
    if (open) setIndex(startIndex);
    if (open) setScale(1);
  }, [open, startIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

  // Pinch-to-zoom (single-finger double-tap also toggles between 1x and 2x)
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      setTouches(Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY));
    }
  };
  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && touches) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      setScale(Math.min(4, Math.max(1, (dist / touches))));
    }
  };
  const onTouchEnd = () => setTouches(null);

  const handleDoubleTap = () => setScale((s) => (s === 1 ? 2 : 1));

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 md:left-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 md:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      <img
        src={images[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={handleDoubleTap}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="max-w-full max-h-[90vh] object-contain transition-transform duration-200 select-none"
        style={{ transform: `scale(${scale})` }}
        draggable={false}
      />

      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-xs">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

export default ImageLightbox;
